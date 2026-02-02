'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  ReferenceImage,
  ReferenceImageWithUrl,
  CreateReferenceImageInput,
  UpdateReferenceImageInput,
} from '@/types/reference-image';

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

  // Get public URLs for all images
  const imagesWithUrls: ReferenceImageWithUrl[] = (data || []).map((image) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(image.storage_path);

    return {
      ...image,
      url: publicUrl,
    };
  });

  return imagesWithUrls;
}

/**
 * Create a reference image database record after client-side upload
 * This is a lightweight server action that only handles the database insert
 * File upload should be done client-side to avoid Server Action size limits
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
  if (!storagePath.startsWith(`${user.id}/`)) {
    console.error('Storage path does not belong to user');
    return null;
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
 * Upload reference image from a URL (e.g., a generated image)
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

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/png';
    const ext = contentType.split('/')[1] || 'png';

    // Generate a unique filename
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${user.id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file from URL:', uploadError);
      return null;
    }

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
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    return {
      ...data,
      url: publicUrl,
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
 * Delete a reference image (removes from storage and database)
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

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([image.storage_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    // Continue to delete DB record anyway
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
 * Verify the reference-images bucket exists
 * Bucket must be created via SQL migration (requires service_role permissions)
 * This function only checks for existence and logs a warning if missing
 */
export async function ensureReferenceImagesBucket(): Promise<void> {
  const supabase = await createClient();

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    // User may not have permission to list buckets, which is fine
    // The upload will fail with a clearer error if bucket doesn't exist
    console.warn('[Storage] Could not list buckets:', error.message);
    return;
  }

  const existingBucket = buckets?.find((b) => b.name === BUCKET_NAME);

  if (!existingBucket) {
    console.warn(
      `[Storage] Bucket "${BUCKET_NAME}" does not exist. ` +
      'Please run database migrations: npx supabase db push'
    );
  }
}
