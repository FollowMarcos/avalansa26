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
import { useCreate } from '../create-context';
import { cn } from '@/lib/utils';
import { CanvasContextMenu } from '../canvas-context-menu';
import { ContextMenuTrigger } from '@/components/ui/context-menu';

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
 * Supports Figma-style interaction modes (select/hand) and right-click context menu.
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
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
  const { interactionMode, setInteractionMode } = useCreate();

  // State for temporary hand tool (Space key held)
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);

  // Track selected node IDs for context menu
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<Set<string>>(new Set());

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

  /** Track node selection for context menu */
  const handleSelectionChange = React.useCallback(
    ({ nodes: selected }: { nodes: Node<WorkflowNodeData>[] }) => {
      setSelectedNodeIds(new Set(selected.map((n) => n.id)));
      if (selected.length > 0) {
        onSelectGroup(null);
      }
    },
    [onSelectGroup],
  );

  // Figma-style keyboard shortcuts for tools and zoom
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Zoom controls
      if (isMod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn({ duration: 200 });
        return;
      }
      if (isMod && e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 200 });
        return;
      }
      if (isMod && e.key === '0') {
        e.preventDefault();
        const viewport = getViewport();
        setViewport({ x: viewport.x, y: viewport.y, zoom: 1 }, { duration: 200 });
        return;
      }
      if (isMod && e.key === '1') {
        e.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
        return;
      }

      // V: Select tool
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setInteractionMode('select');
        return;
      }

      // H: Hand/pan tool
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setInteractionMode('hand');
        return;
      }

      // Space: Temporary hand tool (hold to pan)
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setInteractionMode, zoomIn, zoomOut, fitView, setViewport, getViewport]);

  return (
    <CanvasContextMenu
      selectedNodeIds={selectedNodeIds}
      selectedGroupId={selectedGroupId}
      groups={groups}
      onCreateGroup={() => {}}
      onDeleteGroup={onDeleteGroup ?? (() => {})}
      onUpdateGroup={onUpdateGroup}
      onClearSelection={() => {
        setSelectedNodeIds(new Set());
        onSelectGroup(null);
      }}
    >
      <ContextMenuTrigger asChild>
        <div
          className="h-full w-full relative"
          role="application"
          aria-label="Workflow canvas. Press V for select, H for hand tool, Space to pan."
        >
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaneClick={handlePaneClick}
            onSelectionChange={handleSelectionChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            isValidConnection={isValidConnection}
            fitView
            minZoom={0.1}
            maxZoom={2}
            snapToGrid
            snapGrid={[20, 20]}
            // Figma-style interaction: pan with hand tool or space held
            panOnDrag={interactionMode === 'hand' || isSpacePressed}
            // Selection drag only in select mode when space not held
            selectionOnDrag={interactionMode === 'select' && !isSpacePressed}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Shift"
            deleteKeyCode={['Delete', 'Backspace']}
            edgesFocusable
            edgesReconnectable
            panOnScroll
            zoomOnScroll
            className={cn(
              "bg-transparent",
              interactionMode === 'select' && !isSpacePressed && "[&_.react-flow__pane]:!cursor-default [&_.react-flow__node]:!cursor-default",
              (interactionMode === 'hand' || isSpacePressed) && "[&_.react-flow__pane]:!cursor-grab [&_.react-flow__pane]:active:!cursor-grabbing [&_.react-flow__node]:!cursor-grab [&_.react-flow__node.dragging]:!cursor-grabbing"
            )}
            proOptions={{ hideAttribution: true }}
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
      </ContextMenuTrigger>
    </CanvasContextMenu>
  );
}
