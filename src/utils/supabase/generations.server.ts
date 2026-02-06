'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  Generation,
  GenerationInsert,
  Collection,
  CollectionInsert,
  CollectionUpdate,
  Tag,
  TagInsert,
  TagUpdate,
} from '@/types/generation';

/**
 * Save a new generation to history
 */
export async function saveGeneration(
  data: GenerationInsert
): Promise<Generation | null> {
  const supabase = await createClient();

  const { data: generation, error } = await supabase
    .from('generations')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error saving generation:', error.message);
    return null;
  }

  return generation;
}

/**
 * Get user's generation history (paginated, newest first)
 */
export async function getGenerationHistory(
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching generation history:', error.message);
    return [];
  }

  return generations ?? [];
}

/**
 * Get a single generation by ID
 */
export async function getGeneration(id: string): Promise<Generation | null> {
  const supabase = await createClient();

  const { data: generation, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching generation:', error.message);
    return null;
  }

  return generation;
}

/**
 * Delete a generation by ID (removes from both storage and database)
 */
export async function deleteGeneration(id: string): Promise<boolean> {
  const supabase = await createClient();

  // First, fetch the image_path so we can delete from storage
  const { data: generation, error: fetchError } = await supabase
    .from('generations')
    .select('image_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching generation for deletion:', fetchError.message);
    return false;
  }

  // Delete from storage if image_path exists
  if (generation?.image_path) {
    const { error: storageError } = await supabase.storage
      .from('generations')
      .remove([generation.image_path]);

    if (storageError) {
      console.error('Error deleting image from storage:', storageError.message);
      // Continue to delete DB record anyway
    }
  }

  // Delete database record
  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting generation:', error.message);
    return false;
  }

  return true;
}

/**
 * Clear all user's generations (removes from both storage and database)
 */
export async function clearGenerationHistory(): Promise<boolean> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Fetch all image paths for storage cleanup
  const { data: generations } = await supabase
    .from('generations')
    .select('image_path')
    .eq('user_id', user.id);

  // Delete from storage in bulk
  if (generations && generations.length > 0) {
    const paths = generations
      .map((g) => g.image_path)
      .filter((p): p is string => p !== null);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('generations')
        .remove(paths);

      if (storageError) {
        console.error('Error deleting images from storage:', storageError.message);
        // Continue to delete DB records anyway
      }
    }
  }

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing generation history:', error.message);
    return false;
  }

  return true;
}

/**
 * Get count of user's generations
 */
export async function getGenerationCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting generations:', error.message);
    return 0;
  }

  return count ?? 0;
}

// ============================================
// FAVORITES
// ============================================

/**
 * Toggle favorite status for a generation
 */
export async function toggleFavorite(
  generationId: string,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generations')
    .update({ is_favorite: isFavorite })
    .eq('id', generationId);

  if (error) {
    console.error('Error toggling favorite:', error.message);
    return false;
  }

  return true;
}

/**
 * Get user's favorite generations
 */
export async function getFavoriteGenerations(
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching favorite generations:', error.message);
    return [];
  }

  return generations ?? [];
}

// ============================================
// COLLECTIONS
// ============================================

/**
 * Get all user's collections
 */
export async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient();

  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }

  return collections ?? [];
}

/**
 * Create a new collection
 */
export async function createCollection(
  data: Omit<CollectionInsert, 'user_id'>
): Promise<Collection | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error.message);
    return null;
  }

  return collection;
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  data: CollectionUpdate
): Promise<Collection | null> {
  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from('collections')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating collection:', error.message);
    return null;
  }

  return collection;
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (error) {
    console.error('Error deleting collection:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a generation to a collection
 */
export async function addToCollection(
  generationId: string,
  collectionId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_collections')
    .insert({ generation_id: generationId, collection_id: collectionId });

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - already in collection
      return true;
    }
    console.error('Error adding to collection:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a generation from a collection
 */
export async function removeFromCollection(
  generationId: string,
  collectionId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_collections')
    .delete()
    .eq('generation_id', generationId)
    .eq('collection_id', collectionId);

  if (error) {
    console.error('Error removing from collection:', error.message);
    return false;
  }

  return true;
}

/**
 * Get generations in a collection
 */
export async function getGenerationsByCollection(
  collectionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_collections')
    .select('generation_id, generations(*)')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching collection generations:', error.message);
    return [];
  }

  return (data?.map((item) => item.generations).filter(Boolean) as unknown as Generation[]) ?? [];
}

/**
 * Get collections for a specific generation
 */
export async function getGenerationCollections(
  generationId: string
): Promise<Collection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_collections')
    .select('collection_id, collections(*)')
    .eq('generation_id', generationId);

  if (error) {
    console.error('Error fetching generation collections:', error.message);
    return [];
  }

  return (data?.map((item) => item.collections).filter(Boolean) as unknown as Collection[]) ?? [];
}

// ============================================
// TAGS
// ============================================

/**
 * Get all user's tags
 */
export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error.message);
    return [];
  }

  return tags ?? [];
}

/**
 * Create a new tag
 */
export async function createTag(
  data: Omit<TagInsert, 'user_id'>
): Promise<Tag | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tag, error } = await supabase
    .from('tags')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint - tag with this name exists, fetch it
      const { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', data.name)
        .single();
      return existingTag;
    }
    console.error('Error creating tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Update a tag
 */
export async function updateTag(
  tagId: string,
  data: TagUpdate
): Promise<Tag | null> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from('tags')
    .update(data)
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('tags').delete().eq('id', tagId);

  if (error) {
    console.error('Error deleting tag:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a tag to a generation
 */
export async function addTagToGeneration(
  generationId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_tags')
    .insert({ generation_id: generationId, tag_id: tagId });

  if (error) {
    if (error.code === '23505') {
      // Already tagged
      return true;
    }
    console.error('Error adding tag to generation:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a tag from a generation
 */
export async function removeTagFromGeneration(
  generationId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generation_tags')
    .delete()
    .eq('generation_id', generationId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from generation:', error.message);
    return false;
  }

  return true;
}

/**
 * Get tags for a specific generation
 */
export async function getGenerationTags(generationId: string): Promise<Tag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_tags')
    .select('tag_id, tags(*)')
    .eq('generation_id', generationId);

  if (error) {
    console.error('Error fetching generation tags:', error.message);
    return [];
  }

  return (data?.map((item) => item.tags).filter(Boolean) as unknown as Tag[]) ?? [];
}

/**
 * Get generations with a specific tag
 */
export async function getGenerationsByTag(
  tagId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generation_tags')
    .select('generation_id, generations(*)')
    .eq('tag_id', tagId)
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching tag generations:', error.message);
    return [];
  }

  return (data?.map((item) => item.generations).filter(Boolean) as unknown as Generation[]) ?? [];
}

/**
 * Create tag and add to generation in one operation
 */
export async function createAndAddTag(
  generationId: string,
  tagName: string,
  tagColor?: string
): Promise<Tag | null> {
  const tag = await createTag({ name: tagName, color: tagColor });
  if (!tag) return null;

  const success = await addTagToGeneration(generationId, tag.id);
  if (!success) return null;

  return tag;
}
