/**
 * Reference image stored in the database
 */
export interface ReferenceImage {
  id: string;
  user_id: string;
  storage_path: string;
  name: string | null;
  created_at: string;
}

/**
 * Reference image with resolved public URL for display
 */
export interface ReferenceImageWithUrl extends ReferenceImage {
  url: string;
}

/**
 * Input for creating a new reference image
 */
export interface CreateReferenceImageInput {
  storage_path: string;
  name?: string;
}

/**
 * Input for updating a reference image
 */
export interface UpdateReferenceImageInput {
  name?: string;
}
