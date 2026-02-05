'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  Character,
  CharacterInsert,
  CharacterUpdate,
  CharacterFolder,
  CharacterFolderInsert,
  CharacterFolderUpdate,
  CharacterTag,
  CharacterTagInsert,
  CharacterTagUpdate,
  CharacterImage,
  CharacterImageInsert,
} from '@/types/character';
import type { Generation } from '@/types/generation';

// ============================================
// CHARACTERS - CRUD Operations
// ============================================

/**
 * Save a new character to the user's vault
 */
export async function saveCharacter(
  data: Omit<CharacterInsert, 'user_id'>
): Promise<Character | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: character, error } = await supabase
    .from('characters')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error saving character:', error.message);
    return null;
  }

  return character;
}

/**
 * Get user's characters from their vault (paginated, newest first)
 */
export async function getCharacters(
  limit: number = 50,
  offset: number = 0
): Promise<Character[]> {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching characters:', error.message);
    return [];
  }

  return characters ?? [];
}

/**
 * Get a single character by ID
 */
export async function getCharacter(id: string): Promise<Character | null> {
  const supabase = await createClient();

  const { data: character, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching character:', error.message);
    return null;
  }

  return character;
}

/**
 * Update a character
 */
export async function updateCharacter(
  characterId: string,
  data: CharacterUpdate
): Promise<Character | null> {
  const supabase = await createClient();

  const { data: character, error } = await supabase
    .from('characters')
    .update(data)
    .eq('id', characterId)
    .select()
    .single();

  if (error) {
    console.error('Error updating character:', error.message);
    return null;
  }

  return character;
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<boolean> {
  const supabase = await createClient();

  // First delete all images from storage
  const { data: images } = await supabase
    .from('character_images')
    .select('storage_path')
    .eq('character_id', id);

  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path);
    await supabase.storage.from('character-images').remove(paths);
  }

  const { error } = await supabase.from('characters').delete().eq('id', id);

  if (error) {
    console.error('Error deleting character:', error.message);
    return false;
  }

  return true;
}

/**
 * Get user's favorite characters
 */
export async function getFavoriteCharacters(
  limit: number = 50,
  offset: number = 0
): Promise<Character[]> {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching favorite characters:', error.message);
    return [];
  }

  return characters ?? [];
}

/**
 * Toggle favorite status for a character
 */
export async function toggleCharacterFavorite(
  characterId: string,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('characters')
    .update({ is_favorite: isFavorite })
    .eq('id', characterId);

  if (error) {
    console.error('Error toggling character favorite:', error.message);
    return false;
  }

  return true;
}

/**
 * Increment use count when generating with a character
 */
export async function incrementCharacterUseCount(characterId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_character_use_count', {
    p_character_id: characterId,
  });

  if (error) {
    console.error('Error incrementing character use count:', error.message);
    return false;
  }

  return true;
}

// ============================================
// CHARACTER IMAGES
// ============================================

/**
 * Get images for a character
 */
export async function getCharacterImages(characterId: string): Promise<CharacterImage[]> {
  const supabase = await createClient();

  const { data: images, error } = await supabase
    .from('character_images')
    .select('*')
    .eq('character_id', characterId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching character images:', error.message);
    return [];
  }

  return images ?? [];
}

/**
 * Add an image to a character
 */
export async function addCharacterImage(
  data: Omit<CharacterImageInsert, 'position'>,
  position?: number
): Promise<CharacterImage | null> {
  const supabase = await createClient();

  // Get current image count to determine position
  const { count } = await supabase
    .from('character_images')
    .select('*', { count: 'exact', head: true })
    .eq('character_id', data.character_id);

  const imagePosition = position ?? (count ?? 0);

  const { data: image, error } = await supabase
    .from('character_images')
    .insert({ ...data, position: imagePosition })
    .select()
    .single();

  if (error) {
    console.error('Error adding character image:', error.message);
    return null;
  }

  return image;
}

/**
 * Delete a character image
 */
