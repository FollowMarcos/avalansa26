'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  Prompt,
  PromptInsert,
  PromptUpdate,
  PromptFolder,
  PromptFolderInsert,
  PromptFolderUpdate,
  PromptTag,
  PromptTagInsert,
  PromptTagUpdate,
  PromptShare,
  PromptShareInsert,
  PromptShareWithDetails,
  PromptImage,
  PromptImageInsert,
} from '@/types/prompt';

// ============================================
// PROMPTS - CRUD Operations
// ============================================

/**
 * Save a new prompt to the user's vault
 */
export async function savePrompt(
  data: Omit<PromptInsert, 'user_id'>
): Promise<Prompt | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error saving prompt:', error.message);
    return null;
  }

  return prompt;
}

/**
 * Get user's prompts from their vault (paginated, newest first)
 */
export async function getPrompts(
  limit: number = 50,
  offset: number = 0
): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching prompts:', error.message);
    return [];
  }

  return prompts ?? [];
}

/**
 * Get a single prompt by ID
 */
export async function getPrompt(id: string): Promise<Prompt | null> {
  const supabase = await createClient();

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching prompt:', error.message);
    return null;
  }

  return prompt;
}

/**
 * Update a prompt
 */
export async function updatePrompt(
  promptId: string,
  data: PromptUpdate
): Promise<Prompt | null> {
  const supabase = await createClient();

  const { data: prompt, error } = await supabase
    .from('prompts')
    .update(data)
    .eq('id', promptId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error.message);
    return null;
  }

  return prompt;
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('prompts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting prompt:', error.message);
    return false;
  }

  return true;
}

/**
 * Get user's favorite prompts
 */
export async function getFavoritePrompts(
  limit: number = 50,
  offset: number = 0
): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching favorite prompts:', error.message);
    return [];
  }

  return prompts ?? [];
}

/**
 * Toggle favorite status for a prompt
 */
export async function togglePromptFavorite(
  promptId: string,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompts')
    .update({ is_favorite: isFavorite })
    .eq('id', promptId);

  if (error) {
    console.error('Error toggling prompt favorite:', error.message);
    return false;
  }

  return true;
}

/**
 * Increment use count when generating with a prompt
 */
export async function incrementPromptUseCount(promptId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_prompt_use_count', {
    p_prompt_id: promptId,
  });

  if (error) {
    console.error('Error incrementing prompt use count:', error.message);
    return false;
  }

  return true;
}

// ============================================
// PROMPT FOLDERS
// ============================================

/**
 * Get all user's prompt folders
 */
export async function getPromptFolders(): Promise<PromptFolder[]> {
  const supabase = await createClient();

  const { data: folders, error } = await supabase
    .from('prompt_folders')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching prompt folders:', error.message);
    return [];
  }

  return folders ?? [];
}

/**
 * Create a new prompt folder
 */
export async function createPromptFolder(
  data: Omit<PromptFolderInsert, 'user_id'>
): Promise<PromptFolder | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: folder, error } = await supabase
    .from('prompt_folders')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating prompt folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Update a prompt folder
 */
