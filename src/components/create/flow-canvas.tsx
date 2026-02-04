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
    // Interaction mode
    interactionMode,
    setInteractionMode,
  } = useCreate();

  // Filter out nodes that belong to collapsed groups
  const visibleNodes = React.useMemo(() => {
    const collapsedGroupNodeIds = new Set<string>();
    groups.forEach(group => {
      if (group.isCollapsed && group.nodeIds) {
        group.nodeIds.forEach(id => collapsedGroupNodeIds.add(id));
      }
    });
    return nodes.filter(node => !collapsedGroupNodeIds.has(node.id));
  }, [nodes, groups]);

  // State for helper lines (alignment guides)
  const [helperLineHorizontal, setHelperLineHorizontal] = React.useState<number | undefined>(undefined);
  const [helperLineVertical, setHelperLineVertical] = React.useState<number | undefined>(undefined);

  // State for temporary hand tool (Space key held)
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);

  const { setCenter, getZoom, zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();

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

  // Figma-style keyboard shortcuts for tools, zoom, and navigation
  React.useEffect(() => {
    const PAN_STEP = 50; // Pixels to pan per arrow key press
    const PAN_STEP_SHIFT = 200; // Larger step when holding Shift

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // === ZOOM CONTROLS (Figma-style) ===

      // Ctrl/Cmd + Plus/Equal: Zoom in
      if (isMod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn({ duration: 200 });
        return;
      }

      // Ctrl/Cmd + Minus: Zoom out
      if (isMod && e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 200 });
        return;
      }

      // Ctrl/Cmd + 0: Zoom to 100%
      if (isMod && e.key === '0') {
        e.preventDefault();
        const viewport = getViewport();
        setViewport({ x: viewport.x, y: viewport.y, zoom: 1 }, { duration: 200 });
        return;
      }

      // Ctrl/Cmd + 1: Fit view (zoom to fit all)
      if (isMod && e.key === '1') {
        e.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
        return;
      }

      // Ctrl/Cmd + 2: Zoom to selection
      if (isMod && e.key === '2') {
        e.preventDefault();
        if (selectedNodeIds.size > 0) {
          const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
          if (selectedNodes.length > 0) {
            fitView({ nodes: selectedNodes, padding: 0.5, duration: 300 });
          }
        }
        return;
      }

      // === TOOL SHORTCUTS ===

      // Ctrl+G: Create group from selected nodes
      if (isMod && e.key === 'g') {
        e.preventDefault();
        if (selectedNodeIds.size >= 2) {
          createGroup(Array.from(selectedNodeIds));
        }
        return;
      }

      // V: Switch to select/move tool (Figma-style)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setInteractionMode('select');
        return;
      }

      // H: Switch to hand/pan tool (Figma-style)
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

      // === ARROW KEY PANNING (Figma-style) ===
      // Only pan when no nodes are selected (otherwise arrows move nodes)
      if (selectedNodeIds.size === 0 && !isMod) {
        const step = e.shiftKey ? PAN_STEP_SHIFT : PAN_STEP;
        const viewport = getViewport();
        let newX = viewport.x;
        let newY = viewport.y;

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            newY += step;
            break;
          case 'ArrowDown':
            e.preventDefault();
            newY -= step;
            break;
          case 'ArrowLeft':
            e.preventDefault();
            newX += step;
            break;
          case 'ArrowRight':
            e.preventDefault();
            newX -= step;
            break;
          default:
            return;
        }

        setViewport({ x: newX, y: newY, zoom: viewport.zoom }, { duration: 100 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release Space: Return to previous mode
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
  }, [selectedNodeIds, nodes, createGroup, setInteractionMode, zoomIn, zoomOut, fitView, setViewport, getViewport]);

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

  // Figma-style scroll behavior:
  // - Regular scroll: vertical pan
  // - Shift + Ctrl/Cmd + scroll: horizontal pan
  // - Ctrl/Cmd + scroll: zoom
  const handleWheel = React.useCallback(
    (e: React.WheelEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Shift + Ctrl/Cmd + scroll: horizontal pan
      if (e.shiftKey && isMod) {
        e.preventDefault();
        const viewport = getViewport();
        const delta = e.deltaY;
        setViewport(
          { x: viewport.x - delta, y: viewport.y, zoom: viewport.zoom },
          { duration: 0 }
        );
        return;
      }

      // Ctrl/Cmd + scroll: zoom (let ReactFlow handle this by default)
      if (isMod) {
        return; // ReactFlow handles zoom on Ctrl+scroll
      }

      // Regular scroll: vertical pan (ReactFlow default behavior)
      // No need to handle - ReactFlow does this
    },
    [getViewport, setViewport]
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
            className={cn('h-full w-full relative', className)}
            role="application"
            aria-label="Image canvas. Press V for select, H for hand tool, Space to pan. Use arrow keys to navigate."
            onWheel={handleWheel}
          >
            <ReactFlow
              nodes={visibleNodes}
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
              // Figma-style interaction: pan with hand tool or space held
              panOnDrag={interactionMode === 'hand' || isSpacePressed}
              // Selection drag only in select mode when space not held
              selectionOnDrag={interactionMode === 'select' && !isSpacePressed}
              selectionMode={SelectionMode.Partial}
              multiSelectionKeyCode="Shift"
              // Enable scroll to pan and zoom
              panOnScroll
              zoomOnScroll
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
              }}
              proOptions={{ hideAttribution: true }}
              className={cn(
                "bg-transparent",
                // Change cursor based on interaction mode - target ReactFlow's internal pane
                interactionMode === 'select' && !isSpacePressed && "[&_.react-flow__pane]:!cursor-default [&_.react-flow__node]:cursor-default",
                (interactionMode === 'hand' || isSpacePressed) && "[&_.react-flow__pane]:cursor-grab [&_.react-flow__pane]:active:cursor-grabbing"
              )}
            >
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
            {/* Group layer - rendered OUTSIDE ReactFlow to receive mouse events */}
            <GroupLayer
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={selectGroup}
              onMoveGroup={moveGroup}
              onResizeGroup={handleGroupResize}
              onUpdateGroup={updateGroup}
              onToggleGroupCollapse={toggleGroupCollapse}
            />
          </div>
        </ContextMenuTrigger>
      </CanvasContextMenu>
    </TooltipProvider>
  );
}
