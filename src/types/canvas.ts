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
 * Bounds for a group's position and size
 */
export interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Data for a node group (visual container)
 */
export interface GroupData {
  id: string;
  title: string;
  color: string;
  bounds: GroupBounds;
  isCollapsed: boolean;
  createdAt: number;
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

  // State management for loading/error states
  status: 'loading' | 'success' | 'failed';
  error?: string;            // Error message if status is 'failed'
  thinkingStep?: string;     // Current thinking step if status is 'loading'
  batchJobId?: string;       // Batch job ID for relaxed mode generations
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
  groups: GroupData[];
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
  groups?: GroupData[];
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
  groups?: GroupData[];
  viewport?: CanvasViewport;
}
