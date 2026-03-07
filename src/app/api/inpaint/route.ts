import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { uploadGeneratedImage, uploadImageFromUrl } from '@/utils/supabase/storage.server';
import { saveGeneration } from '@/utils/supabase/generations.server';

export const maxDuration = 300;

interface InpaintRequest {
  apiId: string;
  sourceImagePath: string;
  maskDataUrl: string;
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
}

interface InpaintResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * POST /api/inpaint
 *
 * Inpaint an image using the selected API provider.
 * Routes to Gemini (Google) or Fal.ai based on the API config.
 * Takes a source image, a mask (white = area to regenerate), and a prompt.
 */
export async function POST(request: NextRequest): Promise<NextResponse<InpaintResponse>> {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: InpaintRequest = await request.json();
    const { apiId, sourceImagePath, maskDataUrl, prompt, negativePrompt, imageSize } = body;

    // Validate inputs
    if (!apiId) {
      return NextResponse.json(
        { success: false, error: 'API ID is required' },
        { status: 400 }
      );
    }
    if (!sourceImagePath) {
      return NextResponse.json(
        { success: false, error: 'Source image is required' },
        { status: 400 }
      );
    }
    if (!maskDataUrl || !maskDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Valid mask image is required' },
        { status: 400 }
      );
    }
    if (!prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get API configuration
    const apiConfig = await getApiConfig(apiId);
    if (!apiConfig) {
      return NextResponse.json(
        { success: false, error: 'API not found or access denied' },
        { status: 404 }
      );
    }

    // Decrypt the API key
    const apiKey = await getDecryptedApiKey(apiConfig.id);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    let resultImageUrl: string | undefined;
    let resultBase64: string | undefined;

    // Route to provider
    if (apiConfig.provider === 'google') {
      // ================================================================
      // GEMINI INPAINTING — send source + mask as inline data
      // ================================================================
      const { getImagesAsBase64 } = await import('@/utils/supabase/storage.server');

      // Get source image as base64
      let sourceBase64: string;
      if (sourceImagePath.startsWith('data:')) {
        sourceBase64 = sourceImagePath;
      } else if (sourceImagePath.startsWith('http')) {
        // Fetch and convert to base64
        const imgResponse = await fetch(sourceImagePath);
        if (!imgResponse.ok) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch source image' },
            { status: 500 }
          );
        }
        const buffer = await imgResponse.arrayBuffer();
        const contentType = imgResponse.headers.get('content-type') || 'image/png';
        sourceBase64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
      } else {
        // Storage path — resolve to base64
        const images = await getImagesAsBase64([sourceImagePath]);
        if (!images[0]) {
          return NextResponse.json(
            { success: false, error: 'Failed to load source image' },
            { status: 500 }
          );
        }
        sourceBase64 = images[0];
      }

      // Parse base64 data from data URLs
      const parseBase64 = (dataUrl: string) => {
        const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const data = mimeMatch ? dataUrl.replace(/^data:[^;]+;base64,/, '') : dataUrl;
        return { mimeType, data };
      };

      const source = parseBase64(sourceBase64);
      const mask = parseBase64(maskDataUrl);

      // Build Gemini request with source image + mask + editing instructions
      const editPrompt = negativePrompt
        ? `Edit this image: In the areas marked white in the mask, replace the content with: ${prompt.trim()}. Avoid: ${negativePrompt}. Keep all other areas exactly as they are in the original image.`
        : `Edit this image: In the areas marked white in the mask, replace the content with: ${prompt.trim()}. Keep all other areas exactly as they are in the original image.`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: editPrompt },
        { text: 'SOURCE IMAGE (edit this image):' },
        { inlineData: { mimeType: source.mimeType, data: source.data } },
        { text: 'MASK (white areas = regions to edit, black = keep unchanged):' },
        { inlineData: { mimeType: mask.mimeType, data: mask.data } },
      ];

      const model = apiConfig.model_id || 'gemini-3-pro-image-preview';
      const apiEndpoint = apiConfig.endpoint ||
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody = {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      };

      console.log('[Inpaint] Calling Gemini with:', {
        model,
        hasSourceImage: true,
        hasMask: true,
        prompt: prompt.slice(0, 100),
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Inpaint] Gemini error:', errorText);
        if (response.status === 429) {
          return NextResponse.json(
            { success: false, error: 'Rate limit reached. Please wait a moment.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Inpainting failed. Please try again.' },
          { status: 500 }
        );
      }

      const data = await response.json();

      // Check for safety blocks
      if (data.promptFeedback?.blockReason) {
        return NextResponse.json(
          { success: false, error: `Content blocked: ${data.promptFeedback.blockReason}` },
          { status: 400 }
        );
      }

      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
        return NextResponse.json(
          { success: false, error: 'Image blocked by safety filters. Try a different prompt.' },
          { status: 400 }
        );
      }

      // Extract image from response
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            resultBase64 = part.inlineData.data;
            resultImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!resultImageUrl) {
        return NextResponse.json(
          { success: false, error: 'No image returned from inpainting' },
          { status: 500 }
        );
      }

    } else if (apiConfig.provider === 'fal') {
      // ================================================================
      // FAL.AI INPAINTING
      // ================================================================

      // Upload mask to storage so Fal can access it via URL
      const maskUploadResult = await uploadGeneratedImage(maskDataUrl, user.id, 'image/png');
      if (!maskUploadResult?.url) {
        return NextResponse.json(
          { success: false, error: 'Failed to upload mask image' },
          { status: 500 }
        );
      }

      // Resolve source image URL
      let sourceImageUrl = sourceImagePath;
      if (!sourceImagePath.startsWith('http')) {
        const { getReferenceImageUrls } = await import('@/utils/supabase/storage.server');
        const urls = await getReferenceImageUrls([sourceImagePath]);
        sourceImageUrl = urls[0]?.url || sourceImagePath;
      }

      // Build inpainting endpoint from model_id or use apiConfig endpoint
      const modelId = apiConfig.model_id || 'fal-ai/flux-pro/v1.1';
      const inpaintEndpoint = apiConfig.endpoint
        ? apiConfig.endpoint.replace(/\/?$/, '/inpainting')
        : `https://fal.run/${modelId}/inpainting`;

      const falBody: Record<string, unknown> = {
        image_url: sourceImageUrl,
        mask_url: maskUploadResult.url,
        prompt: prompt.trim(),
        image_size: imageSize === '4K' ? { width: 2048, height: 2048 }
          : imageSize === '2K' ? { width: 1024, height: 1024 }
          : imageSize === '1K' ? { width: 768, height: 768 }
          : { width: 1024, height: 1024 },
        num_images: 1,
        strength: 0.95,
      };

      if (negativePrompt) {
        falBody.negative_prompt = negativePrompt;
      }

      console.log('[Inpaint] Calling Fal.ai with:', {
        endpoint: inpaintEndpoint,
        hasSourceImage: !!sourceImageUrl,
        hasMask: !!maskUploadResult.url,
        prompt: prompt.slice(0, 100),
      });

      const response = await fetch(inpaintEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify(falBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Inpaint] Fal.ai error:', errorText);
        if (response.status === 429) {
          return NextResponse.json(
            { success: false, error: 'Rate limit reached. Please wait a moment.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'Inpainting failed. Please try again.' },
          { status: 500 }
        );
      }

      const data = await response.json();
      resultImageUrl = data.images?.[0]?.url;

      if (!resultImageUrl) {
        return NextResponse.json(
          { success: false, error: 'No image returned from inpainting' },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { success: false, error: `Inpainting is not supported for provider: ${apiConfig.provider}` },
        { status: 400 }
      );
    }

    // Upload result to permanent storage
    let uploadResult;
    if (resultBase64) {
      // Gemini returns base64 — upload directly
      const dataUrl = resultImageUrl!;
      const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      uploadResult = await uploadGeneratedImage(dataUrl, user.id, mimeType);
    } else {
      // Fal returns a URL — download and re-upload
      uploadResult = await uploadImageFromUrl(resultImageUrl!, user.id);
    }

    // Save generation record
    if (uploadResult?.url) {
      await saveGeneration({
        user_id: user.id,
        api_config_id: apiId,
        prompt,
        negative_prompt: negativePrompt || null,
        image_url: uploadResult.url,
        image_path: uploadResult.path || null,
        settings: {
          imageSize: imageSize || '2K',
          source: 'inpaint',
        },
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadResult?.url || resultImageUrl,
    });
  } catch (error) {
    console.error('[Inpaint] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
