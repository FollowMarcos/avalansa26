/**
 * Workflow Types
 *
 * Type system for ComfyUI-style node chaining workflows.
 * Defines socket types, node definitions, execution state, and persistence.
 */

import type { GroupData, CanvasViewport } from './canvas';

// ---------------------------------------------------------------------------
// Socket System
// ---------------------------------------------------------------------------

/** Data types that can flow through edges between nodes */
export type SocketType = 'text' | 'image' | 'settings' | 'number' | 'any';

/** Color mapping for socket types (ComfyUI-style visual coding) */
export const SOCKET_COLORS: Record<SocketType, string> = {
  text: '#a78bfa',     // violet-400
  image: '#3b82f6',    // blue-500
  settings: '#f97316', // orange-500
  number: '#22c55e',   // green-500
  any: '#9ca3af',      // gray-400
};

/** Defines a single input or output port on a node */
export interface SocketDefinition {
  /** Unique ID within this node (e.g., "prompt", "image_out") */
  id: string;
  /** Human-readable label */
  label: string;
  /** Data type for type-checking connections */
  type: SocketType;
  /** Whether this socket is required for execution (inputs only) */
  required?: boolean;
  /** Default value when nothing is connected (inputs only) */
  defaultValue?: unknown;
}

// ---------------------------------------------------------------------------
// Node Definitions
// ---------------------------------------------------------------------------

/** Node category for palette organization */
export type NodeCategory = 'input' | 'processing' | 'output' | 'utility';

/** Static definition of a workflow node type */
export interface WorkflowNodeDefinition {
  /** Unique type identifier (e.g., 'promptInput', 'imageGenerate') */
  type: string;
  /** Display name */
  label: string;
  /** Category for palette organization */
  category: NodeCategory;
  /** Description for tooltip */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** Input sockets */
  inputs: SocketDefinition[];
  /** Output sockets */
  outputs: SocketDefinition[];
  /** Default configuration values (stored in node.data.config) */
  defaultConfig: Record<string, unknown>;
  /** Minimum width for the node UI */
  minWidth?: number;
}

// ---------------------------------------------------------------------------
// Runtime Node Data
// ---------------------------------------------------------------------------

/** Execution status of a single node */
export type WorkflowNodeStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped';

/** Data stored in a workflow node (React Flow's node.data) */
export interface WorkflowNodeData extends Record<string, unknown> {
  /** Reference to the node definition type */
  definitionType: string;
  /** User-editable configuration per node instance */
  config: Record<string, unknown>;
  /** Execution status */
  status: WorkflowNodeStatus;
  /** Error message if status === 'error' */
  error?: string;
  /** Output values after successful execution (keyed by output socket ID) */
  outputValues?: Record<string, unknown>;
  /** Optional label override */
  label?: string;
}

/** Edge data for typed connections */
export interface WorkflowEdgeData extends Record<string, unknown> {
  /** Source socket type (for validation and visual coloring) */
  sourceSocketType: SocketType;
  /** Target socket type */
  targetSocketType: SocketType;
}

// ---------------------------------------------------------------------------
// Connection Validation
// ---------------------------------------------------------------------------

/** Check if a source socket type can connect to a target socket type */
export function isSocketCompatible(
  source: SocketType,
  target: SocketType,
): boolean {
  if (source === 'any' || target === 'any') return true;
  return source === target;
}

// ---------------------------------------------------------------------------
// Workflow Persistence
// ---------------------------------------------------------------------------

/** Serialized workflow for saving/export */
export interface WorkflowDefinition {
  /** Schema version for future migration */
  version: 1;
  /** Workflow metadata */
  name: string;
  description?: string;
  /** React Flow nodes with WorkflowNodeData */
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  /** React Flow edges */
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    data?: WorkflowEdgeData;
  }>;
  /** Groups with optional lock state */
  groups: Array<GroupData & { locked?: boolean }>;
  /** Viewport */
  viewport: CanvasViewport;
}

/** Database record for a saved workflow */
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  definition: WorkflowDefinition;
  thumbnail_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** Data for inserting a new workflow */
export interface WorkflowInsert {
  user_id: string;
  name?: string;
  description?: string | null;
  definition: WorkflowDefinition;
  thumbnail_url?: string | null;
}

/** Data for updating an existing workflow */
export interface WorkflowUpdate {
  name?: string;
  description?: string | null;
  definition?: WorkflowDefinition;
  thumbnail_url?: string | null;
  is_favorite?: boolean;
}

// ---------------------------------------------------------------------------
// Execution Types
// ---------------------------------------------------------------------------

/** Result of running a workflow */
export interface ExecutionResult {
  /** Output data from each node, keyed by node ID → socket ID → value */
  dataMap: Map<string, Record<string, unknown>>;
  completedCount: number;
  errorCount: number;
  skippedCount: number;
}
