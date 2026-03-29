import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';

// Video generation can take a while to submit
export const maxDuration = 60;

export interface GenerateVideoRequest {
  apiId: string;
  prompt: string;
  aspectRatio?: string;
  duration?: number; // 1–15 seconds
  resolution?: '480p' | '720p';
  /** Base64 data URI or public URL for image-to-video */
  sourceImage?: string;
}

export interface GenerateVideoResponse {
  success: boolean;
  /** xAI request ID used to poll for completion */
  requestId?: string;
  error?: string;
}

/**
 * POST /api/generate-video
 *
 * Submit a video generation job to xAI Grok Imagine Video.
 * Returns a requestId that the client polls via /api/video-status.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: GenerateVideoRequest = await request.json();
    const { apiId, prompt, aspectRatio, duration, resolution, sourceImage } = body;

    if (!apiId || !prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'API ID and prompt are required' },
        { status: 400 }
      );
    }

    // Validate the API config
    const apiConfig = await getApiConfig(apiId);
    if (!apiConfig) {
      return NextResponse.json(
        { success: false, error: 'API not found or access denied' },
        { status: 403 }
      );
    }

    if (apiConfig.provider !== 'xai') {
      return NextResponse.json(
        { success: false, error: 'Video generation is only supported with xAI APIs' },
        { status: 400 }
      );
    }

    const apiKey = await getDecryptedApiKey(apiId);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve API credentials' },
        { status: 500 }
      );
    }

    // Build xAI video generation request
    const supportedRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
    const requestBody: Record<string, unknown> = {
      model: 'grok-imagine-video',
      prompt,
    };

    if (aspectRatio && supportedRatios.includes(aspectRatio)) {
      requestBody.aspect_ratio = aspectRatio;
    }
    if (duration && duration >= 1 && duration <= 15) {
      requestBody.duration = duration;
    }
    if (resolution === '720p' || resolution === '480p') {
      requestBody.resolution = resolution;
    }
    if (sourceImage) {
      requestBody.image = { url: sourceImage };
    }

    const endpoint = apiConfig.endpoint || 'https://api.x.ai/v1';
    const apiEndpoint = `${endpoint}/videos/generations`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[xAI Video] API error:', errorText);
      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit reached. Please wait a moment.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Video generation request failed. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.request_id) {
      return NextResponse.json(
        { success: false, error: 'No request ID returned from xAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: data.request_id,
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Video generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
