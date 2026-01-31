/**
 * Canvas Types
 *
 * Types for storing user's React Flow canvas state
 */

import type { Node, Edge } from '@xyflow/react';
import type { GenerationSettings } from './generation';

/**
 * Viewport state for React Flow canvas
 */
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Data stored in an image node
 * Uses index signature to satisfy React Flow's Record<string, unknown> constraint
 */
export interface ImageNodeData extends Record<string, unknown> {
  generationId: string;
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  timestamp: number;
  settings: GenerationSettings;
}

/**
 * Canvas stored in database
 */
export interface Canvas {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string | null;
  nodes: Node<ImageNodeData>[];
  edges: Edge[];
  viewport: CanvasViewport;
  created_at: string;
  updated_at: string;
}

/**
 * Canvas data for inserting a new canvas
 */
export interface CanvasInsert {
  user_id: string;
  name?: string;
  thumbnail_url?: string | null;
  nodes?: Node<ImageNodeData>[];
  edges?: Edge[];
  viewport?: CanvasViewport;
}

/**
 * Canvas data for updating an existing canvas
 */
export interface CanvasUpdate {
  name?: string;
  thumbnail_url?: string | null;
  nodes?: Node<ImageNodeData>[];
  edges?: Edge[];
  viewport?: CanvasViewport;
}
