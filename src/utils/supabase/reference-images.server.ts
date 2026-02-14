'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  ReferenceImage,
  ReferenceImageWithUrl,
  CreateReferenceImageInput,
  UpdateReferenceImageInput,
} from '@/types/reference-image';
import { resolveStorageUrl, isR2Path, stripR2Prefix } from '@/utils/r2/url-helpers';
import { uploadToR2, deleteFromR2, R2_PREFIX } from '@/utils/r2/client';

const BUCKET_NAME = 'reference-images';

/**
 * Get all reference images for the current user
 */
export async function getUserReferenceImages(): Promise<ReferenceImageWithUrl[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('reference_images')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reference images:', error);
    return [];
  }

  // Get public URLs for all images (handles both R2 and Supabase paths)
  const imagesWithUrls: ReferenceImageWithUrl[] = (data || []).map((image) => ({
    ...image,
    url: resolveStorageUrl(image.storage_path, 'reference-images'),
  }));

  return imagesWithUrls;
}

/**
 * Create a reference image database record after client-side upload.
 * Supports both R2 (r2: prefixed) and legacy Supabase storage paths.
 */
export async function createReferenceImageRecord(
  storagePath: string,
  name: string
): Promise<ReferenceImageWithUrl | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Verify the path belongs to this user (security check)
  // For R2 paths: r2:reference-images/{userId}/...
  // For legacy paths: {userId}/...
  if (isR2Path(storagePath)) {
    const key = stripR2Prefix(storagePath);
    if (!key.includes(`/${user.id}/`)) {
      console.error('Storage path does not belong to user');
      return null;
    }
  } else {
    if (!storagePath.startsWith(`${user.id}/`)) {
      console.error('Storage path does not belong to user');
      return null;
    }
  }

  // Ensure bucket exists and is public (lazy initialization)
  await ensureReferenceImagesBucket();

  // Create database record
  const { data, error: insertError } = await supabase
    .from('reference_images')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      name: name,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating reference image record:', insertError);
    return null;
  }

  return {
    ...data,
    url: resolveStorageUrl(storagePath, 'reference-images'),
  };
}

/**
 * @deprecated Use createReferenceImageRecord instead - upload directly from client
 * This function is kept for backwards compatibility but will hit Server Action size limits
 */
export async function uploadReferenceImage(
  formData: FormData
): Promise<ReferenceImageWithUrl | null> {
  const file = formData.get('file') as File | null;

  if (!file) {
    console.error('No file provided in FormData');
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Ensure bucket exists before uploading
  await ensureReferenceImagesBucket();

  // Generate a unique filename
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${user.id}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return null;
  }

  // Create database record
  const { data, error: insertError } = await supabase
    .from('reference_images')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      name: file.name,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating reference image record:', insertError);
    // Try to clean up the uploaded file
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return null;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  return {
    ...data,
    url: publicUrl,
  };
}

/**
 * Upload reference image from a URL (e.g., a generated image).
 * Uploads to R2 and stores path with r2: prefix.
 */
export async function uploadReferenceImageFromUrl(
  imageUrl: string,
  name?: string
): Promise<ReferenceImageWithUrl | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    const ext = contentType.split('/')[1] || 'png';

    // Generate a unique filename and upload to R2
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const key = `${R2_PREFIX.REFERENCE_IMAGES}/${user.id}/${fileName}`;

    await uploadToR2(key, buffer, contentType);

    const storagePath = `r2:${key}`;

    // Create database record
    const { data, error: insertError } = await supabase
      .from('reference_images')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        name: name || `Reference ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating reference image record:', insertError);
      await deleteFromR2([key]);
      return null;
    }

    return {
      ...data,
      url: resolveStorageUrl(storagePath, 'reference-images'),
    };
  } catch (error) {
    console.error('Error uploading reference image from URL:', error);
    return null;
  }
}

/**
 * Update a reference image (e.g., rename)
 */
export async function updateReferenceImage(
  id: string,
  input: UpdateReferenceImageInput
): Promise<ReferenceImage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('reference_images')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the image
    .select()
    .single();

  if (error) {
    console.error('Error updating reference image:', error);
    return null;
  }

  return data;
}

/**
 * Delete a reference image (removes from storage and database).
 * Handles both R2 and legacy Supabase storage.
 */
export async function deleteReferenceImage(id: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return false;
  }

  // First, get the image to find the storage path
  const { data: image, error: fetchError } = await supabase
    .from('reference_images')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !image) {
    console.error('Error fetching reference image for deletion:', fetchError);
    return false;
  }

  // Delete from the correct storage backend
  if (isR2Path(image.storage_path)) {
    await deleteFromR2([stripR2Prefix(image.storage_path)]);
  } else {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([image.storage_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue to delete DB record anyway
    }
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from('reference_images')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting reference image record:', deleteError);
    return false;
  }

  return true;
}

/**
 * No-op function kept for backwards compatibility
 * Bucket creation/verification is handled via SQL migrations
 * Regular users cannot list buckets (requires service_role)
 */
export async function ensureReferenceImagesBucket(): Promise<void> {
  // Bucket must exist via migration - no runtime checks needed
  // listBuckets() requires service_role permissions which users don't have
}
