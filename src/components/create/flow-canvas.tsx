'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Viewport,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import { nodeTypes } from './nodes';
import { useCreate } from './create-context';
import type { ImageNodeData } from '@/types/canvas';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelperLines } from './helper-lines';
import { GroupLayer } from './groups';
import { CanvasContextMenu } from './canvas-context-menu';
import { ContextMenuTrigger } from '@/components/ui/context-menu';

interface FlowCanvasProps {
  className?: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export function FlowCanvas({ className, canvasRef }: FlowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectImageByNodeId,
    snapToGrid,
    gridSize,
    onViewportChange,
    // Node groups
    groups,
    selectedGroupId,
    selectedNodeIds,
    createGroup,
    deleteGroup,
    updateGroup,
    moveGroup,
    toggleGroupCollapse,
    selectGroup,
    selectNodes,
    clearNodeSelection,
  } = useCreate();

  // State for helper lines (alignment guides)
  const [helperLineHorizontal, setHelperLineHorizontal] = React.useState<number | undefined>(undefined);
  const [helperLineVertical, setHelperLineVertical] = React.useState<number | undefined>(undefined);

  const { setCenter, getZoom } = useReactFlow();

  // Calculate helper lines when a node is being dragged
  const customOnNodesChange: typeof onNodesChange = React.useCallback(
    (changes) => {
      // Reset helper lines
      setHelperLineHorizontal(undefined);
      setHelperLineVertical(undefined);

      // Check if any node is being dragged
      const positionChange = changes.find(
        (change) => change.type === 'position' && change.dragging && change.position
      );

      if (positionChange && positionChange.type === 'position' && positionChange.position) {
        const draggingNode = nodes.find((n) => n.id === positionChange.id);
        if (!draggingNode) {
          onNodesChange(changes);
          return;
        }

        const SNAP_THRESHOLD = 5; // Pixels threshold for snapping to alignment
        const draggingX = positionChange.position.x;
        const draggingY = positionChange.position.y;

        // Check alignment with other nodes
        for (const node of nodes) {
          if (node.id === positionChange.id) continue;

          // Check vertical alignment (x positions match)
          if (Math.abs(node.position.x - draggingX) < SNAP_THRESHOLD) {
            setHelperLineVertical(node.position.x);
          }

          // Check horizontal alignment (y positions match)
          if (Math.abs(node.position.y - draggingY) < SNAP_THRESHOLD) {
            setHelperLineHorizontal(node.position.y);
          }
        }
      }

      onNodesChange(changes);
    },
    [nodes, onNodesChange]
  );

  // Clear helper lines when dragging ends
  const handleNodeDragStop = React.useCallback(() => {
    setHelperLineHorizontal(undefined);
    setHelperLineVertical(undefined);
  }, []);

  // Handle node selection (supports both single and multi-select)
  const handleSelectionChange = React.useCallback(
    ({ nodes: selectedNodes }: { nodes: Node<ImageNodeData>[] }) => {
      if (selectedNodes.length === 1) {
        selectImageByNodeId(selectedNodes[0].id);
        selectNodes([selectedNodes[0].id]);
      } else if (selectedNodes.length > 1) {
        // Multi-select: track all selected node IDs
        selectNodes(selectedNodes.map((n) => n.id));
      } else {
        // No nodes selected
        clearNodeSelection();
      }
      // Deselect any group when nodes are selected
      if (selectedNodes.length > 0) {
        selectGroup(null);
      }
    },
    [selectImageByNodeId, selectNodes, clearNodeSelection, selectGroup]
  );

