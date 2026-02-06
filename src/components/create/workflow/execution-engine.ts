/**
 * Workflow Execution Engine
 *
 * Validates DAG structure, performs topological sorting,
 * and executes workflow nodes in dependency order.
 * Supports group locking (skip) and partial execution on error.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  WorkflowNodeData,
  WorkflowEdgeData,
  ExecutionResult,
} from '@/types/workflow';
import type { GroupData } from '@/types/canvas';
import { getNodeEntry, type ExecutionContext } from './node-registry';

// ---------------------------------------------------------------------------
// DAG Validation (Kahn's Algorithm)
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  error?: string;
  order?: string[];
}

/**
 * Validate the workflow is a DAG and return topological order.
 * Uses Kahn's algorithm (BFS-based topological sort).
 */
export function validateAndSort(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[],
): ValidationResult {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const id of nodeIds) {
    adjList.set(id, []);
    inDegree.set(id, 0);
  }

  // Build adjacency list from edges
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Queue nodes with zero in-degree
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    for (const neighbor of adjList.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (order.length !== nodeIds.size) {
    return {
      valid: false,
      error: 'Workflow contains a cycle. Remove circular connections to proceed.',
    };
  }

  return { valid: true, order };
}

// ---------------------------------------------------------------------------
// Workflow Execution
// ---------------------------------------------------------------------------

/**
 * Execute the workflow by running nodes in topological order.
 *
 * - Locked groups are skipped entirely.
 * - Errors on one node don't stop independent branches.
 * - Downstream nodes of a failed node will also fail (missing inputs).
 * - Supports cancellation via AbortSignal.
 */
export async function executeWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[],
  groups: (GroupData & { locked?: boolean })[],
  context: ExecutionContext,
): Promise<ExecutionResult> {
  // 1. Validate and get execution order
  const { valid, error, order } = validateAndSort(nodes, edges);
  if (!valid || !order) {
    throw new Error(error ?? 'Invalid workflow');
  }

  // 2. Determine locked node IDs (nodes in locked groups)
  const lockedNodeIds = new Set<string>();
  for (const group of groups) {
    if (group.locked) {
      for (const nodeId of group.nodeIds) {
        lockedNodeIds.add(nodeId);
      }
    }
  }

  // 3. Build node lookup
  const nodeMap = new Map<string, Node<WorkflowNodeData>>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 4. Build incoming edges lookup per node
  const incomingEdges = new Map<string, Edge<WorkflowEdgeData>[]>();
  for (const edge of edges) {
    const list = incomingEdges.get(edge.target) ?? [];
    list.push(edge);
    incomingEdges.set(edge.target, list);
  }

  // 5. Execute in order
  const dataMap = new Map<string, Record<string, unknown>>();
  const failedNodes = new Set<string>();
  let completedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const nodeId of order) {
    if (context.signal.aborted) break;

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // Skip locked nodes
    if (lockedNodeIds.has(nodeId)) {
      context.onStatusUpdate(nodeId, 'skipped', 'Group is locked');
      skippedCount++;
      continue;
    }

    // Check if any upstream node failed — if so, this node can't run
    const nodeIncoming = incomingEdges.get(nodeId) ?? [];
    const hasFailedUpstream = nodeIncoming.some((e) => failedNodes.has(e.source));
    if (hasFailedUpstream) {
      context.onStatusUpdate(nodeId, 'error', 'Upstream node failed');
      failedNodes.add(nodeId);
      errorCount++;
      continue;
    }

    // Get node definition and executor
    const entry = getNodeEntry(node.data.definitionType);
    if (!entry) {
      context.onStatusUpdate(nodeId, 'error', `Unknown node type: ${node.data.definitionType}`);
      failedNodes.add(nodeId);
      errorCount++;
      continue;
    }

    // Gather inputs from connected edges
    const nodeInputs: Record<string, unknown> = {};
    for (const edge of nodeIncoming) {
      const sourceOutputs = dataMap.get(edge.source);
      if (sourceOutputs) {
        const sourceSocketId = edge.sourceHandle?.replace('out-', '');
        const targetSocketId = edge.targetHandle?.replace('in-', '');
        if (sourceSocketId && targetSocketId) {
          nodeInputs[targetSocketId] = sourceOutputs[sourceSocketId];
        }
      }
    }

    // Check required inputs
    let missingRequired = false;
    for (const input of entry.definition.inputs) {
      if (input.required && nodeInputs[input.id] === undefined) {
        if (input.defaultValue !== undefined) {
          nodeInputs[input.id] = input.defaultValue;
        } else {
          context.onStatusUpdate(nodeId, 'error', `Missing required input: ${input.label}`);
          failedNodes.add(nodeId);
          errorCount++;
          missingRequired = true;
          break;
        }
      }
    }
    if (missingRequired) continue;

    // Execute the node
    context.onStatusUpdate(nodeId, 'running');
    try {
      const outputs = await entry.executor(nodeInputs, node.data.config, context);
      dataMap.set(nodeId, outputs);
      context.onStatusUpdate(nodeId, 'success');
      completedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      context.onStatusUpdate(nodeId, 'error', message);
      failedNodes.add(nodeId);
      errorCount++;
    }
  }

  return { dataMap, completedCount, errorCount, skippedCount };
}
