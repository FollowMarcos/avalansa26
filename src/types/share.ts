/**
 * Share Types
 *
 * Types for shareable canvas links
 */

import type { Node, Edge } from '@xyflow/react';
import type { ImageNodeData, CanvasViewport } from './canvas';

/**
 * Canvas share record stored in database
 */
export interface CanvasShare {
  id: string;
  canvas_id: string;
  user_id: string;
  share_token: string;
  title: string | null;
  description: string | null;
  expires_at: string | null;
  view_count: number;
  show_prompts: boolean;
  allow_download: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Data for inserting a new share
 */
export interface CanvasShareInsert {
  canvas_id: string;
  user_id?: string; // Will be set server-side from auth
  title?: string;
  description?: string;
  expires_at?: string;
  show_prompts?: boolean;
  allow_download?: boolean;
}

/**
 * Data for updating an existing share
 */
export interface CanvasShareUpdate {
  title?: string;
  description?: string;
  expires_at?: string | null;
  show_prompts?: boolean;
  allow_download?: boolean;
}

/**
 * Owner info returned with shared canvas
 */
export interface SharedCanvasOwner {
  username: string | null;
  avatar_url: string | null;
}

/**
 * Share metadata returned with shared canvas
 */
export interface SharedCanvasShareInfo {
  id: string;
  title: string;
  description: string | null;
  show_prompts: boolean;
  allow_download: boolean;
  created_at: string;
  view_count: number;
}

/**
 * Canvas data returned for shared view (subset of full Canvas)
 */
export interface SharedCanvasData {
  name: string;
  nodes: Node<ImageNodeData>[];
  edges: Edge[];
  viewport: CanvasViewport;
}

/**
 * Complete shared canvas response from get_shared_canvas function
 */
export interface SharedCanvasResponse {
  share: SharedCanvasShareInfo;
  canvas: SharedCanvasData;
  owner: SharedCanvasOwner;
}
