'use client';

import { createClient } from '@/utils/supabase/client';

const BUCKET_NAME = 'reference-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max for Supabase
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

/**
 * Upload a reference image to Supabase Storage (client-side)
 * Compresses large images automatically to fit within 10MB limit
 * Returns the storage path and public URL
 */
export async function uploadReferenceImage(
  file: File,
  userId: string
): Promise<{ path: string; url: string; error?: string }> {
  try {
    const supabase = createClient();

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

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const filename = `${userId}/${timestamp}-${randomId}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uploadBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return { path: '', url: '', error: error.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { path: data.path, url: publicUrl };
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
