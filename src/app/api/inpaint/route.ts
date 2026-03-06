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
 * Inpaint an image using Fal.ai's inpainting model.
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

    // Upload mask to temporary storage so Fal.ai can access it via URL
    // uploadGeneratedImage expects base64 string (with or without data URL prefix)
    const maskUploadResult = await uploadGeneratedImage(
      maskDataUrl,
      user.id,
      'image/png'
    );

    if (!maskUploadResult?.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload mask image' },
        { status: 500 }
      );
    }

    // Determine the source image URL
    // sourceImagePath can be a full URL or a storage path
    let sourceImageUrl = sourceImagePath;
    if (!sourceImagePath.startsWith('http')) {
      // It's a storage path, resolve to URL
      const { getReferenceImageUrls } = await import('@/utils/supabase/storage.server');
      const urls = await getReferenceImageUrls([sourceImagePath]);
      sourceImageUrl = urls[0]?.url || sourceImagePath;
    }

    // Call Fal.ai inpainting API
    const inpaintEndpoint = 'https://fal.run/fal-ai/flux-pro/v1.1/inpainting';

    const requestBody: Record<string, unknown> = {
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
      requestBody.negative_prompt = negativePrompt;
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
      body: JSON.stringify(requestBody),
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
    const resultImageUrl = data.images?.[0]?.url;

    if (!resultImageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image returned from inpainting' },
        { status: 500 }
      );
    }

    // Upload result to permanent storage
    const uploadResult = await uploadImageFromUrl(resultImageUrl, user.id);

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
