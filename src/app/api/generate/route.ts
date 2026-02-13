import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { createBatchJob, submitGeminiBatchJob } from '@/utils/supabase/batch-jobs.server';
import { getImagesAsBase64, uploadGeneratedImage, uploadImageFromUrl, getReferenceImageUrls } from '@/utils/supabase/storage.server';
import { saveGeneration } from '@/utils/supabase/generations.server';
import type { BatchJobRequest } from '@/types/batch-job';

// Extend serverless function timeout to 5 minutes (300 seconds)
// Image generation with Gemini can take 30-60+ seconds per image
export const maxDuration = 300;

export interface GenerateRequest {
  apiId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  outputCount?: number;
  referenceImagePaths?: string[]; // Storage paths (not base64)
  mode?: 'fast' | 'relaxed'; // Generation mode
  /** Optional source identifier (e.g. 'characterTurnaround') for workflow-generated images */
  source?: string;
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
    const { apiId, prompt, negativePrompt, aspectRatio, imageSize, outputCount = 1, referenceImagePaths, mode = 'fast', source } = body;

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================

    if (!apiId || typeof apiId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'API ID is required' },
        { status: 400 }
      );
    }

    if (!prompt && (!referenceImagePaths || referenceImagePaths.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Prompt or reference images required' },
        { status: 400 }
      );
    }

    // Validate prompt length
    const MAX_PROMPT_LENGTH = 10000;
    const MAX_NEGATIVE_PROMPT_LENGTH = 2000;

    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Prompt must be under ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (negativePrompt && negativePrompt.length > MAX_NEGATIVE_PROMPT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Negative prompt must be under ${MAX_NEGATIVE_PROMPT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate outputCount
    const MAX_OUTPUT_COUNT = 10;
    if (!Number.isInteger(outputCount) || outputCount < 1 || outputCount > MAX_OUTPUT_COUNT) {
      return NextResponse.json(
        { success: false, error: `Output count must be between 1 and ${MAX_OUTPUT_COUNT}` },
        { status: 400 }
      );
    }

    // Validate aspect ratio (allowlist)
    const VALID_ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '5:4', '4:5', '21:9', '9:21'];
    if (aspectRatio && !VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      return NextResponse.json(
        { success: false, error: 'Invalid aspect ratio' },
        { status: 400 }
      );
    }

    // Validate image size (allowlist)
    const VALID_IMAGE_SIZES = ['1K', '2K', '4K'];
    if (imageSize && !VALID_IMAGE_SIZES.includes(imageSize)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image size. Must be 1K, 2K, or 4K' },
        { status: 400 }
      );
    }

    // Validate reference image paths
    const MAX_REFERENCE_IMAGES = 5;
    if (referenceImagePaths && referenceImagePaths.length > MAX_REFERENCE_IMAGES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_REFERENCE_IMAGES} reference images allowed` },
        { status: 400 }
      );
    }

    // Validate reference image paths don't contain traversal sequences
    if (referenceImagePaths) {
      for (const path of referenceImagePaths) {
        if (typeof path !== 'string' || path.includes('..') || path.startsWith('/')) {
          return NextResponse.json(
            { success: false, error: 'Invalid reference image path' },
            { status: 400 }
          );
        }
      }
    }

    // Validate mode
    if (mode !== 'fast' && mode !== 'relaxed') {
      return NextResponse.json(
        { success: false, error: 'Mode must be "fast" or "relaxed"' },
        { status: 400 }
      );
    }

    // Get API configuration (before fetching reference images so we know the format)
    const apiConfig = await getApiConfig(apiId);
    if (!apiConfig) {
      return NextResponse.json(
        { success: false, error: 'API not found or access denied' },
        { status: 404 }
      );
    }

    // ========================================================================
    // FETCH REFERENCE IMAGES
    // ========================================================================

    let referenceImages: string[] = [];
    if (referenceImagePaths && referenceImagePaths.length > 0) {
      if (apiConfig.provider === 'fal') {
        // Fal.ai expects public URLs (image_urls), not base64
        const refUrls = await getReferenceImageUrls(referenceImagePaths);
        referenceImages = refUrls.map(r => r.url);
      } else {
        // Other providers (Google, Stability, etc.) use base64
        referenceImages = await getImagesAsBase64(referenceImagePaths);
      }

      if (referenceImages.length === 0 && referenceImagePaths.length > 0) {
        console.error('[API /generate] Failed to fetch any reference images');
      }
    }

    // Handle relaxed/batch mode for supported providers
    if (mode === 'relaxed' && apiConfig.provider === 'google') {
      // Create batch job requests (store paths, not base64)
      const batchRequests: BatchJobRequest[] = [];
      for (let i = 0; i < outputCount; i++) {
        batchRequests.push({
          prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          referenceImagePaths, // Store paths for later fetching
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
          modelInfo: apiConfig.model_info,
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

    // Get public URLs for reference images to store with generation
    const referenceImageInfo = referenceImagePaths && referenceImagePaths.length > 0
      ? await getReferenceImageUrls(referenceImagePaths)
      : [];

    // Upload images to Supabase storage so all gallery URLs are on our domain
    const processedImages: GeneratedImage[] = [];
    for (const image of images) {
      let imageUrl = image.url;
      let imagePath: string | undefined;

      if (image.url.startsWith('data:') || image.base64) {
        // Base64 / data URL — upload directly
        const base64Data = image.base64 || image.url;
        const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

        const { url, path, error } = await uploadGeneratedImage(base64Data, user.id, mimeType);
        if (error) {
          console.error('Failed to upload generated image:', error);
        } else {
          imageUrl = url;
          imagePath = path;
        }
      } else if (image.url.startsWith('http')) {
        // External URL (Fal.ai, OpenAI, etc.) — download and re-upload to Supabase
        const { url, path, error } = await uploadImageFromUrl(image.url, user.id);
        if (error) {
          console.error('Failed to re-upload external image:', error);
        } else {
          imageUrl = url;
          imagePath = path;
        }
      }

      processedImages.push({ url: imageUrl });

      // Save to generation history
      await saveGeneration({
        user_id: user.id,
        api_config_id: apiId,
        prompt: prompt || '',
        negative_prompt: negativePrompt,
        image_url: imageUrl,
        image_path: imagePath,
        settings: {
          aspectRatio,
          imageSize,
          outputCount,
          generationSpeed: mode,
          model: apiConfig.name,
          referenceImages: referenceImageInfo.length > 0 ? referenceImageInfo : undefined,
          ...(source ? { source } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, images: processedImages, mode: 'fast' });
  } catch (error) {
    console.error('Generation error:', error);

    // Pass through user-friendly error messages from provider functions;
    // fall back to generic message for unexpected/internal errors.
    const message =
      error instanceof Error && isUserFacingError(error.message)
        ? error.message
        : 'Image generation failed. Please try again.';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * Known user-friendly error prefixes that are safe to surface to the client.
 * All other messages are replaced with a generic fallback to prevent leaking
 * internal API details, stack traces, or provider-specific error text.
 */
const USER_FACING_PREFIXES = [
  'This model is experiencing high demand',
  'Rate limit reached',
  'Invalid request:',
  'Content blocked',
  'Image generation blocked by safety filters',
  'Content blocked due to potential copyright',
  'Image generation failed (IMAGE_OTHER)',
  'Custom provider requires an endpoint',
  'No images generated',
  'Images are too large',
  'Generation failed',
] as const;

function isUserFacingError(message: string): boolean {
  return USER_FACING_PREFIXES.some((prefix) => message.startsWith(prefix));
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
  modelInfo?: import('@/types/api-config').ApiModelInfo | null;
}

// Default timeout for API requests (90 seconds)
const API_REQUEST_TIMEOUT = 90000;

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
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

/**
 * Generate images using Google Gemini API
 * Supports both Gemini 2.0 Flash and Gemini 3 Pro Image Preview models
 *
 * Note: Gemini's generateContent API returns 1 image per call,
 * so we make parallel API calls when outputCount > 1
 */
async function generateWithGemini(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount, referenceImages } = params;

  // Debug: Log Gemini-specific params
  console.log('[Gemini] Generating with params:', {
    modelId,
    aspectRatio,
    imageSize,
    outputCount,
    hasReferenceImages: referenceImages?.length || 0,
  });

  // Build the request for Gemini image generation
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

  // Always use gemini-3-pro-image-preview for proper resolution control
  const model = modelId || 'gemini-3-pro-image-preview';

  // Check if this model supports image_config (Gemini 3 Pro Image Preview)
  const supportsImageConfig = model.includes('gemini-3') || model.includes('image-preview');

  // Build generation config with image_config for supported models
  const generationConfig: Record<string, unknown> = {
    responseModalities: ['IMAGE', 'TEXT'],
  };

  // Add imageConfig for models that support it (Gemini 3 Pro Image Preview)
  if (supportsImageConfig) {
    const imageConfig: Record<string, string> = {};

    // Add aspectRatio if specified (camelCase for current API)
    if (aspectRatio) {
      imageConfig.aspectRatio = aspectRatio;
    }

    // Add imageSize if specified (supports "1K", "2K", "4K")
    if (imageSize) {
      imageConfig.imageSize = imageSize;
    }

    if (Object.keys(imageConfig).length > 0) {
      generationConfig.imageConfig = imageConfig;
    }

    console.log('[Gemini] Using imageConfig:', imageConfig);
  } else {
    // For older models without image_config support, add hints to the prompt
    const aspectHint = aspectRatio ? getAspectRatioHint(aspectRatio) : '';
    const sizeHint = imageSize === '4K' ? 'high resolution, 4K quality, extremely detailed' :
                     imageSize === '2K' ? 'high resolution, detailed' : '';
    const hints = [aspectHint, sizeHint].filter(Boolean).join(', ');

    if (hints) {
      parts[0] = { text: `${fullPrompt}\n\nImage specifications: ${hints}` };
      console.log('[Gemini] Using prompt hints (model does not support image_config):', hints);
    }
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig,
  };

  // Debug: Log the full request config
  console.log('[Gemini] Request config:', {
    model,
    supportsImageConfig,
    generationConfig,
    parallelRequests: outputCount,
  });

  // Use the configured endpoint or default to Gemini API
  const apiEndpoint = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Timeout for individual Gemini API requests (90 seconds)
  const REQUEST_TIMEOUT = 90000;

  // Helper function to make a single API call and extract image
  const makeSingleRequest = async (requestIndex: number): Promise<GeneratedImage | null> => {
    console.log(`[Gemini] Starting request ${requestIndex + 1}/${outputCount}`);

    // Create AbortController with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini] Request ${requestIndex + 1} failed:`, errorText);

        // Parse and provide user-friendly error messages
        if (response.status === 503) {
          throw new Error('This model is experiencing high demand. Please try again in a few moments.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment before generating again.');
        }
        if (response.status === 400) {
          try {
            const parsed = JSON.parse(errorText);
            const msg = parsed?.error?.message || errorText;
            throw new Error(`Invalid request: ${msg}`);
          } catch (e) {
            if (e instanceof Error && e.message.startsWith('Invalid request:')) throw e;
          }
        }
        throw new Error(`Gemini API error (${response.status}): Please try again.`);
      }

      const data = await response.json();

      // Debug: Log the response structure
      console.log(`[Gemini] Response ${requestIndex + 1}:`, {
        hasCandidate: !!data.candidates?.[0],
        finishReason: data.candidates?.[0]?.finishReason,
        partsCount: data.candidates?.[0]?.content?.parts?.length || 0,
      });

      // Check for content blocked by safety filters
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
      }

      // Check if the response was filtered
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY' || finishReason === 'IMAGE_SAFETY') {
        throw new Error('Image generation blocked by safety filters. Try modifying your prompt or using a different reference image.');
      }
      if (finishReason === 'RECITATION') {
        throw new Error('Content blocked due to potential copyright issues.');
      }
      if (finishReason === 'IMAGE_OTHER') {
        throw new Error('Image generation failed (IMAGE_OTHER). Try a different prompt or reference image.');
      }

      // Extract image from response
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            // Convert base64 to data URL
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            return { url: dataUrl, base64: part.inlineData.data };
          } else if (part.text) {
            // Log any text response (model might be explaining why it can't generate)
            console.log(`[Gemini] Request ${requestIndex + 1} text response:`, part.text.slice(0, 200));
          }
        }
      }

      // If no image, check for text explanation
      if (data.candidates?.[0]) {
        const textParts = data.candidates[0].content?.parts?.filter((p: Record<string, unknown>) => p.text) || [];
        if (textParts.length > 0) {
          const textContent = textParts.map((p: { text: string }) => p.text).join(' ').slice(0, 200);
          console.warn(`[Gemini] Request ${requestIndex + 1} returned text instead of image: "${textContent}..."`);
        }
      }

      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Gemini API request timed out after ${REQUEST_TIMEOUT / 1000} seconds`);
      }
      throw error;
    }
  };

  // Make parallel API calls for outputCount images
  // Use Promise.allSettled to handle partial failures gracefully
  const requests = Array.from({ length: outputCount }, (_, i) => makeSingleRequest(i));
  const results = await Promise.allSettled(requests);

  const images: GeneratedImage[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      images.push(result.value);
    } else if (result.status === 'rejected') {
      errors.push(result.reason?.message || 'Unknown error');
    }
  }

  console.log(`[Gemini] Completed: ${images.length}/${outputCount} images generated, ${errors.length} errors`);

  // If all requests failed, throw the first error
  if (images.length === 0 && errors.length > 0) {
    throw new Error(errors[0]);
  }

  // If some succeeded, return what we got (partial success)
  if (images.length < outputCount) {
    console.warn(`[Gemini] Partial success: ${images.length}/${outputCount} images. Errors: ${errors.join('; ')}`);
  }

  return images;
}

/**
 * Get a descriptive hint for aspect ratio to include in the prompt
 * Since Gemini generateContent API doesn't support aspectRatio in generationConfig,
 * we describe the desired format in the prompt itself
 */
function getAspectRatioHint(aspectRatio: string): string {
  const ratioDescriptions: Record<string, string> = {
    '1:1': 'square format (1:1 aspect ratio)',
    '4:3': 'standard landscape format (4:3 aspect ratio)',
    '3:4': 'standard portrait format (3:4 aspect ratio)',
    '16:9': 'widescreen landscape format (16:9 aspect ratio)',
    '9:16': 'tall portrait format (9:16 aspect ratio, like a phone screen)',
    '3:2': 'classic photo landscape format (3:2 aspect ratio)',
    '2:3': 'classic photo portrait format (2:3 aspect ratio)',
    '5:4': 'photo landscape format (5:4 aspect ratio)',
    '4:5': 'social media portrait format (4:5 aspect ratio)',
    '21:9': 'ultra-wide cinematic format (21:9 aspect ratio)',
  };

  return ratioDescriptions[aspectRatio] || `${aspectRatio} aspect ratio`;
}

/**
 * Generate images using Fal.ai API
 * Supports SeedREAM v4/v4.5, Flux, and other fal.ai models.
 */
async function generateWithFal(params: ProviderParams): Promise<GeneratedImage[]> {
  const { apiKey, endpoint, modelId, prompt, negativePrompt, aspectRatio, imageSize, outputCount, referenceImages, modelInfo } = params;

  const dimensions = parseImageSize(imageSize, aspectRatio);
  const hasReferenceImages = referenceImages && referenceImages.length > 0;

  const requestBody: Record<string, unknown> = {
    prompt,
    num_images: outputCount,
    max_images: outputCount,
    image_size: {
      width: dimensions.width,
      height: dimensions.height,
    },
    enable_safety_checker: modelInfo?.enableSafetyChecker ?? true,
  };

  // Only include negative_prompt if provided (some models like SeedREAM don't support it)
  if (negativePrompt) {
    requestBody.negative_prompt = negativePrompt;
  }

  // Reference images — use image_urls array (SeedREAM, newer fal models)
  if (hasReferenceImages) {
    requestBody.image_urls = referenceImages;
  }

  // Build endpoint: use custom endpoint if set, otherwise construct from model ID
  const resolvedModelId = modelId || 'fal-ai/flux/dev';
  const apiEndpoint = endpoint || `https://fal.run/${resolvedModelId}`;

  const response = await fetchWithTimeout(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Fal.ai] API error:', errorText);
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before generating again.');
    }
    throw new Error('Image generation failed. Please try again.');
  }

  const data = await response.json();

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

  const response = await fetchWithTimeout(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenAI] API error:', errorText);
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before generating again.');
    }
    throw new Error('Image generation failed. Please try again.');
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

  const response = await fetchWithTimeout(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Stability] API error:', errorText);
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before generating again.');
    }
    throw new Error('Image generation failed. Please try again.');
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

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Custom] API error:', errorText);
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before generating again.');
    }
    throw new Error('Image generation failed. Please try again.');
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
