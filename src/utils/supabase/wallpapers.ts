'use server';

import { createClient } from '@/utils/supabase/server';
import { deleteFromR2 } from '@/utils/r2/client';
import type {
  Wallpaper,
  WallpaperInsert,
  WallpaperUpdate,
  WallpaperTag,
  WallpaperCollection,
  WallpaperCollectionInsert,
  WallpaperCollectionUpdate,
  WallpaperWithDetails,
  WallpaperBrowseFilters,
  PaginatedWallpapers,
} from '@/types/wallpaper';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit?: number): number {
  return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

// ============================================================================
// Wallpaper Queries
// ============================================================================

export async function getPublicWallpapers(
  filters: WallpaperBrowseFilters
): Promise<PaginatedWallpapers> {
  const supabase = await createClient();
  const limit = clampLimit(filters.limit);
  const page = Math.max(filters.page ?? 1, 1);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('wallpapers')
    .select(
      '*, profiles!inner(username, name, avatar_url), wallpaper_tag_assignments(wallpaper_tags(*))',
      { count: 'exact' }
    )
    .eq('is_public', true);

  // Search
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // User filter
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  // Resolution filter
  if (filters.resolution) {
    switch (filters.resolution) {
      case 'hd':
        query = query.gte('width', 1280).lt('width', 1920);
        break;
      case 'fullhd':
        query = query.gte('width', 1920).lt('width', 2560);
        break;
      case '2k':
        query = query.gte('width', 2560).lt('width', 3840);
        break;
      case '4k':
        query = query.gte('width', 3840).lt('width', 5120);
        break;
      case '5k':
        query = query.gte('width', 5120);
        break;
    }
  }

  // Sort
  switch (filters.sort) {
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    case 'most-downloaded':
      query = query.order('download_count', { ascending: false });
      break;
    case 'most-liked':
      query = query.order('like_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching wallpapers:', error.message);
    return { wallpapers: [], total: 0, page, totalPages: 0, hasMore: false };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const wallpapers: WallpaperWithDetails[] = (data ?? []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as { username: string; name: string | null; avatar_url: string | null } | undefined;
    const tagAssignments = row.wallpaper_tag_assignments as Array<{ wallpaper_tags: WallpaperTag }> | undefined;

    const { profiles: _p, wallpaper_tag_assignments: _t, ...wallpaperFields } = row;
    return {
      ...wallpaperFields,
      user: profiles ? {
        username: profiles.username,
        name: profiles.name,
        avatar_url: profiles.avatar_url,
      } : undefined,
      tags: tagAssignments?.map((a) => a.wallpaper_tags).filter(Boolean) ?? [],
    } as WallpaperWithDetails;
  });

  // Filter by tag if specified (post-query since Supabase doesn't support filtering on nested joins easily)
  let filteredWallpapers = wallpapers;
  if (filters.tag) {
    filteredWallpapers = wallpapers.filter((w) =>
      w.tags?.some((t) => t.slug === filters.tag)
    );
  }

  return {
    wallpapers: filteredWallpapers,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getUserWallpapers(
  username: string,
  filters?: WallpaperBrowseFilters
): Promise<PaginatedWallpapers> {
  const supabase = await createClient();
  const limit = clampLimit(filters?.limit);
  const page = Math.max(filters?.page ?? 1, 1);
  const offset = (page - 1) * limit;

  // Get user ID from username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) {
    return { wallpapers: [], total: 0, page, totalPages: 0, hasMore: false };
  }

  let query = supabase
    .from('wallpapers')
    .select(
      '*, profiles!inner(username, name, avatar_url), wallpaper_tag_assignments(wallpaper_tags(*))',
      { count: 'exact' }
    )
    .eq('user_id', profile.id)
    .eq('is_public', true);

  // Collection filter
  if (filters?.collection) {
    const { data: collectionItems } = await supabase
      .from('wallpaper_collection_items')
      .select('wallpaper_id')
      .eq('collection_id', filters.collection);

    if (collectionItems && collectionItems.length > 0) {
      query = query.in('id', collectionItems.map((i) => i.wallpaper_id));
    } else {
      return { wallpapers: [], total: 0, page, totalPages: 0, hasMore: false };
    }
  }

  // Tag filter
  if (filters?.tag) {
    const { data: tagData } = await supabase
      .from('wallpaper_tags')
      .select('id')
      .eq('slug', filters.tag)
      .single();

    if (tagData) {
      const { data: taggedIds } = await supabase
        .from('wallpaper_tag_assignments')
        .select('wallpaper_id')
        .eq('tag_id', tagData.id);

      if (taggedIds && taggedIds.length > 0) {
        query = query.in('id', taggedIds.map((i) => i.wallpaper_id));
      } else {
        return { wallpapers: [], total: 0, page, totalPages: 0, hasMore: false };
      }
    }
  }

  switch (filters?.sort) {
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    case 'most-downloaded':
      query = query.order('download_count', { ascending: false });
      break;
    case 'most-liked':
      query = query.order('like_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching user wallpapers:', error.message);
    return { wallpapers: [], total: 0, page, totalPages: 0, hasMore: false };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const wallpapers: WallpaperWithDetails[] = (data ?? []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as { username: string; name: string | null; avatar_url: string | null } | undefined;
    const tagAssignments = row.wallpaper_tag_assignments as Array<{ wallpaper_tags: WallpaperTag }> | undefined;

    const { profiles: _p, wallpaper_tag_assignments: _t, ...wallpaperFields } = row;
    return {
      ...wallpaperFields,
      user: profiles ? {
        username: profiles.username,
        name: profiles.name,
        avatar_url: profiles.avatar_url,
      } : undefined,
      tags: tagAssignments?.map((a) => a.wallpaper_tags).filter(Boolean) ?? [],
    } as WallpaperWithDetails;
  });

  return {
    wallpapers,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getWallpaperById(
  id: string
): Promise<WallpaperWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpapers')
    .select(
      '*, profiles!inner(username, name, avatar_url), wallpaper_tag_assignments(wallpaper_tags(*))'
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching wallpaper:', error?.message);
    return null;
  }

  const row = data as Record<string, unknown>;
  const profiles = row.profiles as { username: string; name: string | null; avatar_url: string | null } | undefined;
  const tagAssignments = row.wallpaper_tag_assignments as Array<{ wallpaper_tags: WallpaperTag }> | undefined;

  const { profiles: _p, wallpaper_tag_assignments: _t, ...wallpaperFields } = row;

  // Check if current user liked this wallpaper
  let isLiked = false;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: likeData } = await supabase
      .from('wallpaper_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('wallpaper_id', id)
      .single();
    isLiked = !!likeData;
  }

  return {
    ...wallpaperFields,
    user: profiles ? {
      username: profiles.username,
      name: profiles.name,
      avatar_url: profiles.avatar_url,
    } : undefined,
    tags: tagAssignments?.map((a) => a.wallpaper_tags).filter(Boolean) ?? [],
    is_liked: isLiked,
  } as WallpaperWithDetails;
}

// ============================================================================
// Wallpaper Mutations
// ============================================================================

export async function createWallpaper(
  data: WallpaperInsert,
  tagNames: string[]
): Promise<Wallpaper | null> {
  const supabase = await createClient();

  const { data: wallpaper, error } = await supabase
    .from('wallpapers')
    .insert(data)
    .select()
    .single();

  if (error || !wallpaper) {
    console.error('Error creating wallpaper:', error?.message);
    return null;
  }

  // Handle tags
  if (tagNames.length > 0) {
    for (const name of tagNames) {
      const normalizedName = name.toLowerCase().trim();
      const slug = normalizedName.replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');

      // Upsert tag
      const { data: tag } = await supabase
        .from('wallpaper_tags')
        .upsert({ name: normalizedName, slug }, { onConflict: 'name' })
        .select()
        .single();

      if (tag) {
        // Create assignment
        await supabase
          .from('wallpaper_tag_assignments')
          .insert({ wallpaper_id: wallpaper.id, tag_id: tag.id });

        // Increment usage count
        await supabase
          .from('wallpaper_tags')
          .update({ usage_count: tag.usage_count + 1 })
          .eq('id', tag.id);
      }
    }
  }

  return wallpaper as Wallpaper;
}

export async function updateWallpaper(
  id: string,
  updates: WallpaperUpdate
): Promise<Wallpaper | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpapers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating wallpaper:', error.message);
    return null;
  }

  return data as Wallpaper;
}

