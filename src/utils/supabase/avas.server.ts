'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  Ava,
  AvaInsert,
  AvaUpdate,
  AvaFolder,
  AvaFolderInsert,
  AvaFolderUpdate,
  AvaTag,
  AvaTagInsert,
  AvaTagUpdate,
  AvaShare,
  AvaShareInsert,
  AvaShareWithDetails,
} from '@/types/ava';

// ============================================
// AVAS - CRUD Operations
// ============================================

/**
 * Save a new ava to the user's vault
 */
export async function saveAva(
  data: Omit<AvaInsert, 'user_id'>
): Promise<Ava | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ava, error } = await supabase
    .from('avas')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error saving ava:', error.message);
    return null;
  }

  return ava;
}

/**
 * Get user's avas from their vault (paginated, newest first)
 */
export async function getAvas(
  limit: number = 100,
  offset: number = 0
): Promise<Ava[]> {
  const supabase = await createClient();

  const { data: avas, error } = await supabase
    .from('avas')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching avas:', error.message);
    return [];
  }

  return avas ?? [];
}

/**
 * Get a single ava by ID
 */
export async function getAva(id: string): Promise<Ava | null> {
  const supabase = await createClient();

  const { data: ava, error } = await supabase
    .from('avas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching ava:', error.message);
    return null;
  }

  return ava;
}

/**
 * Update an ava
 */
export async function updateAva(
  avaId: string,
  data: AvaUpdate
): Promise<Ava | null> {
  const supabase = await createClient();

  const { data: ava, error } = await supabase
    .from('avas')
    .update(data)
    .eq('id', avaId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ava:', error.message);
    return null;
  }

  return ava;
}

/**
 * Delete an ava
 */
export async function deleteAva(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('avas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting ava:', error.message);
    return false;
  }

  return true;
}

/**
 * Get user's favorite avas
 */
export async function getFavoriteAvas(
  limit: number = 50,
  offset: number = 0
): Promise<Ava[]> {
  const supabase = await createClient();

  const { data: avas, error } = await supabase
    .from('avas')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching favorite avas:', error.message);
    return [];
  }

  return avas ?? [];
}

/**
 * Toggle favorite status for an ava
 */
export async function toggleAvaFavorite(
  avaId: string,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('avas')
    .update({ is_favorite: isFavorite })
    .eq('id', avaId);

  if (error) {
    console.error('Error toggling ava favorite:', error.message);
    return false;
  }

  return true;
}

/**
 * Increment use count when running an ava
 */
export async function incrementAvaUseCount(avaId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_ava_use_count', {
    p_ava_id: avaId,
  });

  if (error) {
    console.error('Error incrementing ava use count:', error.message);
    return false;
  }

  return true;
}

// ============================================
// AVA FOLDERS
// ============================================

/**
 * Get all user's ava folders
 */
export async function getAvaFolders(): Promise<AvaFolder[]> {
  const supabase = await createClient();

  const { data: folders, error } = await supabase
    .from('ava_folders')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching ava folders:', error.message);
    return [];
  }

  return folders ?? [];
}

/**
 * Create a new ava folder
 */
export async function createAvaFolder(
  data: Omit<AvaFolderInsert, 'user_id'>
): Promise<AvaFolder | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: folder, error } = await supabase
    .from('ava_folders')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating ava folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Update an ava folder
 */
export async function updateAvaFolder(
  folderId: string,
  data: AvaFolderUpdate
): Promise<AvaFolder | null> {
  const supabase = await createClient();

  const { data: folder, error } = await supabase
    .from('ava_folders')
    .update(data)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ava folder:', error.message);
    return null;
  }

  return folder;
}

/**
 * Delete an ava folder
 */
export async function deleteAvaFolder(folderId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting ava folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Add an ava to a folder
 */
export async function addAvaToFolder(
  avaId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_folder_items')
    .insert({ ava_id: avaId, folder_id: folderId });

  if (error) {
    if (error.code === '23505') {
      return true;
    }
    console.error('Error adding ava to folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove an ava from a folder
 */
export async function removeAvaFromFolder(
  avaId: string,
  folderId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_folder_items')
    .delete()
    .eq('ava_id', avaId)
    .eq('folder_id', folderId);

  if (error) {
    console.error('Error removing ava from folder:', error.message);
    return false;
  }

  return true;
}

/**
 * Get avas in a folder
 */
export async function getAvasByFolder(
  folderId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Ava[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ava_folder_items')
    .select('ava_id, avas(*)')
    .eq('folder_id', folderId)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching folder avas:', error.message);
    return [];
  }

  return (
    (data?.map((item) => item.avas).filter(Boolean) as unknown as Ava[]) ?? []
  );
}

// ============================================
// AVA TAGS
// ============================================

/**
 * Get all user's ava tags
 */
export async function getAvaTags(): Promise<AvaTag[]> {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('ava_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching ava tags:', error.message);
    return [];
  }

  return tags ?? [];
}

/**
 * Create a new ava tag
 */
export async function createAvaTag(
  data: Omit<AvaTagInsert, 'user_id'>
): Promise<AvaTag | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tag, error } = await supabase
    .from('ava_tags')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existingTag } = await supabase
        .from('ava_tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', data.name)
        .single();
      return existingTag;
    }
    console.error('Error creating ava tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Update an ava tag
 */
export async function updateAvaTag(
  tagId: string,
  data: AvaTagUpdate
): Promise<AvaTag | null> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from('ava_tags')
    .update(data)
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ava tag:', error.message);
    return null;
  }

  return tag;
}

