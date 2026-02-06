'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  BackgroundVariant,
  SelectionMode,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData, WorkflowEdgeData } from '@/types/workflow';
import { SOCKET_COLORS, isSocketCompatible } from '@/types/workflow';
import { getWorkflowNodeTypes, getNodeEntry } from './node-registry';

// Ensure all nodes are registered
import './nodes';

interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge<WorkflowEdgeData>>[]) => void;
  onConnect: (connection: Connection) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2 },
};

/**
 * React Flow canvas for workflow mode.
 * Uses typed sockets for connection validation and colored edges.
 */
export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
}: WorkflowCanvasProps) {
  // Cast to NodeTypes — React Flow's internal type expects more props than our components declare,
  // but React Flow passes them at runtime. The cast is safe.
  const nodeTypes = React.useMemo(
    () => getWorkflowNodeTypes() as unknown as NodeTypes,
    [],
  );

  /** Validate connections based on socket type compatibility */
  const isValidConnection = React.useCallback(
    (connection: Connection | Edge) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) return false;

      // Prevent self-connections
      if (source === target) return false;

      // Look up socket types
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);
      if (!sourceNode || !targetNode) return false;

      const sourceEntry = getNodeEntry(sourceNode.data.definitionType);
      const targetEntry = getNodeEntry(targetNode.data.definitionType);
      if (!sourceEntry || !targetEntry) return false;

      const sourceSocketId = sourceHandle.replace('out-', '');
      const targetSocketId = targetHandle.replace('in-', '');

      const sourceSocket = sourceEntry.definition.outputs.find(
        (s) => s.id === sourceSocketId,
      );
      const targetSocket = targetEntry.definition.inputs.find(
        (s) => s.id === targetSocketId,
      );

      if (!sourceSocket || !targetSocket) return false;

      return isSocketCompatible(sourceSocket.type, targetSocket.type);
    },
    [nodes],
  );

  /** Color edges based on source socket type */
  const styledEdges = React.useMemo(() => {
    return edges.map((edge) => {
      const color = edge.data?.sourceSocketType
        ? SOCKET_COLORS[edge.data.sourceSocketType]
        : '#9ca3af';
      return {
        ...edge,
        style: { ...edge.style, stroke: color, strokeWidth: 2 },
      };
    });
  }, [edges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        fitView
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.15)"
        />
        <MiniMap
          position="bottom-left"
          className="!bg-background/80 !border-border !rounded-lg !shadow-sm"
          maskColor="hsl(var(--foreground) / 0.06)"
          nodeColor={(node) => {
            const entry = getNodeEntry(
              (node.data as WorkflowNodeData)?.definitionType,
            );
            if (!entry) return '#9ca3af';
            const firstOutput = entry.definition.outputs[0];
            if (firstOutput) return SOCKET_COLORS[firstOutput.type];
            const firstInput = entry.definition.inputs[0];
            if (firstInput) return SOCKET_COLORS[firstInput.type];
            return '#9ca3af';
          }}
          pannable
          zoomable
          style={{ width: 150, height: 100 }}
        />
      </ReactFlow>
    </div>
  );
}
