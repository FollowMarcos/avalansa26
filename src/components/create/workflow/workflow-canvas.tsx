'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
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
import type { WorkflowNodeData, WorkflowEdgeData } from '@/types/workflow';
import type { GroupData } from '@/types/canvas';
import { SOCKET_COLORS, isSocketCompatible } from '@/types/workflow';
import { getWorkflowNodeTypes, getNodeEntry } from './node-registry';
import { GroupLayer } from '../groups/group-layer';

// Ensure all nodes are registered
import './nodes';

interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge<WorkflowEdgeData>>[]) => void;
  onConnect: (connection: Connection) => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  // Group props
  groups: (GroupData & { locked?: boolean })[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onMoveGroup: (groupId: string, delta: { x: number; y: number }) => void;
  onResizeGroup: (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  onUpdateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onToggleGroupLock?: (groupId: string) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2 },
  interactionWidth: 20,
};

/**
 * React Flow canvas for workflow mode.
 * Uses typed sockets for connection validation and colored edges.
 * Renders GroupLayer overlay for node grouping.
 */
export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  groups,
  selectedGroupId,
  onSelectGroup,
  onMoveGroup,
  onResizeGroup,
  onUpdateGroup,
  onToggleGroupCollapse,
  onToggleGroupLock,
  onDuplicateGroup,
  onDeleteGroup,
}: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  // Cast to NodeTypes — React Flow's internal type expects more props than our components declare,
  // but React Flow passes them at runtime. The cast is safe.
  const nodeTypes = React.useMemo(
    () => getWorkflowNodeTypes() as unknown as NodeTypes,
    [],
  );

  /** Handle drop from the node palette */
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/workflow-node');
      if (!raw) return;

      try {
        const { type } = JSON.parse(raw) as { type: string };
        // Convert screen coordinates to flow-space coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        onAddNode(type, position);
      } catch {
        // Invalid drag data
      }
    },
    [screenToFlowPosition, onAddNode],
  );

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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

  /** Color edges based on source socket type, highlight selected */
  const styledEdges = React.useMemo(() => {
    return edges.map((edge) => {
      const color = edge.data?.sourceSocketType
        ? SOCKET_COLORS[edge.data.sourceSocketType]
        : '#9ca3af';
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: edge.selected ? 3 : 2,
          opacity: edge.selected ? 1 : 0.8,
        },
      };
    });
  }, [edges]);

  /** Deselect group when clicking on the canvas background */
  const handlePaneClick = React.useCallback(() => {
    if (selectedGroupId) onSelectGroup(null);
  }, [selectedGroupId, onSelectGroup]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaneClick={handlePaneClick}
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
        deleteKeyCode={['Delete', 'Backspace']}
        edgesFocusable
        edgesReconnectable
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

      {/* Group overlay — rendered outside ReactFlow for absolute positioning */}
      <GroupLayer
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={onSelectGroup}
        onMoveGroup={onMoveGroup}
        onResizeGroup={onResizeGroup}
        onUpdateGroup={onUpdateGroup}
        onToggleGroupCollapse={onToggleGroupCollapse}
      />
    </div>
  );
}
