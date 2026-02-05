/**
 * Character Vault Types
 *
 * Types for managing reusable characters with reference images, prompts, and settings
 * Privacy model: Private only (no sharing)
 */

import type { GenerationSettings, ReferenceImageInfo } from './generation';

// ============================================
// Character Types
// ============================================

export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  negative_prompt: string | null;
  settings: Partial<GenerationSettings>;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
  /** Populated from character_images table */
  images?: CharacterImage[];
  /** Primary image for display (avatar) */
  primary_image?: CharacterImage | null;
}

export interface CharacterInsert {
  user_id: string;
  name: string;
  description?: string | null;
  prompt_template: string;
  negative_prompt?: string | null;
  settings?: Partial<GenerationSettings>;
  is_favorite?: boolean;
}

export interface CharacterUpdate {
  name?: string;
  description?: string | null;
  prompt_template?: string;
  negative_prompt?: string | null;
  settings?: Partial<GenerationSettings>;
  is_favorite?: boolean;
}

// ============================================
// Character Image Types
// ============================================

export interface CharacterImage {
  id: string;
  character_id: string;
  url: string;
  storage_path: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface CharacterImageInsert {
  character_id: string;
  url: string;
  storage_path: string;
  position?: number;
  is_primary?: boolean;
}

// ============================================
// Character Folder Types
// ============================================

export interface CharacterFolder {
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

export interface CharacterFolderInsert {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

export interface CharacterFolderUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

// ============================================
// Character Tag Types
// ============================================

export interface CharacterTag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface CharacterTagInsert {
  user_id: string;
  name: string;
  color?: string | null;
}

export interface CharacterTagUpdate {
  name?: string;
  color?: string | null;
}

// ============================================
// Junction Table Types
// ============================================

export interface CharacterFolderItem {
  character_id: string;
  folder_id: string;
  position: number;
  added_at: string;
}

export interface CharacterTagItem {
  character_id: string;
  tag_id: string;
  added_at: string;
}

export interface GenerationCharacter {
  generation_id: string;
  character_id: string;
  added_at: string;
}

// ============================================
// Extended Types (with relations)
// ============================================

export interface CharacterWithOrganization extends Character {
  tags?: CharacterTag[];
  folders?: CharacterFolder[];
}

export interface CharacterWithImages extends Character {
  images: CharacterImage[];
  primary_image: CharacterImage | null;
}

// ============================================
// Form Types (for UI)
// ============================================

export interface SaveCharacterFormData {
  name: string;
  description?: string;
  promptTemplate: string;
  negativePrompt?: string;
  settings?: Partial<GenerationSettings>;
  folderIds?: string[];
  tagIds?: string[];
}

/** Result when selecting a character for generation */
export interface CharacterSelectionResult {
  character: Character;
  /** Combined prompt (current + character template) */
  mergedPrompt: string;
  /** Merged settings (character defaults + user overrides) */
  mergedSettings: Partial<GenerationSettings>;
  /** Reference images to load */
  referenceImages: ReferenceImageInfo[];
}
