import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { createBatchJob, submitGeminiBatchJob } from '@/utils/supabase/batch-jobs.server';
import type { BatchJobRequest } from '@/types/batch-job';

export interface GenerateRequest {
  apiId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  outputCount?: number;
  referenceImages?: string[]; // Base64 encoded images
  mode?: 'fast' | 'relaxed'; // Generation mode
}

export interface GeneratedImage {
  url: string;
  base64?: string;
}

export interface GenerateResponse {
  success: boolean;
  images?: GeneratedImage[];
  error?: string;
  // For batch/relaxed mode
  batchJobId?: string;
  mode?: 'fast' | 'relaxed';
  estimatedCompletion?: string;
}

/**
 * POST /api/generate
 *
 * Generate images using the specified API configuration.
 * The API key is decrypted server-side and never exposed to the client.
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    const { apiId, prompt, negativePrompt, aspectRatio, imageSize, outputCount = 1, referenceImages, mode = 'fast' } = body;

    if (!apiId) {
      return NextResponse.json(
        { success: false, error: 'API ID is required' },
        { status: 400 }
      );
    }

    if (!prompt && (!referenceImages || referenceImages.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Prompt or reference images required' },
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

    // Handle relaxed/batch mode for supported providers
    if (mode === 'relaxed' && apiConfig.provider === 'google') {
      // Create batch job requests
      const batchRequests: BatchJobRequest[] = [];
      for (let i = 0; i < outputCount; i++) {
        batchRequests.push({
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          referenceImages,
        });
      }

      // Create the batch job record
      const batchJob = await createBatchJob({
        user_id: user.id,
        api_config_id: apiId,
        requests: batchRequests,
      });

      if (!batchJob) {
        return NextResponse.json(
          { success: false, error: 'Failed to create batch job' },
          { status: 500 }
        );
      }

      // Submit to Gemini batch API
      const submitResult = await submitGeminiBatchJob(
        batchJob.id,
        apiId,
        batchRequests
      );

      if (!submitResult.success) {
        return NextResponse.json(
          { success: false, error: submitResult.error },
          { status: 500 }
        );
      }

      // Return batch job info (images will come later)
      return NextResponse.json({
        success: true,
        mode: 'relaxed',
        batchJobId: batchJob.id,
        estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Get decrypted API key for immediate generation
    const apiKey = await getDecryptedApiKey(apiId);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve API credentials' },
        { status: 500 }
      );
    }

    // Route to appropriate provider (fast mode)
    let images: GeneratedImage[];

    switch (apiConfig.provider) {
      case 'google':
        images = await generateWithGemini({
          apiKey,
          endpoint: apiConfig.endpoint,
          modelId: apiConfig.model_id,
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          outputCount,
          referenceImages,
        });
        break;

      case 'fal':
        images = await generateWithFal({
          apiKey,
          endpoint: apiConfig.endpoint,
          modelId: apiConfig.model_id,
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          outputCount,
          referenceImages,
        });
        break;

      case 'openai':
        images = await generateWithOpenAI({
          apiKey,
          endpoint: apiConfig.endpoint,
          modelId: apiConfig.model_id,
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          outputCount,
        });
        break;

      case 'stability':
        images = await generateWithStability({
          apiKey,
          endpoint: apiConfig.endpoint,
          modelId: apiConfig.model_id,
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          outputCount,
        });
        break;

      default:
        // Generic/custom provider - just call the endpoint directly
        images = await generateWithCustomProvider({
          apiKey,
          endpoint: apiConfig.endpoint,
          modelId: apiConfig.model_id,
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          outputCount,
          referenceImages,
        });
    }

    return NextResponse.json({ success: true, images, mode: 'fast' });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// Provider-specific implementations

interface ProviderParams {
  apiKey: string;
  endpoint: string;
  modelId: string | null;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  outputCount: number;
  referenceImages?: string[];
}

/**
 * Generate images using Google Gemini API
 */
async function generateWithGemini(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, outputCount, referenceImages } = params;

  // Build the request for Gemini 3 Pro Image
  const fullPrompt = negativePrompt
    ? `${prompt}\n\nAvoid: ${negativePrompt}`
    : prompt;

  // Prepare parts array
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: fullPrompt }
  ];

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    for (const base64Image of referenceImages) {
      // Extract mime type from base64 string if it includes data URL prefix
      const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const data = mimeMatch ? base64Image.replace(/^data:[^;]+;base64,/, '') : base64Image;

      parts.push({
        inlineData: {
          mimeType,
          data,
        }
      });
    }
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ['image', 'text'],
      responseMimeType: 'image/png',
    },
  };

  // Use the configured endpoint or default to Gemini API
  const apiEndpoint = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-2.0-flash-exp-image-generation'}:generateContent`;

  const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();

  // Extract images from response
  const images: GeneratedImage[] = [];

  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        // Convert base64 to data URL
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        images.push({ url: dataUrl, base64: part.inlineData.data });
      }
    }
  }

  return images;
}

