import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadToR2 } from '@/utils/r2/client';

/**
 * Allowed MIME types for chat attachments.
 */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided', message: 'Please select a file to upload.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: `File type "${file.type}" is not allowed. Allowed: images, PDF, ZIP.`,
        },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is 25MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
        },
        { status: 400 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const extension = getExtension(file.type);
    const key = `chat-attachments/${user.id}/${timestamp}-${randomId}.${extension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url } = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({
      id: `${timestamp}-${randomId}`,
      url,
      path: `r2:${key}`,
      filename: file.name,
      content_type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Chat upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
  };
  return map[mimeType] ?? 'bin';
}
