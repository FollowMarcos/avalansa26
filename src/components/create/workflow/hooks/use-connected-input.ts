'use client';

import { useMemo } from 'react';
import { useNodes, useEdges } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types/workflow';

/**
 * Reads the value flowing into a specific input socket of the given node.
 * Traverses the React Flow graph to find the upstream node's outputValues.
 *
 * Only returns a value after the upstream node has been executed
 * (i.e. its outputValues are populated).
 */
export function useConnectedInputValue(
  nodeId: string,
  inputSocketId: string,
): unknown {
  const nodes = useNodes();
  const edges = useEdges();

  return useMemo(() => {
    const targetHandle = `in-${inputSocketId}`;

    const edge = edges.find(
      (e) => e.target === nodeId && e.targetHandle === targetHandle,
    );
    if (!edge) return undefined;

    const sourceSocketId = edge.sourceHandle?.replace('out-', '');
    if (!sourceSocketId) return undefined;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return undefined;

    const data = sourceNode.data as WorkflowNodeData;
    return data.outputValues?.[sourceSocketId];
  }, [nodes, edges, nodeId, inputSocketId]);
}