  // Keyboard shortcut: Ctrl+G to create group
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (selectedNodeIds.size >= 2) {
          createGroup(Array.from(selectedNodeIds));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, createGroup]);

  // Handle viewport changes (pan/zoom) to track where user is focused
  const handleMoveEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      onViewportChange({
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      });
    },
    [onViewportChange]
  );

  // Track previous nodes to detect new additions
  const prevNodesRef = React.useRef<Node<ImageNodeData>[]>([]);

  // Focus on newly added node(s)
  React.useEffect(() => {
    const prevNodes = prevNodesRef.current;
    const prevNodeIds = new Set(prevNodes.map(n => n.id));

    // Find newly added nodes
    const newNodes = nodes.filter(n => !prevNodeIds.has(n.id));

    if (newNodes.length > 0) {
      // Small delay to let the node render
      const timer = setTimeout(() => {
        // Focus on the first new node (most recent generation)
        const targetNode = newNodes[0];
        const nodeWidth = 240; // Approximate node width
        const nodeHeight = 300; // Approximate node height

        // Center on the new node with current zoom level
        const zoom = Math.max(getZoom(), 0.8); // Ensure minimum zoom for visibility
        setCenter(
          targetNode.position.x + nodeWidth / 2,
          targetNode.position.y + nodeHeight / 2,
          { zoom, duration: 300 }
        );
      }, 150);

      prevNodesRef.current = nodes;
      return () => clearTimeout(timer);
    }

    prevNodesRef.current = nodes;
  }, [nodes, setCenter, getZoom]);

  // Handle group resize
  const handleGroupResize = React.useCallback(
    (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => {
      updateGroup(groupId, { bounds });
    },
    [updateGroup]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <CanvasContextMenu
        selectedNodeIds={selectedNodeIds}
        selectedGroupId={selectedGroupId}
        groups={groups}
        onCreateGroup={createGroup}
        onDeleteGroup={deleteGroup}
        onUpdateGroup={updateGroup}
        onClearSelection={() => {
          clearNodeSelection();
          selectGroup(null);
        }}
      >
        <ContextMenuTrigger asChild>
          <div
            ref={canvasRef}
            className={cn('h-full w-full', className)}
            role="application"
            aria-label="Image generation canvas - use mouse to pan and zoom, Shift+click to multi-select nodes"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={customOnNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={handleSelectionChange}
              onNodeDragStop={handleNodeDragStop}
              onMoveEnd={handleMoveEnd}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              snapToGrid={snapToGrid}
              snapGrid={[gridSize, gridSize]}
              selectionOnDrag
              selectionMode={SelectionMode.Partial}
              multiSelectionKeyCode="Shift"
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
              }}
              proOptions={{ hideAttribution: true }}
              className="bg-transparent"
            >
              {/* Group layer (rendered behind nodes) */}
              <GroupLayer
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={selectGroup}
                onMoveGroup={moveGroup}
                onResizeGroup={handleGroupResize}
                onUpdateGroup={updateGroup}
                onToggleGroupCollapse={toggleGroupCollapse}
                onDeleteGroup={deleteGroup}
              />
              {/* Helper lines for alignment guides */}
              <HelperLines
                horizontal={helperLineHorizontal}
                vertical={helperLineVertical}
              />
              <Background
                variant={snapToGrid ? BackgroundVariant.Lines : BackgroundVariant.Dots}
                gap={snapToGrid ? gridSize : 20}
                size={snapToGrid ? 1 : 1}
                className={cn("opacity-30", snapToGrid && "opacity-50")}
              />
              <Controls
                showZoom
                showFitView
                showInteractive={false}
                position="bottom-left"
                style={{ left: '5rem' }}
                className="!bg-background/95 !backdrop-blur-xl !border-border !shadow-lg !rounded-xl !mb-4 [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!rounded-lg [&>button:hover]:!bg-muted [&>button]:!w-9 [&>button]:!h-9 [&>button]:!cursor-pointer [&>button]:transition-colors [&>button>svg]:!fill-foreground [&>button>svg]:!max-w-4 [&>button>svg]:!max-h-4"
              />
              <MiniMap
                nodeColor={(node) => {
                  if (node.selected) return 'hsl(var(--primary))';
                  return 'hsl(var(--muted-foreground))';
                }}
                maskColor="hsl(var(--background) / 0.8)"
                className="!bg-background !border-border"
                pannable
                zoomable
              />
            </ReactFlow>
          </div>
        </ContextMenuTrigger>
      </CanvasContextMenu>
    </TooltipProvider>
  );
}
