import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPresignedUploadUrl, getR2PublicUrl, R2_PREFIX } from '@/utils/r2/client';

const ALLOWED_BUCKETS: Set<string> = new Set([
  R2_PREFIX.REFERENCE_IMAGES,
  R2_PREFIX.AVATARS,
]);

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_SIZES: Record<string, number> = {
  [R2_PREFIX.REFERENCE_IMAGES]: 10 * 1024 * 1024, // 10MB
  [R2_PREFIX.AVATARS]: 5 * 1024 * 1024, // 5MB
};

interface PresignRequest {
  bucket: string;
  contentType: string;
  fileSize: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as PresignRequest;
    const { bucket, contentType, fileSize } = body;

    // Validate bucket
    if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucket}` },
        { status: 400 }
      );
    }

    // Validate content type
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type: ${contentType}` },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = MAX_SIZES[bucket] ?? 10 * 1024 * 1024;
    if (!fileSize || fileSize <= 0 || fileSize > maxSize) {
      return NextResponse.json(
        {
          error: `File size must be between 1 byte and ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        },
        { status: 400 }
      );
    }

    // Build the key: bucket-prefix/userId/timestamp-randomId.ext
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const ext =
      contentType === 'image/jpeg'
        ? 'jpg'
        : contentType === 'image/webp'
          ? 'webp'
          : contentType === 'image/gif'
            ? 'gif'
            : 'png';
    const key = `${bucket}/${user.id}/${timestamp}-${randomId}.${ext}`;

    // Generate presigned URL
    const presignedUrl = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: getR2PublicUrl(key),
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
