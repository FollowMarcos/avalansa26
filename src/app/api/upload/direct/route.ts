import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadToR2, getR2PublicUrl, R2_PREFIX } from '@/utils/r2/client';

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
  [R2_PREFIX.REFERENCE_IMAGES]: 4 * 1024 * 1024, // 4MB (Vercel body limit is 4.5MB)
  [R2_PREFIX.AVATARS]: 4 * 1024 * 1024, // 4MB
};

/**
 * Direct upload: browser sends the file to this route, server uploads to R2.
 * Avoids CORS issues with presigned URL uploads.
 *
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - bucket: "reference-images" | "avatars"
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate bucket
    const resolvedBucket = bucket || R2_PREFIX.REFERENCE_IMAGES;
    if (!ALLOWED_BUCKETS.has(resolvedBucket)) {
      return NextResponse.json({ error: `Invalid bucket: ${resolvedBucket}` }, { status: 400 });
    }

    // Validate content type
    const contentType = file.type || 'image/jpeg';
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json({ error: `Invalid content type: ${contentType}` }, { status: 400 });
    }

    // Validate size
    const maxSize = MAX_SIZES[resolvedBucket] ?? 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum is ${(maxSize / 1024 / 1024).toFixed(0)}MB` },
        { status: 400 },
      );
    }

    // Build the key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const ext = contentType === 'image/jpeg' ? 'jpg'
      : contentType === 'image/webp' ? 'webp'
      : contentType === 'image/gif' ? 'gif'
      : 'png';
    const key = `${resolvedBucket}/${user.id}/${timestamp}-${randomId}.${ext}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, contentType);

    return NextResponse.json({
      key,
      publicUrl: getR2PublicUrl(key),
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    );
  }
}
