'use server';

import { createClient } from '@/utils/supabase/server';

const BUCKET_NAME = 'reference-images';

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
