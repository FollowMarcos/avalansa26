'use server';

import { createClient } from '@/utils/supabase/server';
import sharp from 'sharp';

const BUCKET_NAME = 'reference-images';
const GENERATIONS_BUCKET = 'generations';

// Max file size for storage (50MB - allows full 4K images)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Download a reference image from storage and convert to base64
 */
export async function getImageAsBase64(path: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error || !data) {
      console.error('Download error:', error);
      return null;
    }

    // Convert blob to base64
    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'image/jpeg'; // We always compress to JPEG

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Download multiple reference images and convert to base64
 */
export async function getImagesAsBase64(paths: string[]): Promise<string[]> {
  const results = await Promise.all(paths.map(getImageAsBase64));
  return results.filter((url): url is string => url !== null);
}

/**
 * Get public URLs for reference images from storage paths
 */
export async function getReferenceImageUrls(paths: string[]): Promise<{ url: string; storagePath: string }[]> {
  if (paths.length === 0) return [];

  const supabase = await createClient();

  return paths.map((path) => {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return { url: publicUrl, storagePath: path };
  });
}

/**
 * Delete reference images (cleanup after generation)
 */
export async function deleteReferenceImagesServer(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      console.error('Server delete error:', error);
    }
  } catch (error) {
    console.error('Error deleting images:', error);
  }
}

/**
 * Optimize image buffer for storage (only if exceeds 50MB limit)
 * Preserves full quality for most images, only compresses extremely large ones
 */
async function optimizeImageBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // If already within limits, return as-is (preserves full 4K quality)
  if (buffer.length <= MAX_FILE_SIZE) {
    return { buffer, mimeType };
  }

  // Only compress if absolutely necessary (> 50MB)
  console.log(`Image ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit, optimizing...`);

  // Use sharp to compress the image
  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  // Try WebP first with high quality (best compression ratio)
  let optimizedBuffer = await sharp(buffer)
    .webp({ quality: 95, effort: 6 })
    .toBuffer();

  if (optimizedBuffer.length <= MAX_FILE_SIZE) {
    console.log(`Optimized to ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB using WebP`);
    return { buffer: optimizedBuffer, mimeType: 'image/webp' };
  }

  // If still too large, try lower quality WebP
  optimizedBuffer = await sharp(buffer)
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  if (optimizedBuffer.length <= MAX_FILE_SIZE) {
    console.log(`Optimized to ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB using WebP (85%)`);
    return { buffer: optimizedBuffer, mimeType: 'image/webp' };
  }

  // Last resort: high-quality JPEG with mozjpeg
  optimizedBuffer = await sharp(buffer)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  console.log(`Optimized to ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB using JPEG`);
  return { buffer: optimizedBuffer, mimeType: 'image/jpeg' };
}

/**
 * Upload a generated image to storage from base64
 * Returns the public URL
 * Automatically compresses large images to fit storage limits
 */
export async function uploadGeneratedImage(
  base64Data: string,
  userId: string,
  mimeType: string = 'image/png'
): Promise<{ url: string; path?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Convert base64 to buffer
    const originalBuffer = Buffer.from(base64Clean, 'base64');
    let uploadBuffer: Buffer = originalBuffer;
    let finalMimeType = mimeType;

    // Optimize if the image is too large (> 50MB)
    if (originalBuffer.length > MAX_FILE_SIZE) {
      console.log(`Image size ${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB exceeds limit, optimizing...`);
      const optimized = await optimizeImageBuffer(originalBuffer, mimeType);
      uploadBuffer = optimized.buffer;
      finalMimeType = optimized.mimeType;
      console.log(`Optimized to ${(uploadBuffer.length / 1024 / 1024).toFixed(2)}MB (${finalMimeType})`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    const extension = finalMimeType === 'image/webp' ? 'webp' :
                      finalMimeType === 'image/jpeg' ? 'jpg' :
                      finalMimeType.split('/')[1] || 'png';
    const filename = `${userId}/${timestamp}-${randomId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(GENERATIONS_BUCKET)
      .upload(filename, uploadBuffer, {
        contentType: finalMimeType,
        upsert: false,
      });

    if (error) {
      console.error('Upload generated image error:', error);
      return { url: '', error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(GENERATIONS_BUCKET)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, path: data.path };
  } catch (error) {
    console.error('Upload generated image error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
