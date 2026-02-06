/**
 * Generation Types
 *
 * Types for storing user's generated images history
 */

export interface ReferenceImageInfo {
  url: string;
  storagePath?: string;
}

export interface GenerationSettings {
  aspectRatio?: string;
  imageSize?: string;
  outputCount?: number;
  generationSpeed?: string;
  model?: string;
  referenceImages?: ReferenceImageInfo[];
}

export interface Generation {
  id: string;
  user_id: string;
  api_config_id: string | null;
  prompt: string;
  negative_prompt: string | null;
  image_url: string;
  image_path: string | null;
  settings: GenerationSettings;
  is_favorite: boolean;
  created_at: string;
}

// ============================================
// Collection Types
// ============================================

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionInsert {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

export interface CollectionUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

// ============================================
// Tag Types
// ============================================

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface TagInsert {
  user_id: string;
  name: string;
  color?: string | null;
}

export interface TagUpdate {
  name?: string;
  color?: string | null;
}

// ============================================
// Junction Table Types
// ============================================

export interface GenerationCollection {
  id: string;
  generation_id: string;
  collection_id: string;
  added_at: string;
}

export interface GenerationTag {
  id: string;
  generation_id: string;
  tag_id: string;
  added_at: string;
}

// ============================================
// Extended Types (with relations)
// ============================================

export interface GenerationWithOrganization extends Generation {
  tags?: Tag[];
  collections?: Collection[];
}

export interface GenerationInsert {
  user_id: string;
  api_config_id?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  image_url: string;
  image_path?: string | null;
  settings: GenerationSettings;
  is_favorite?: boolean;
}

export interface GenerationUpdate {
  is_favorite?: boolean;
}