export async function deleteCharacterImage(imageId: string): Promise<boolean> {
  const supabase = await createClient();

  // First get the image to get the storage path
  const { data: image, error: fetchError } = await supabase
    .from('character_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    console.error('Error fetching character image:', fetchError?.message);
    return false;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('character-images')
    .remove([image.storage_path]);

  if (storageError) {
    console.error('Error deleting image from storage:', storageError.message);
    // Continue to delete from database anyway
  }

  // Delete from database
  const { error } = await supabase
    .from('character_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error('Error deleting character image:', error.message);
    return false;
  }

  return true;
}

/**
 * Set an image as the primary/avatar image for a character
 */
export async function setCharacterPrimaryImage(
  characterId: string,
  imageId: string
): Promise<boolean> {
  const supabase = await createClient();

  // First unset any existing primary image
  const { error: unsetError } = await supabase
    .from('character_images')
    .update({ is_primary: false })
    .eq('character_id', characterId)
    .eq('is_primary', true);

  if (unsetError) {
    console.error('Error unsetting primary image:', unsetError.message);
    return false;
  }

  // Set the new primary image
  const { error } = await supabase
    .from('character_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (error) {
    console.error('Error setting primary image:', error.message);
    return false;
  }

  return true;
}

/**
 * Upload a character image to storage and create database record
 */
export async function uploadCharacterImage(
  characterId: string,
  formData: FormData
): Promise<CharacterImage | null> {
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
  const filename = `${user.id}/${characterId}/${Date.now()}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('character-images')
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
    .from('character-images')
    .getPublicUrl(filename);

  // Create database record
  const image = await addCharacterImage({
    character_id: characterId,
    url: urlData.publicUrl,
    storage_path: filename,
  });

  return image;
}

/**
 * Reorder character images
 */
export async function reorderCharacterImages(
  characterId: string,
  imageIds: string[]
): Promise<boolean> {
  const supabase = await createClient();

  // Update each image's position
  const updates = imageIds.map((id, index) =>
    supabase
      .from('character_images')
      .update({ position: index })
      .eq('id', id)
      .eq('character_id', characterId)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((result) => result.error);

  if (hasError) {
    console.error('Error reordering character images');
    return false;
  }

  return true;
}

// ============================================
// CHARACTER FOLDERS
// ============================================

/**
 * Get all user's character folders
 */
export async function getCharacterFolders(): Promise<CharacterFolder[]> {
  const supabase = await createClient();

  const { data: folders, error } = await supabase
    .from('character_folders')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching character folders:', error.message);
    return [];
  }

  return folders ?? [];
}

/**
 * Create a new character folder
 */
export async function createCharacterFolder(
  data: Omit<CharacterFolderInsert, 'user_id'>
): Promise<CharacterFolder | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: folder, error } = await supabase
    .from('character_folders')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating character folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Update a character folder
 */
export async function updateCharacterFolder(
  folderId: string,
  data: CharacterFolderUpdate
): Promise<CharacterFolder | null> {
  const supabase = await createClient();

  const { data: folder, error } = await supabase
    .from('character_folders')
    .update(data)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating character folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Delete a character folder
 */
export async function deleteCharacterFolder(folderId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('character_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting character folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a character to a folder
 */
export async function addCharacterToFolder(
  characterId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('character_folder_items')
    .insert({ character_id: characterId, folder_id: folderId });

  if (error) {
    if (error.code === '23505') {
      // Already in folder
      return true;
    }
    console.error('Error adding character to folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a character from a folder
 */
export async function removeCharacterFromFolder(
  characterId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('character_folder_items')
    .delete()
    .eq('character_id', characterId)
    .eq('folder_id', folderId);

  if (error) {
    console.error('Error removing character from folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Get characters in a folder
 */
export async function getCharactersByFolder(
  folderId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Character[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('character_folder_items')
    .select('character_id, characters(*)')
    .eq('folder_id', folderId)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching folder characters:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.characters).filter(Boolean) as unknown as Character[]) ??
    []
  );
}

/**
 * Get folders for a specific character
 */
export async function getCharacterFoldersForCharacter(
  characterId: string
): Promise<CharacterFolder[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('character_folder_items')
    .select('folder_id, character_folders(*)')
    .eq('character_id', characterId);

  if (error) {
    console.error('Error fetching character folders:', error.message);
    return [];
  }

  return (
    (data
      ?.map((item) => item.character_folders)
      .filter(Boolean) as unknown as CharacterFolder[]) ?? []
  );
}

// ============================================
// CHARACTER TAGS
// ============================================

/**
 * Get all user's character tags
 */
export async function getCharacterTags(): Promise<CharacterTag[]> {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('character_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching character tags:', error.message);
    return [];
  }

  return tags ?? [];
}

/**
 * Create a new character tag
 */
export async function createCharacterTag(
  data: Omit<CharacterTagInsert, 'user_id'>
): Promise<CharacterTag | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tag, error } = await supabase
    .from('character_tags')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Tag exists, fetch it
      const { data: existingTag } = await supabase
        .from('character_tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', data.name)
        .single();
      return existingTag;
    }
    console.error('Error creating character tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Update a character tag
 */
export async function updateCharacterTag(
  tagId: string,
  data: CharacterTagUpdate
): Promise<CharacterTag | null> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from('character_tags')
    .update(data)
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    console.error('Error updating character tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Delete a character tag
 */
export async function deleteCharacterTag(tagId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('character_tags').delete().eq('id', tagId);

  if (error) {
    console.error('Error deleting character tag:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a tag to a character
 */
export async function addTagToCharacter(
  characterId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('character_tag_items')
    .insert({ character_id: characterId, tag_id: tagId });

  if (error) {
    if (error.code === '23505') {
      // Already tagged
      return true;
    }
    console.error('Error adding tag to character:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a tag from a character
 */
export async function removeTagFromCharacter(
  characterId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('character_tag_items')
    .delete()
    .eq('character_id', characterId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from character:', error.message);
    return false;
  }

  return true;
}

/**
 * Get tags for a specific character
 */
export async function getCharacterTagsForCharacter(
  characterId: string
): Promise<CharacterTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('character_tag_items')
    .select('tag_id, character_tags(*)')
    .eq('character_id', characterId);

  if (error) {
    console.error('Error fetching character tags:', error.message);
    return [];
  }

  return (
    (data
      ?.map((item) => item.character_tags)
      .filter(Boolean) as unknown as CharacterTag[]) ?? []
  );
}

/**
 * Get characters with a specific tag
 */
export async function getCharactersByTag(
  tagId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Character[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('character_tag_items')
    .select('character_id, characters(*)')
    .eq('tag_id', tagId)
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching tag characters:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.characters).filter(Boolean) as unknown as Character[]) ??
    []
  );
}

/**
 * Create tag and add to character in one operation
 */
export async function createAndAddTagToCharacter(
  characterId: string,
  tagName: string,
  tagColor?: string
): Promise<CharacterTag | null> {
  const tag = await createCharacterTag({ name: tagName, color: tagColor });
  if (!tag) return null;

  const success = await addTagToCharacter(characterId, tag.id);
  if (!success) return null;

  return tag;
}

// ============================================
// GENERATION-CHARACTER LINKING
// ============================================

/**
 * Link a generation to a character (manual linking)
 */
export async function linkGenerationToCharacter(
  generationId: string,
  characterId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_characters')
    .insert({ generation_id: generationId, character_id: characterId });

  if (error) {
    if (error.code === '23505') {
      // Already linked
      return true;
    }
    console.error('Error linking generation to character:', error.message);
    return false;
  }

  return true;
}

/**
 * Unlink a generation from a character
 */
export async function unlinkGenerationFromCharacter(
  generationId: string,
  characterId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_characters')
    .delete()
    .eq('generation_id', generationId)
    .eq('character_id', characterId);

  if (error) {
    console.error('Error unlinking generation from character:', error.message);
    return false;
  }

  return true;
}

/**
 * Get characters linked to a generation
 */
export async function getGenerationCharacters(
  generationId: string
): Promise<Character[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_characters')
    .select('character_id, characters(*)')
    .eq('generation_id', generationId);

  if (error) {
    console.error('Error fetching generation characters:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.characters).filter(Boolean) as unknown as Character[]) ??
    []
  );
}

/**
 * Get generations linked to a character
 */
export async function getCharacterGenerations(
  characterId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_characters')
    .select('generation_id, generations(*)')
    .eq('character_id', characterId)
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching character generations:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.generations).filter(Boolean) as unknown as Generation[]) ??
    []
  );
}

// ============================================
// SEARCH & FILTERING
// ============================================

/**
 * Search characters by text
 */
export async function searchCharacters(
  query: string,
  limit: number = 20
): Promise<Character[]> {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .or(`name.ilike.%${query}%,prompt_template.ilike.%${query}%,description.ilike.%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching characters:', error.message);
    return [];
  }

  return characters ?? [];
}

