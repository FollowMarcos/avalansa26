/**
 * Prompt Vault Types
 *
 * Types for saving, organizing, and sharing prompts
 * Privacy model: Private by default, direct sharing only
 */

import type { GenerationSettings, Generation } from './generation';

// ============================================
// Prompt Types
// ============================================

export interface Prompt {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt_text: string;
  negative_prompt: string | null;
  settings: Partial<GenerationSettings>;
  original_prompt_id: string | null;
  original_author_id: string | null;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
  // Optional images (populated from prompt_images table)
  images?: PromptImage[];
}

// ============================================
// Prompt Image Types
// ============================================

export interface PromptImage {
  id: string;
  prompt_id: string;
  url: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface PromptImageInsert {
  prompt_id: string;
  url: string;
  storage_path: string;
  position?: number;
}

export interface PromptInsert {
  user_id: string;
  name: string;
  description?: string | null;
  prompt_text: string;
  negative_prompt?: string | null;
  settings?: Partial<GenerationSettings>;
  original_prompt_id?: string | null;
  original_author_id?: string | null;
  is_favorite?: boolean;
}

export interface PromptUpdate {
  name?: string;
  description?: string | null;
  prompt_text?: string;
  negative_prompt?: string | null;
  settings?: Partial<GenerationSettings>;
  is_favorite?: boolean;
}

// ============================================
// Prompt Share Types
// ============================================

export interface PromptShare {
  id: string;
  prompt_id: string;
  shared_by: string;
  shared_with: string;
  message: string | null;
  is_seen: boolean;
  duplicated_prompt_id: string | null;
  created_at: string;
}

export interface PromptShareInsert {
  prompt_id: string;
  shared_by: string;
  shared_with: string;
  message?: string | null;
}

// ============================================
// Prompt Folder Types
// ============================================

export interface PromptFolder {
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

export interface PromptFolderInsert {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

export interface PromptFolderUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

// ============================================
// Prompt Tag Types
// ============================================

export interface PromptTag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface PromptTagInsert {
  user_id: string;
  name: string;
  color?: string | null;
}

export interface PromptTagUpdate {
  name?: string;
  color?: string | null;
}

// ============================================
// Junction Table Types
// ============================================

export interface PromptFolderItem {
  prompt_id: string;
  folder_id: string;
  position: number;
  added_at: string;
}

export interface PromptTagItem {
  prompt_id: string;
  tag_id: string;
  added_at: string;
}

// ============================================
// Extended Types (with relations)
// ============================================

export interface PromptWithOrganization extends Prompt {
  tags?: PromptTag[];
  folders?: PromptFolder[];
}

export interface PromptShareWithDetails extends PromptShare {
  prompt: Prompt;
  sharer: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

// ============================================
// Form Types (for UI)
// ============================================

export interface SavePromptFormData {
  name: string;
  description?: string;
  folderIds?: string[];
  tagIds?: string[];
}

export interface SharePromptFormData {
  userIds: string[];
  message?: string;
}