/**
 * Generate images using Fal.ai API
 */
async function generateWithFal(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount, referenceImages } = params;

  // Parse image size to dimensions
  const dimensions = parseImageSize(imageSize, aspectRatio);

  const requestBody: Record<string, unknown> = {
    prompt,
    negative_prompt: negativePrompt || '',
    num_images: outputCount,
    image_size: {
      width: dimensions.width,
      height: dimensions.height,
    },
  };

  // Add reference images for image-to-image if provided
  if (referenceImages && referenceImages.length > 0) {
    requestBody.image_url = referenceImages[0]; // Fal typically uses first reference
  }

  const apiEndpoint = endpoint || `https://fal.run/${modelId || 'fal-ai/flux/dev'}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fal.ai API error: ${error}`);
  }

  const data = await response.json();

  // Extract images from Fal response
  const images: GeneratedImage[] = [];

  if (data.images) {
    for (const img of data.images) {
      images.push({ url: img.url });
    }
  }

  return images;
}

/**
 * Generate images using OpenAI DALL-E API
 */
async function generateWithOpenAI(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, aspectRatio, imageSize, outputCount } = params;

  // Map aspect ratio to OpenAI sizes
  let size = '1024x1024';
  if (aspectRatio === '16:9') size = '1792x1024';
  else if (aspectRatio === '9:16') size = '1024x1792';

  const requestBody = {
    model: modelId || 'dall-e-3',
    prompt,
    n: Math.min(outputCount, 1), // DALL-E 3 only supports 1 image at a time
    size,
    response_format: 'url',
  };

  const apiEndpoint = endpoint || 'https://api.openai.com/v1/images/generations';

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  const images: GeneratedImage[] = [];
  if (data.data) {
    for (const img of data.data) {
      images.push({ url: img.url });
    }
  }

  return images;
}

/**
 * Generate images using Stability AI API
 */
async function generateWithStability(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount } = params;

  const dimensions = parseImageSize(imageSize, aspectRatio);

  const requestBody = {
    text_prompts: [
      { text: prompt, weight: 1 },
      ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : []),
    ],
    cfg_scale: 7,
    height: dimensions.height,
    width: dimensions.width,
    samples: outputCount,
  };

  const apiEndpoint = endpoint || `https://api.stability.ai/v1/generation/${modelId || 'stable-diffusion-xl-1024-v1-0'}/text-to-image`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stability API error: ${error}`);
  }

  const data = await response.json();

  const images: GeneratedImage[] = [];
  if (data.artifacts) {
    for (const artifact of data.artifacts) {
      const dataUrl = `data:image/png;base64,${artifact.base64}`;
      images.push({ url: dataUrl, base64: artifact.base64 });
    }
  }

  return images;
}

/**
 * Generic custom provider implementation
 */
async function generateWithCustomProvider(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount, referenceImages } = params;

  if (!endpoint) {
    throw new Error('Custom provider requires an endpoint URL');
  }

  const dimensions = parseImageSize(imageSize, aspectRatio);

  const requestBody = {
    model: modelId,
    prompt,
    negative_prompt: negativePrompt,
    width: dimensions.width,
    height: dimensions.height,
    num_outputs: outputCount,
    reference_images: referenceImages,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${error}`);
  }

  const data = await response.json();

  // Try to extract images from common response formats
  const images: GeneratedImage[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        images.push({ url: item });
      } else if (item.url) {
        images.push({ url: item.url, base64: item.base64 });
      }
    }
  } else if (data.images) {
    for (const img of data.images) {
      if (typeof img === 'string') {
        images.push({ url: img });
      } else {
        images.push({ url: img.url, base64: img.base64 });
      }
    }
  } else if (data.output) {
    const output = Array.isArray(data.output) ? data.output : [data.output];
    for (const url of output) {
      images.push({ url });
    }
  }

  return images;
}

/**
 * Parse image size and aspect ratio to dimensions
 */
function parseImageSize(imageSize?: string, aspectRatio?: string): { width: number; height: number } {
  // Base resolution
  const baseSize = imageSize === '4K' ? 4096 : imageSize === '2K' ? 2048 : 1024;

  // Parse aspect ratio
  const [wRatio, hRatio] = (aspectRatio || '1:1').split(':').map(Number);

  // Calculate dimensions maintaining aspect ratio
  const scale = Math.sqrt((baseSize * baseSize) / (wRatio * hRatio));
  const width = Math.round(wRatio * scale);
  const height = Math.round(hRatio * scale);

  // Ensure dimensions are divisible by 8 (common requirement)
  return {
    width: Math.round(width / 8) * 8,
    height: Math.round(height / 8) * 8,
  };
}
