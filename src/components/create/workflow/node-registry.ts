/**
 * Node Registry
 *
 * Central registry mapping node type strings to their definition,
 * React component, and executor function. New node types register
 * here to be available in the workflow canvas and execution engine.
 */

import type { WorkflowNodeDefinition, WorkflowNodeData, WorkflowNodeStatus } from '@/types/workflow';

/** Context provided to node executors during workflow execution */
export interface ExecutionContext {
  /** Currently selected API configuration ID */
  apiId: string;
  /** AbortSignal for cancellation support */
  signal: AbortSignal;
  /** Callback to update a node's status during execution */
  onStatusUpdate: (
    nodeId: string,
    status: WorkflowNodeStatus,
    message?: string,
  ) => void;
}

/** Executor function signature — receives inputs, returns outputs */
export type NodeExecutor = (
  inputs: Record<string, unknown>,
  config: Record<string, unknown>,
  context: ExecutionContext,
) => Promise<Record<string, unknown>>;

/** A registered node type entry */
export interface NodeRegistryEntry {
  definition: WorkflowNodeDefinition;
  /** React component for rendering this node */
  component: React.ComponentType<{
    data: WorkflowNodeData;
    id: string;
    selected?: boolean;
  }>;
  /** Function that executes this node's logic */
  executor: NodeExecutor;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, NodeRegistryEntry>();

/** Register a node type */
export function registerNode(entry: NodeRegistryEntry): void {
  registry.set(entry.definition.type, entry);
}

/** Get a registered node entry by type */
export function getNodeEntry(type: string): NodeRegistryEntry | undefined {
  return registry.get(type);
}

/** Get all registered node definitions (for the palette) */
export function getAllDefinitions(): WorkflowNodeDefinition[] {
  return Array.from(registry.values()).map((e) => e.definition);
}

/** Build React Flow nodeTypes object from the registry */
export function getWorkflowNodeTypes(): Record<
  string,
  React.ComponentType<{ data: WorkflowNodeData; id: string; selected?: boolean }>
> {
  const types: Record<
    string,
    React.ComponentType<{ data: WorkflowNodeData; id: string; selected?: boolean }>
  > = {};
  for (const [key, entry] of registry) {
    types[key] = entry.component;
  }
  return types;
}
