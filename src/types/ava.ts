/**
 * Ava Types
 *
 * Avas are custom AI prompt generators. Users create an Ava with instructions
 * (system prompt), then run it with text/image input to generate image
 * generation prompts via Gemini Flash.
 */

// ============================================
// Core Ava Types
// ============================================

export interface Ava {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  instructions: string;
  avatar_url: string | null;
  original_ava_id: string | null;
  original_author_id: string | null;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface AvaInsert {
  user_id: string;
  name: string;
  description?: string | null;
  instructions: string;
  avatar_url?: string | null;
}

export interface AvaUpdate {
  name?: string;
  description?: string | null;
  instructions?: string;
  avatar_url?: string | null;
  is_favorite?: boolean;
}

// ============================================
// Sharing Types
// ============================================

export interface AvaShare {
  id: string;
  ava_id: string;
  shared_by: string;
  shared_with: string;
  message: string | null;
  is_seen: boolean;
  duplicated_ava_id: string | null;
  created_at: string;
}

export interface AvaShareInsert {
  ava_id: string;
  shared_by: string;
  shared_with: string;
  message?: string | null;
}

export interface AvaShareWithDetails extends AvaShare {
  ava: Ava;
  sharer: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ============================================
// Folder Types
// ============================================

export interface AvaFolder {
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

export interface AvaFolderInsert {
  user_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

export interface AvaFolderUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  position?: number;
}

// ============================================
// Tag Types
// ============================================

export interface AvaTag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface AvaTagInsert {
  user_id: string;
  name: string;
  color?: string | null;
}

export interface AvaTagUpdate {
  name?: string;
  color?: string | null;
}

// ============================================
// Junction Table Types
// ============================================

export interface AvaFolderItem {
  ava_id: string;
  folder_id: string;
  position: number;
  added_at: string;
}

export interface AvaTagItem {
  ava_id: string;
  tag_id: string;
  added_at: string;
}

// ============================================
// Extended Types
// ============================================

export interface AvaWithOrganization extends Ava {
  tags?: AvaTag[];
  folders?: AvaFolder[];
}

// ============================================
// Form Data Types
// ============================================

export interface SaveAvaFormData {
  name: string;
  description?: string;
  instructions: string;
  avatarUrl?: string;
  folderIds?: string[];
  tagIds?: string[];
}

// ============================================
// Run Ava Types
// ============================================

export interface RunAvaRequest {
  avaId: string;
  apiId: string;
  inputText?: string;
  inputImages?: string[]; // base64 data URLs
}

export interface RunAvaResponse {
  success: boolean;
  prompt?: string;
  negativePrompt?: string;
  error?: string;
}
