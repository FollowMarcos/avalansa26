import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { getReferenceImageUrls, uploadImageFromUrl } from '@/utils/supabase/storage.server';
import { saveGeneration } from '@/utils/supabase/generations.server';

// Allow up to 5 minutes for image editing
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MultiAngleRequest {
  apiId: string;
  imageUrls?: string[];
  imageStoragePaths?: string[];
  horizontalAngle: number;
  verticalAngle: number;
  zoom: number;
  loraScale?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  additionalPrompt?: string;
  numImages?: number;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

interface MultiAngleResponse {
  success: boolean;
  images?: Array<{ url: string }>;
  error?: string;
  seed?: number;
}

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

const API_REQUEST_TIMEOUT = 120_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeout / 1000} seconds`);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// POST /api/multi-angle
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse<MultiAngleResponse>> {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate
    const body: MultiAngleRequest = await request.json();
    const {
      apiId,
      imageUrls: rawImageUrls,
      imageStoragePaths,
      horizontalAngle,
      verticalAngle,
      zoom,
      loraScale = 1,
      guidanceScale = 1,
      numInferenceSteps = 4,
      additionalPrompt = '',
      numImages = 1,
      outputFormat = 'png',
    } = body;

    // --- Validation ---
    if (!apiId || typeof apiId !== 'string') {
      return NextResponse.json({ success: false, error: 'API ID is required' }, { status: 400 });
    }

    // Resolve image URLs from either direct URLs or storage paths
    let imageUrls: string[] = [];

    if (rawImageUrls && rawImageUrls.length > 0) {
      imageUrls = rawImageUrls;
    } else if (imageStoragePaths && imageStoragePaths.length > 0) {
      // Validate paths
      for (const path of imageStoragePaths) {
        if (typeof path !== 'string' || path.includes('..') || path.startsWith('/')) {
          return NextResponse.json(
            { success: false, error: 'Invalid image storage path' },
            { status: 400 },
          );
        }
      }
      const resolved = await getReferenceImageUrls(imageStoragePaths);
      imageUrls = resolved.map((r) => r.url);
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' },
        { status: 400 },
      );
    }

    if (imageUrls.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 images allowed' },
        { status: 400 },
      );
    }

    if (typeof horizontalAngle !== 'number' || horizontalAngle < 0 || horizontalAngle > 360) {
      return NextResponse.json(
        { success: false, error: 'Horizontal angle must be between 0 and 360' },
        { status: 400 },
      );
    }

    if (typeof verticalAngle !== 'number' || verticalAngle < -30 || verticalAngle > 60) {
      return NextResponse.json(
        { success: false, error: 'Vertical angle must be between -30 and 60' },
        { status: 400 },
      );
    }

    if (typeof zoom !== 'number' || zoom < 0 || zoom > 10) {
      return NextResponse.json(
        { success: false, error: 'Zoom must be between 0 and 10' },
        { status: 400 },
      );
    }

    if (numImages < 1 || numImages > 4 || !Number.isInteger(numImages)) {
      return NextResponse.json(
        { success: false, error: 'Number of images must be between 1 and 4' },
        { status: 400 },
      );
    }

    if (!['png', 'jpeg', 'webp'].includes(outputFormat)) {
      return NextResponse.json(
        { success: false, error: 'Output format must be png, jpeg, or webp' },
        { status: 400 },
      );
    }

    // Get API config
    const apiConfig = await getApiConfig(apiId);
    if (!apiConfig) {
      return NextResponse.json(
        { success: false, error: 'API not found or access denied' },
        { status: 404 },
      );
    }

    // Get decrypted API key
    const apiKey = await getDecryptedApiKey(apiId);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve API credentials' },
        { status: 500 },
      );
    }

    // Build fal.ai request
    const falRequestBody: Record<string, unknown> = {
      image_urls: imageUrls,
      horizontal_angle: horizontalAngle,
      vertical_angle: verticalAngle,
      zoom,
      lora_scale: loraScale,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      num_images: numImages,
      output_format: outputFormat,
    };

    if (additionalPrompt) {
      falRequestBody.additional_prompt = additionalPrompt;
    }

    const falEndpoint = 'https://fal.run/fal-ai/qwen-image-edit-2511-multiple-angles';

    const response = await fetchWithTimeout(falEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(falRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Multi-Angle] Fal.ai API error:', errorText);
      throw new Error(`Fal.ai API error: ${errorText}`);
    }

    const data = await response.json();

    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from multi-angle generation');
    }

    // Re-upload images to Supabase storage
    const processedImages: Array<{ url: string }> = [];

    for (const img of data.images) {
      const { url, path, error } = await uploadImageFromUrl(img.url, user.id);
      if (error) {
        console.error('[Multi-Angle] Failed to re-upload image:', error);
      }

      processedImages.push({ url });

      // Save to generation history
      await saveGeneration({
        user_id: user.id,
        api_config_id: apiId,
        prompt: additionalPrompt || `Multi-angle: H${horizontalAngle}° V${verticalAngle}° Z${zoom}`,
        image_url: url,
        image_path: path,
        settings: {
          outputCount: numImages,
          model: 'qwen-image-edit-2511-multiple-angles',
          source: 'multiAngle',
        },
      });
    }

    return NextResponse.json({
      success: true,
      images: processedImages,
      seed: data.seed,
    });
  } catch (error) {
    console.error('[Multi-Angle] Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Multi-angle generation failed. Please try again.',
      },
      { status: 500 },
    );
  }
}
