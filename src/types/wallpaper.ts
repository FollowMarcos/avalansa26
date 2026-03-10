// ============================================================================
// Wallpaper Types
// ============================================================================

export interface Wallpaper {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  slug: string;
  image_url: string;
  image_path: string;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  aspect_ratio: string | null;
  download_count: number;
  view_count: number;
  like_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WallpaperInsert {
  user_id: string;
  title: string;
  description?: string | null;
  slug: string;
  image_url: string;
  image_path: string;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  aspect_ratio?: string | null;
  is_public?: boolean;
}

export interface WallpaperUpdate {
  title?: string;
  description?: string | null;
  is_public?: boolean;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
}

// ============================================================================
// Tag Types
// ============================================================================

export interface WallpaperTag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export interface WallpaperTagAssignment {
  id: string;
  wallpaper_id: string;
  tag_id: string;
  added_at: string;
}

// ============================================================================
// Collection Types
// ============================================================================

export interface WallpaperCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string;
  cover_wallpaper_id: string | null;
  is_public: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface WallpaperCollectionInsert {
  user_id: string;
  name: string;
  description?: string | null;
  slug: string;
  cover_wallpaper_id?: string | null;
  is_public?: boolean;
  position?: number;
}

export interface WallpaperCollectionUpdate {
  name?: string;
  description?: string | null;
  cover_wallpaper_id?: string | null;
  is_public?: boolean;
  position?: number;
}

export interface WallpaperCollectionItem {
  id: string;
  wallpaper_id: string;
  collection_id: string;
  position: number;
  added_at: string;
}

// ============================================================================
// Like Types
// ============================================================================

export interface WallpaperLike {
  id: string;
  user_id: string;
  wallpaper_id: string;
  created_at: string;
}

// ============================================================================
// Composite Types
// ============================================================================

export interface WallpaperWithDetails extends Wallpaper {
  tags?: WallpaperTag[];
  collections?: WallpaperCollection[];
  user?: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

// ============================================================================
// Filter & Pagination Types
// ============================================================================

export type WallpaperSortOption = 'newest' | 'popular' | 'most-downloaded' | 'most-liked';
export type ResolutionFilter = 'hd' | 'fullhd' | '2k' | '4k' | '5k';

export interface WallpaperBrowseFilters {
  tag?: string;
  collection?: string;
  resolution?: ResolutionFilter;
  sort?: WallpaperSortOption;
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
}

export interface PaginatedWallpapers {
  wallpapers: WallpaperWithDetails[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
