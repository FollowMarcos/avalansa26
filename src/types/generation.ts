/**
 * Generation Types
 *
 * Types for storing user's generated images history
 */

export interface GenerationSettings {
  aspectRatio?: string;
  imageSize?: string;
  outputCount?: number;
  generationSpeed?: string;
  model?: string;
}

export interface Generation {
  id: string;
  user_id: string;
  api_config_id: string | null;
  session_id: string | null;
  prompt: string;
  negative_prompt: string | null;
  image_url: string;
  image_path: string | null;
  settings: GenerationSettings;
  created_at: string;
}

export interface GenerationInsert {
  user_id: string;
  api_config_id?: string | null;
  session_id?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  image_url: string;
  image_path?: string | null;
  settings: GenerationSettings;
}
