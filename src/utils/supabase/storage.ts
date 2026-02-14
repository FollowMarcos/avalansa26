'use client';

import { resolveStorageUrl, isR2Path } from '@/utils/r2/url-helpers';
import { deleteReferenceImagesServer } from '@/utils/supabase/storage.server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const TARGET_FILE_SIZE = 8 * 1024 * 1024; // Target 8MB to have buffer
const MAX_DIMENSION = 4096; // Max dimension to prevent memory issues

/**
 * Compress an image file to fit within size limits
 * Progressively reduces quality and dimensions until file size is acceptable
 */
async function compressImage(file: File, targetSize: number = TARGET_FILE_SIZE): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      const objectUrl = img.src;

      try {
        let { width, height } = img;
        let quality = 0.92;
        let scale = 1;

        // Cap initial dimensions to prevent memory issues
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Progressive compression loop
        let blob: Blob | null = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob(res, 'image/jpeg', quality);
          });

          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // If file is small enough, we're done
          if (blob.size <= targetSize) {
            break;
          }

          // Reduce quality first
          if (quality > 0.5) {
            quality -= 0.1;
          } else {
            // Then reduce dimensions
            scale *= 0.8;
            width = Math.round(img.width * scale);
            height = Math.round(img.height * scale);

            // Don't go below 256px on the shortest side
            if (Math.min(width, height) < 256) {
              break; // Accept whatever size we have
            }
          }

          attempts++;
        }

        URL.revokeObjectURL(objectUrl);

        if (blob) {
          console.log(`[Storage] Compressed image: ${file.size} -> ${blob.size} bytes (${attempts} iterations, q=${quality.toFixed(2)})`);
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

interface PresignResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Upload a reference image via presigned URL to R2.
 * Compresses large images automatically to fit within 10MB limit.
 * Returns the storage path (with r2: prefix) and public URL.
 */
export async function uploadReferenceImage(
  file: File,
  userId: string
): Promise<{ path: string; url: string; error?: string }> {
  try {
    // Compress if file is larger than target size
    let uploadBlob: Blob = file;
    if (file.size > TARGET_FILE_SIZE) {
      console.log(`[Storage] File too large (${(file.size / 1024 / 1024).toFixed(1)}MB), compressing...`);
      uploadBlob = await compressImage(file);
    } else if (file.size > 1024 * 1024) {
      // Also compress files > 1MB for better performance
      uploadBlob = await compressImage(file, file.size);
    }

    // Final size check
    if (uploadBlob.size > MAX_FILE_SIZE) {
      return { path: '', url: '', error: `File too large after compression (${(uploadBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.` };
    }

    // Get presigned URL from our API
    const presignResponse = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'reference-images',
        contentType: 'image/jpeg',
        fileSize: uploadBlob.size,
      }),
    });

    if (!presignResponse.ok) {
      const err = await presignResponse.json();
      return { path: '', url: '', error: err.error || 'Failed to get upload URL' };
    }

    const { presignedUrl, key, publicUrl } = (await presignResponse.json()) as PresignResponse;

    // Upload directly to R2 via presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: uploadBlob,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    if (!uploadResponse.ok) {
      return { path: '', url: '', error: `Upload failed: ${uploadResponse.status}` };
    }

    return { path: `r2:${key}`, url: publicUrl };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    return {
      path: '',
      url: '',
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
 * Delete reference images from storage.
 * Delegates to server action which handles both R2 and Supabase paths.
 */
export async function deleteReferenceImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await deleteReferenceImagesServer(paths);
}

/**
 * Get a public URL for a reference image.
 * Handles both R2 and legacy Supabase paths.
 */
export function getReferenceImageUrl(path: string): string | null {
  if (!path) return null;
  return resolveStorageUrl(path, 'reference-images');
}