export async function updatePromptFolder(
  folderId: string,
  data: PromptFolderUpdate
): Promise<PromptFolder | null> {
  const supabase = await createClient();

  const { data: folder, error } = await supabase
    .from('prompt_folders')
    .update(data)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Delete a prompt folder
 */
export async function deletePromptFolder(folderId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting prompt folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a prompt to a folder
 */
export async function addPromptToFolder(
  promptId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_folder_items')
    .insert({ prompt_id: promptId, folder_id: folderId });

  if (error) {
    if (error.code === '23505') {
      // Already in folder
      return true;
    }
    console.error('Error adding prompt to folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a prompt from a folder
 */
export async function removePromptFromFolder(
  promptId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_folder_items')
    .delete()
    .eq('prompt_id', promptId)
    .eq('folder_id', folderId);

  if (error) {
    console.error('Error removing prompt from folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Get prompts in a folder
 */
export async function getPromptsByFolder(
  folderId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_folder_items')
    .select('prompt_id, prompts(*)')
    .eq('folder_id', folderId)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching folder prompts:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.prompts).filter(Boolean) as unknown as Prompt[]) ??
    []
  );
}

/**
 * Get folders for a specific prompt
 */
export async function getPromptFoldersForPrompt(
  promptId: string
): Promise<PromptFolder[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_folder_items')
    .select('folder_id, prompt_folders(*)')
    .eq('prompt_id', promptId);

  if (error) {
    console.error('Error fetching prompt folders:', error.message);
    return [];
  }

  return (
    (data
      ?.map((item) => item.prompt_folders)
      .filter(Boolean) as unknown as PromptFolder[]) ?? []
  );
}

// ============================================
// PROMPT TAGS
// ============================================

/**
 * Get all user's prompt tags
 */
export async function getPromptTags(): Promise<PromptTag[]> {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('prompt_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching prompt tags:', error.message);
    return [];
  }

  return tags ?? [];
}

/**
 * Create a new prompt tag
 */
export async function createPromptTag(
  data: Omit<PromptTagInsert, 'user_id'>
): Promise<PromptTag | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tag, error } = await supabase
    .from('prompt_tags')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Tag exists, fetch it
      const { data: existingTag } = await supabase
        .from('prompt_tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', data.name)
        .single();
      return existingTag;
    }
    console.error('Error creating prompt tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Update a prompt tag
 */
export async function updatePromptTag(
  tagId: string,
  data: PromptTagUpdate
): Promise<PromptTag | null> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from('prompt_tags')
    .update(data)
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Delete a prompt tag
 */
export async function deletePromptTag(tagId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('prompt_tags').delete().eq('id', tagId);

  if (error) {
    console.error('Error deleting prompt tag:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a tag to a prompt
 */
export async function addTagToPrompt(
  promptId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_tag_items')
    .insert({ prompt_id: promptId, tag_id: tagId });

  if (error) {
    if (error.code === '23505') {
      // Already tagged
      return true;
    }
    console.error('Error adding tag to prompt:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a tag from a prompt
 */
export async function removeTagFromPrompt(
  promptId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_tag_items')
    .delete()
    .eq('prompt_id', promptId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from prompt:', error.message);
    return false;
  }

  return true;
}

/**
 * Get tags for a specific prompt
 */
export async function getPromptTagsForPrompt(
  promptId: string
): Promise<PromptTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_tag_items')
    .select('tag_id, prompt_tags(*)')
    .eq('prompt_id', promptId);

  if (error) {
    console.error('Error fetching prompt tags:', error.message);
    return [];
  }

  return (
    (data
      ?.map((item) => item.prompt_tags)
      .filter(Boolean) as unknown as PromptTag[]) ?? []
  );
}

/**
 * Get prompts with a specific tag
 */
export async function getPromptsByTag(
  tagId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_tag_items')
    .select('prompt_id, prompts(*)')
    .eq('tag_id', tagId)
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching tag prompts:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.prompts).filter(Boolean) as unknown as Prompt[]) ??
    []
  );
}

/**
 * Create tag and add to prompt in one operation
 */
export async function createAndAddTagToPrompt(
  promptId: string,
  tagName: string,
  tagColor?: string
): Promise<PromptTag | null> {
  const tag = await createPromptTag({ name: tagName, color: tagColor });
  if (!tag) return null;

  const success = await addTagToPrompt(promptId, tag.id);
  if (!success) return null;

  return tag;
}

// ============================================
// PROMPT SHARING
// ============================================

/**
 * Share a prompt with another user
 */
export async function sharePromptWithUser(
  data: Omit<PromptShareInsert, 'shared_by'>
): Promise<PromptShare | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: share, error } = await supabase
    .from('prompt_shares')
    .insert({ ...data, shared_by: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already shared with this user
      console.error('Prompt already shared with this user');
      return null;
    }
    console.error('Error sharing prompt:', error.message);
    return null;
  }

  // Auto-process the share (create duplicate for recipient)
  if (share) {
    await processPromptShare(share.id);
  }

  return share;
}

/**
 * Process a prompt share (auto-accept by creating duplicate)
 */
export async function processPromptShare(
  shareId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('process_prompt_share', {
    p_share_id: shareId,
  });

  if (error) {
    console.error('Error processing prompt share:', error.message);
    return null;
  }

  return data as string;
}

/**
 * Get shares the user has sent
 */
export async function getSentPromptShares(): Promise<PromptShare[]> {
  const supabase = await createClient();

  const { data: shares, error } = await supabase
    .from('prompt_shares')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sent shares:', error.message);
    return [];
  }

  return shares ?? [];
}

/**
 * Get shares the user has received (with details)
 */
export async function getReceivedPromptShares(): Promise<PromptShareWithDetails[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: shares, error } = await supabase
    .from('prompt_shares')
    .select(
      `
      *,
      prompts!prompt_shares_prompt_id_fkey(*),
      profiles!prompt_shares_shared_by_fkey(id, username, avatar_url)
    `
    )
    .eq('shared_with', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching received shares:', error.message);
    return [];
  }

  return (
    shares?.map((share) => ({
      ...share,
      prompt: share.prompts as unknown as Prompt,
      sharer: share.profiles as unknown as {
        id: string;
        username: string | null;
        avatar_url: string | null;
      },
    })) ?? []
  );
}

/**
 * Get unseen share count
 */
export async function getUnseenShareCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('prompt_shares')
    .select('*', { count: 'exact', head: true })
    .eq('shared_with', user.id)
    .eq('is_seen', false);

  if (error) {
    console.error('Error counting unseen shares:', error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Mark a share as seen
 */
export async function markShareAsSeen(shareId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_shares')
    .update({ is_seen: true })
    .eq('id', shareId);

  if (error) {
    console.error('Error marking share as seen:', error.message);
    return false;
  }

  return true;
}

/**
 * Delete a share (only sharer can do this)
 */
export async function deletePromptShare(shareId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    console.error('Error deleting share:', error.message);
    return false;
  }

  return true;
}

// ============================================
// SEARCH & FILTERING
// ============================================

/**
 * Search prompts by text
 */
export async function searchPrompts(
  query: string,
  limit: number = 20
): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .or(`name.ilike.%${query}%,prompt_text.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching prompts:', error.message);
    return [];
  }

  return prompts ?? [];
}

/**
 * Get recently used prompts
 */
export async function getRecentlyUsedPrompts(limit: number = 10): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .gt('use_count', 0)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recently used prompts:', error.message);
    return [];
  }

  return prompts ?? [];
}

/**
 * Get most used prompts
 */
export async function getMostUsedPrompts(limit: number = 10): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .gt('use_count', 0)
    .order('use_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching most used prompts:', error.message);
    return [];
  }

  return prompts ?? [];
}

// ============================================
// PROMPT IMAGES
// ============================================

/**
 * Get images for a prompt
 */
export async function getPromptImages(promptId: string): Promise<PromptImage[]> {
  const supabase = await createClient();

  const { data: images, error } = await supabase
    .from('prompt_images')
    .select('*')
    .eq('prompt_id', promptId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching prompt images:', error.message);
    return [];
  }

  return images ?? [];
}

/**
 * Add an image to a prompt
 */
export async function addPromptImage(
  data: Omit<PromptImageInsert, 'position'>,
  position?: number
): Promise<PromptImage | null> {
  const supabase = await createClient();

  // Get current image count to determine position
  const { count } = await supabase
    .from('prompt_images')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', data.prompt_id);

  const imagePosition = position ?? (count ?? 0);

  if (imagePosition >= 3) {
    console.error('Maximum of 3 images per prompt allowed');
    return null;
  }

  const { data: image, error } = await supabase
    .from('prompt_images')
    .insert({ ...data, position: imagePosition })
    .select()
    .single();

  if (error) {
    console.error('Error adding prompt image:', error.message);
    return null;
  }

  return image;
}

/**
 * Delete a prompt image
 */
export async function deletePromptImage(imageId: string): Promise<boolean> {
  const supabase = await createClient();

  // First get the image to get the storage path
  const { data: image, error: fetchError } = await supabase
    .from('prompt_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    console.error('Error fetching prompt image:', fetchError?.message);
    return false;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('prompt-images')
    .remove([image.storage_path]);

  if (storageError) {
    console.error('Error deleting image from storage:', storageError.message);
    // Continue to delete from database anyway
  }

  // Delete from database
  const { error } = await supabase
    .from('prompt_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error('Error deleting prompt image:', error.message);
    return false;
  }

  return true;
}

/**
 * Get prompts with their images (for library display)
 */
export async function getPromptsWithImages(
  limit: number = 50,
  offset: number = 0
): Promise<Prompt[]> {
  const supabase = await createClient();

  // Get prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching prompts:', error.message);
    return [];
  }

  if (!prompts || prompts.length === 0) {
    return [];
  }

  // Get all images for these prompts in one query
  const promptIds = prompts.map((p) => p.id);
  const { data: images, error: imagesError } = await supabase
    .from('prompt_images')
    .select('*')
    .in('prompt_id', promptIds)
    .order('position', { ascending: true });

  if (imagesError) {
    console.error('Error fetching prompt images:', imagesError.message);
    // Return prompts without images
    return prompts;
  }

  // Attach images to prompts
  const imagesByPromptId = new Map<string, PromptImage[]>();
  for (const image of images ?? []) {
    const existing = imagesByPromptId.get(image.prompt_id) ?? [];
    existing.push(image);
    imagesByPromptId.set(image.prompt_id, existing);
  }

  return prompts.map((prompt) => ({
    ...prompt,
    images: imagesByPromptId.get(prompt.id) ?? [],
  }));
}

/**
 * Upload a prompt image to storage and create database record
 * This is a helper that combines storage upload + database insert
 */
export async function uploadPromptImage(
  promptId: string,
  formData: FormData
): Promise<PromptImage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const file = formData.get('file') as File;
  if (!file) {
    console.error('No file provided');
    return null;
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${user.id}/${promptId}/${Date.now()}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('prompt-images')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError.message);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('prompt-images')
    .getPublicUrl(filename);

  // Create database record
  const image = await addPromptImage({
    prompt_id: promptId,
    url: urlData.publicUrl,
    storage_path: filename,
  });

  return image;
}