/**
 * Delete an ava tag
 */
export async function deleteAvaTag(tagId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('ava_tags').delete().eq('id', tagId);

  if (error) {
    console.error('Error deleting ava tag:', error.message);
    return false;
  }

  return true;
}

/**
 * Add a tag to an ava
 */
export async function addTagToAva(
  avaId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_tag_items')
    .insert({ ava_id: avaId, tag_id: tagId });

  if (error) {
    if (error.code === '23505') {
      return true;
    }
    console.error('Error adding tag to ava:', error.message);
    return false;
  }

  return true;
}

/**
 * Remove a tag from an ava
 */
export async function removeTagFromAva(
  avaId: string,
  tagId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_tag_items')
    .delete()
    .eq('ava_id', avaId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from ava:', error.message);
    return false;
  }

  return true;
}

/**
 * Get tags for a specific ava
 */
export async function getAvaTagsForAva(avaId: string): Promise<AvaTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ava_tag_items')
    .select('tag_id, ava_tags(*)')
    .eq('ava_id', avaId);

  if (error) {
    console.error('Error fetching ava tags:', error.message);
    return [];
  }

  return (
    (data
      ?.map((item) => item.ava_tags)
      .filter(Boolean) as unknown as AvaTag[]) ?? []
  );
}

/**
 * Create tag and add to ava in one operation
 */
export async function createAndAddTagToAva(
  avaId: string,
  tagName: string,
  tagColor?: string
): Promise<AvaTag | null> {
  const tag = await createAvaTag({ name: tagName, color: tagColor });
  if (!tag) return null;

  const success = await addTagToAva(avaId, tag.id);
  if (!success) return null;

  return tag;
}

// ============================================
// AVA SHARING
// ============================================

/**
 * Share an ava with another user
 */
export async function shareAvaWithUser(
  data: Omit<AvaShareInsert, 'shared_by'>
): Promise<AvaShare | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: share, error } = await supabase
    .from('ava_shares')
    .insert({ ...data, shared_by: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.error('Ava already shared with this user');
      return null;
    }
    console.error('Error sharing ava:', error.message);
    return null;
  }

  // Auto-process the share (create duplicate for recipient)
  if (share) {
    await processAvaShare(share.id);
  }

  return share;
}

/**
 * Process an ava share (auto-accept by creating duplicate)
 */
export async function processAvaShare(
  shareId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('process_ava_share', {
    p_share_id: shareId,
  });

  if (error) {
    console.error('Error processing ava share:', error.message);
    return null;
  }

  return data as string;
}

/**
 * Get shares the user has sent
 */
export async function getSentAvaShares(): Promise<AvaShare[]> {
  const supabase = await createClient();

  const { data: shares, error } = await supabase
    .from('ava_shares')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sent ava shares:', error.message);
    return [];
  }

  return shares ?? [];
}

/**
 * Get shares the user has received (with details)
 */
export async function getReceivedAvaShares(): Promise<AvaShareWithDetails[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: shares, error } = await supabase
    .from('ava_shares')
    .select(
      `
      *,
      avas!ava_shares_ava_id_fkey(*),
      profiles!ava_shares_shared_by_fkey(id, username, avatar_url)
    `
    )
    .eq('shared_with', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching received ava shares:', error.message);
    return [];
  }

  return (
    shares?.map((share) => ({
      ...share,
      ava: share.avas as unknown as Ava,
      sharer: share.profiles as unknown as {
        id: string;
        username: string;
        avatar_url: string | null;
      },
    })) ?? []
  );
}

/**
 * Get unseen ava share count
 */
export async function getUnseenAvaShareCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('ava_shares')
    .select('*', { count: 'exact', head: true })
    .eq('shared_with', user.id)
    .eq('is_seen', false);

  if (error) {
    console.error('Error counting unseen ava shares:', error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Mark an ava share as seen
 */
export async function markAvaShareAsSeen(shareId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ava_shares')
    .update({ is_seen: true })
    .eq('id', shareId);

  if (error) {
    console.error('Error marking ava share as seen:', error.message);
    return false;
  }

  return true;
}

// ============================================
// SEARCH & FILTERING
// ============================================

/**
 * Search avas by text
 */
export async function searchAvas(
  query: string,
  limit: number = 20
): Promise<Ava[]> {
  const supabase = await createClient();

  const sanitizedQuery = query.replace(/[%_,]/g, '\\$&');
  const { data: avas, error } = await supabase
    .from('avas')
    .select('*')
    .or(`name.ilike.%${sanitizedQuery}%,instructions.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching avas:', error.message);
    return [];
  }

  return avas ?? [];
}

/**
 * Get recently used avas
 */
export async function getRecentlyUsedAvas(limit: number = 10): Promise<Ava[]> {
  const supabase = await createClient();

  const { data: avas, error } = await supabase
    .from('avas')
    .select('*')
    .gt('use_count', 0)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recently used avas:', error.message);
    return [];
  }

  return avas ?? [];
}

/**
 * Get most used avas
 */
export async function getMostUsedAvas(limit: number = 10): Promise<Ava[]> {
  const supabase = await createClient();

  const { data: avas, error } = await supabase
    .from('avas')
    .select('*')
    .gt('use_count', 0)
    .order('use_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching most used avas:', error.message);
    return [];
  }

  return avas ?? [];
}