export async function deleteWallpaper(id: string): Promise<boolean> {
  const supabase = await createClient();

  // Get the wallpaper to find R2 keys
  const { data: wallpaper } = await supabase
    .from('wallpapers')
    .select('image_path, thumbnail_path')
    .eq('id', id)
    .single();

  if (!wallpaper) return false;

  // Delete from DB (cascades to tag assignments, collection items, likes)
  const { error } = await supabase
    .from('wallpapers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting wallpaper:', error.message);
    return false;
  }

  // Delete from R2
  const keysToDelete = [wallpaper.image_path];
  if (wallpaper.thumbnail_path) keysToDelete.push(wallpaper.thumbnail_path);
  await deleteFromR2(keysToDelete);

  return true;
}

// ============================================================================
// Tags
// ============================================================================

export async function getWallpaperTags(): Promise<WallpaperTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpaper_tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching tags:', error.message);
    return [];
  }

  return (data ?? []) as WallpaperTag[];
}

export async function searchWallpaperTags(query: string): Promise<WallpaperTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpaper_tags')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching tags:', error.message);
    return [];
  }

  return (data ?? []) as WallpaperTag[];
}

// ============================================================================
// Collections
// ============================================================================

export async function getUserWallpaperCollections(
  userId: string
): Promise<WallpaperCollection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpaper_collections')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }

  return (data ?? []) as WallpaperCollection[];
}

export async function createWallpaperCollection(
  data: WallpaperCollectionInsert
): Promise<WallpaperCollection | null> {
  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from('wallpaper_collections')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error.message);
    return null;
  }

  return collection as WallpaperCollection;
}

export async function updateWallpaperCollection(
  id: string,
  updates: WallpaperCollectionUpdate
): Promise<WallpaperCollection | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallpaper_collections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating collection:', error.message);
    return null;
  }

  return data as WallpaperCollection;
}

export async function deleteWallpaperCollection(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('wallpaper_collections')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting collection:', error.message);
    return false;
  }

  return true;
}

export async function addToCollection(
  collectionId: string,
  wallpaperId: string,
  position?: number
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('wallpaper_collection_items')
    .insert({
      collection_id: collectionId,
      wallpaper_id: wallpaperId,
      position: position ?? 0,
    });

  if (error) {
    console.error('Error adding to collection:', error.message);
    return false;
  }

  return true;
}

export async function removeFromCollection(
  collectionId: string,
  wallpaperId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('wallpaper_collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('wallpaper_id', wallpaperId);

  if (error) {
    console.error('Error removing from collection:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// Likes
// ============================================================================

export async function getUserLikedWallpaperIds(
  wallpaperIds: string[]
): Promise<Set<string>> {
  if (wallpaperIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('wallpaper_likes')
    .select('wallpaper_id')
    .eq('user_id', user.id)
    .in('wallpaper_id', wallpaperIds);

  if (error) {
    console.error('Error fetching liked wallpapers:', error.message);
    return new Set();
  }

  return new Set((data ?? []).map((l) => l.wallpaper_id));
}
