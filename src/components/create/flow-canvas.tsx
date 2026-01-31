'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';
import { nodeTypes } from './nodes';
import { useCreate } from './create-context';
import type { ImageNodeData } from '@/types/canvas';
import { TooltipProvider } from '@/components/ui/tooltip';

interface FlowCanvasProps {
  className?: string;
}

export function FlowCanvas({ className }: FlowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectImageByNodeId,
  } = useCreate();

  const { fitView } = useReactFlow();

  // Handle node selection
  const handleSelectionChange = React.useCallback(
    ({ nodes: selectedNodes }: { nodes: Node<ImageNodeData>[] }) => {
      if (selectedNodes.length === 1) {
        selectImageByNodeId(selectedNodes[0].id);
      }
    },
    [selectImageByNodeId]
  );

  // Fit view when nodes change significantly
  const prevNodeCount = React.useRef(nodes.length);
  React.useEffect(() => {
    if (nodes.length > 0 && nodes.length !== prevNodeCount.current) {
      // Small delay to let the node render
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
      prevNodeCount.current = nodes.length;
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('h-full w-full', className)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="opacity-30"
          />
          <Controls
            showZoom
            showFitView
            showInteractive={false}
            className="!bg-background !border-border !shadow-md"
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
    </TooltipProvider>
  );
}
