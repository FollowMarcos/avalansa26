import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDecryptedApiKey, getApiConfig } from '@/utils/supabase/api-configs.server';
import { uploadImageFromUrl } from '@/utils/supabase/storage.server';
import { saveGeneration } from '@/utils/supabase/generations.server';

/**
 * GET /api/video-status?requestId=xxx&apiId=yyy&prompt=...&model=...
 *
 * Poll xAI for video generation status.
 * When done, saves to generations table and re-uploads video to R2.
 * Returns: { success, status, videoUrl?, duration?, generationId? }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const apiId = searchParams.get('apiId');

    if (!requestId || !apiId) {
      return NextResponse.json(
        { success: false, error: 'requestId and apiId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiConfig = await getApiConfig(apiId);
    if (!apiConfig) {
      return NextResponse.json(
        { success: false, error: 'API not found or access denied' },
        { status: 403 }
      );
    }

    const apiKey = await getDecryptedApiKey(apiId);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve API credentials' },
        { status: 500 }
      );
    }

    const endpoint = apiConfig.endpoint || 'https://api.x.ai/v1';
    const statusUrl = `${endpoint}/videos/${requestId}`;

    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to check video status';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          // Surface moderation / validation errors from xAI
          errorMessage = errorData.error;
        }
      } catch {
        const errorText = await response.text();
        console.error('[xAI Video Status] API error:', errorText);
      }

      // Content moderation rejections should show as failed, not as server errors
      const isModeration = errorMessage.toLowerCase().includes('moderation') || errorMessage.toLowerCase().includes('rejected');
      if (isModeration) {
        return NextResponse.json({
          success: true,
          status: 'failed',
          error: 'Video was rejected by content moderation. Try a different prompt or source image.',
        });
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    const data = await response.json();
    // xAI returns: { status: "pending"|"done"|"expired"|"failed", video?: { url, duration, respect_moderation }, model, error? }

    if (data.status === 'done' && data.video?.url) {
      // Re-upload the ephemeral xAI URL to our R2 bucket
      const { url: permanentUrl, path: videoPath, error: uploadError } = await uploadImageFromUrl(data.video.url, user.id);
      if (uploadError) {
        console.error('[xAI Video] Failed to re-upload video to R2:', uploadError);
      }

      const finalUrl = permanentUrl || data.video.url;

      // Save to generations table so the video persists across refreshes
      const prompt = searchParams.get('prompt') || '';
      const model = searchParams.get('model') || apiConfig.name || 'Grok Imagine Video';
      const aspectRatio = searchParams.get('aspectRatio') || '16:9';
      const videoDuration = searchParams.get('videoDuration') || '5';
      const videoResolution = searchParams.get('videoResolution') || '480p';

      const saved = await saveGeneration({
        user_id: user.id,
        api_config_id: apiId,
        prompt,
        image_url: finalUrl,
        image_path: videoPath,
        settings: {
          aspectRatio,
          model,
          generationSpeed: 'fast',
          outputFormat: 'video',
          videoDuration: Number(videoDuration),
          videoResolution,
        },
      });

      return NextResponse.json({
        success: true,
        status: 'done',
        videoUrl: finalUrl,
        duration: data.video.duration,
        generationId: saved?.id,
      });
    }

    if (data.status === 'failed') {
      const failError = data.error || 'Video generation failed. Try a different prompt.';
      const isModeration = failError.toLowerCase().includes('moderation') || failError.toLowerCase().includes('rejected');
      return NextResponse.json({
        success: true,
        status: 'failed',
        error: isModeration
          ? 'Video was rejected by content moderation. Try a different prompt or source image.'
          : failError,
      });
    }

    if (data.status === 'expired') {
      return NextResponse.json({
        success: true,
        status: 'failed',
        error: 'Video generation timed out. Please try again.',
      });
    }

    // Still pending
    return NextResponse.json({
      success: true,
      status: 'pending',
    });
  } catch (error) {
    console.error('Video status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
