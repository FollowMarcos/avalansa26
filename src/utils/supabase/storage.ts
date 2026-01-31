'use client';

import { createClient } from '@/utils/supabase/client';

const BUCKET_NAME = 'reference-images';
const MAX_IMAGE_DIMENSION = 1024;

/**
 * Compress an image file before upload
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Resize if larger than max dimension
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_IMAGE_DIMENSION;
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = (width / height) * MAX_IMAGE_DIMENSION;
          height = MAX_IMAGE_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a reference image to Supabase Storage
 * Returns the storage path (not URL)
 */
export async function uploadReferenceImage(
  file: File,
  userId: string
): Promise<{ path: string; error?: string }> {
  try {
    const supabase = createClient();

    // Compress the image first
    const compressedBlob = await compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const filename = `${userId}/${timestamp}-${randomId}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { path: '', error: error.message };
    }

    return { path: data.path };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple reference images
 * Returns array of storage paths
 */
export async function uploadReferenceImages(
  files: File[],
  userId: string
): Promise<{ paths: string[]; errors: string[] }> {
  const results = await Promise.all(
    files.map((file) => uploadReferenceImage(file, userId))
  );

  const paths: string[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.path) {
      paths.push(result.path);
    }
    if (result.error) {
      errors.push(result.error);
    }
  }

  return { paths, errors };
}

/**
 * Delete reference images from storage
 */
export async function deleteReferenceImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    console.error('Delete error:', error);
  }
}

/**
 * Get a signed URL for a reference image (for preview)
 */
export async function getReferenceImageUrl(
  path: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}