/**
 * Get recently used characters
 */
export async function getRecentlyUsedCharacters(limit: number = 10): Promise<Character[]> {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .gt('use_count', 0)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recently used characters:', error.message);
    return [];
  }

  return characters ?? [];
}

/**
 * Get most used characters
 */
export async function getMostUsedCharacters(limit: number = 10): Promise<Character[]> {
  const supabase = await createClient();

  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .gt('use_count', 0)
    .order('use_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching most used characters:', error.message);
    return [];
  }

  return characters ?? [];
}

// ============================================
// EFFICIENT LOADING (with images)
// ============================================

/**
 * Get characters with preview images (first N images per character)
 */
export async function getCharactersWithPreviewImages(
  limit: number = 50,
  offset: number = 0,
  imagesPerCharacter: number = 3
): Promise<Character[]> {
  const supabase = await createClient();

  // Try using the RPC function first
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'get_characters_with_preview',
    {
      p_limit: limit,
      p_offset: offset,
      p_images_per_character: imagesPerCharacter,
    }
  );

  if (!rpcError && rpcResult) {
    return rpcResult.map(
      (row: { character_data: Character; preview_images: CharacterImage[]; primary_image: CharacterImage | null }) => ({
        ...row.character_data,
        images: row.preview_images ?? [],
        primary_image: row.primary_image ?? null,
      })
    );
  }

  // Fallback: manual loading
  const { data: characters, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching characters:', error.message);
    return [];
  }

  if (!characters || characters.length === 0) {
    return [];
  }

  // Get preview images for these characters
  const characterIds = characters.map((c) => c.id);
  const { data: images } = await supabase
    .from('character_images')
    .select('*')
    .in('character_id', characterIds)
    .order('position', { ascending: true });

  // Group images by character (limited to imagesPerCharacter)
  const imagesByCharacter = new Map<string, CharacterImage[]>();
  const primaryByCharacter = new Map<string, CharacterImage>();

  for (const image of images ?? []) {
    const existing = imagesByCharacter.get(image.character_id) ?? [];
    if (existing.length < imagesPerCharacter) {
      existing.push(image);
      imagesByCharacter.set(image.character_id, existing);
    }
    if (image.is_primary) {
      primaryByCharacter.set(image.character_id, image);
    }
  }

  return characters.map((character) => ({
    ...character,
    images: imagesByCharacter.get(character.id) ?? [],
    primary_image: primaryByCharacter.get(character.id) ?? null,
  }));
}

/**
 * Get a single character with all its images
 */
export async function getCharacterWithAllImages(
  characterId: string
): Promise<Character | null> {
  const supabase = await createClient();

  const { data: character, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (error) {
    console.error('Error fetching character:', error.message);
    return null;
  }

  if (!character) return null;

  // Get all images for this character
  const { data: images } = await supabase
    .from('character_images')
    .select('*')
    .eq('character_id', characterId)
    .order('position', { ascending: true });

  const primaryImage = images?.find((img) => img.is_primary) ?? null;

  return {
    ...character,
    images: images ?? [],
    primary_image: primaryImage,
  };
}

/**
 * Get total character count for pagination
 */
export async function getCharacterCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting characters:', error.message);
    return 0;
  }

  return count ?? 0;
}
