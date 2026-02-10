'use client';

import * as React from 'react';
import { Handle, Position, NodeResizer, useEdges } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { AlertCircle, X, Unplug } from 'lucide-react';
import type {
  WorkflowNodeData,
  WorkflowNodeStatus,
  SocketDefinition,
  SOCKET_COLORS,
} from '@/types/workflow';
import { SOCKET_COLORS as socketColors } from '@/types/workflow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BaseWorkflowNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
  /** Node definition label */
  label: string;
  /** Lucide icon component */
  icon: React.ReactNode;
  /** Input socket definitions */
  inputs: SocketDefinition[];
  /** Output socket definitions */
  outputs: SocketDefinition[];
  /** Node body content */
  children: React.ReactNode;
  /** Minimum width override */
  minWidth?: number;
  /** Maximum width override */
  maxWidth?: number;
  /** Allow user to resize the node */
  resizable?: boolean;
  /** Minimum height when resizable */
  minHeight?: number;
}

const STATUS_BORDER: Record<WorkflowNodeStatus, string> = {
  idle: 'border-border',
  queued: 'border-yellow-500 animate-pulse',
  running: 'border-blue-500',
  success: 'border-green-500',
  error: 'border-destructive',
  skipped: 'border-border opacity-50',
};

const STATUS_DOT: Record<WorkflowNodeStatus, string> = {
  idle: 'bg-muted-foreground/40',
  queued: 'bg-yellow-500 animate-pulse',
  running: 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-destructive',
  skipped: 'bg-muted-foreground/30',
};

// ---------------------------------------------------------------------------
// Disconnect helpers
// ---------------------------------------------------------------------------

function disconnectHandle(nodeId: string, handleId: string): void {
  window.dispatchEvent(
    new CustomEvent('workflow-disconnect-handle', {
      detail: { nodeId, handleId },
    }),
  );
}

function disconnectAll(nodeId: string): void {
  window.dispatchEvent(
    new CustomEvent('workflow-disconnect-all', {
      detail: { nodeId },
    }),
  );
}

/**
 * Base shell for all workflow nodes. Renders header, typed handles,
 * children (node body), and error footer.
 */
export function BaseWorkflowNode({
  id,
  data,
  selected,
  label,
  icon,
  inputs,
  outputs,
  children,
  minWidth = 220,
  maxWidth = 300,
  resizable = false,
  minHeight = 120,
}: BaseWorkflowNodeProps) {
  const status = data.status ?? 'idle';
  const displayLabel = data.label ?? label;

  // Track which handles are connected
  const allEdges = useEdges();
  const connectedHandles = React.useMemo(() => {
    const ins = new Set<string>();
    const outs = new Set<string>();
    for (const edge of allEdges) {
      if (edge.target === id && edge.targetHandle) ins.add(edge.targetHandle);
      if (edge.source === id && edge.sourceHandle) outs.add(edge.sourceHandle);
    }
    return { inputs: ins, outputs: outs };
  }, [allEdges, id]);

  const hasAnyConnection = connectedHandles.inputs.size > 0 || connectedHandles.outputs.size > 0;

  return (
    <TooltipProvider delayDuration={300}>
    <div
      className={cn(
        'group/node relative rounded-xl border-2 bg-background shadow-md transition-colors transition-shadow',
        STATUS_BORDER[status],
        selected && status === 'idle' && 'border-primary ring-2 ring-primary/20',
        resizable && 'h-full flex flex-col',
      )}
      style={{ minWidth, maxWidth: resizable ? undefined : maxWidth }}
    >
      {resizable && (
        <NodeResizer
          isVisible={selected}
          minWidth={minWidth}
          minHeight={minHeight}
          lineClassName="!border-primary/30"
          handleClassName="!size-2.5 !rounded-sm !border-primary !bg-background"
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30 rounded-t-[10px]">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium truncate flex-1">{displayLabel}</span>
        {hasAnyConnection && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  disconnectAll(id);
                }}
                className="opacity-0 group-hover/node:opacity-100 transition-opacity size-5 rounded flex items-center justify-center hover:bg-destructive/20 text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 nodrag"
                aria-label="Clear all connections"
              >
                <Unplug className="size-3" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Clear All Connections</TooltipContent>
          </Tooltip>
        )}
        <div
          role="status"
          className={cn('size-2.5 rounded-full flex-shrink-0', STATUS_DOT[status])}
          aria-label={`Status: ${status}`}
        />
      </div>

      {/* Input handles */}
      {inputs.map((socket, index) => {
        const topOffset = 52 + index * 28;
        const handleId = `in-${socket.id}`;
        const isConnected = connectedHandles.inputs.has(handleId);
        return (
          <Tooltip key={handleId}>
            <TooltipTrigger asChild>
              <div
                className="absolute flex items-center gap-1 group/handle"
                style={{ left: 8, top: topOffset }}
              >
                <span
                  className="text-[10px] text-muted-foreground"
                  style={{ color: socketColors[socket.type] }}
                >
                  {socket.label}
                  {socket.required && <span className="text-destructive ml-0.5">*</span>}
                </span>
                {isConnected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectHandle(id, handleId);
                    }}
                    className="opacity-0 group-hover/handle:opacity-100 transition-opacity size-3.5 rounded-sm flex items-center justify-center hover:bg-destructive/20 text-muted-foreground hover:text-destructive focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100 nodrag"
                    aria-label={`Disconnect ${socket.label}`}
                  >
                    <X className="size-2.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              {socket.label} ({socket.type})
            </TooltipContent>
            <Handle
              type="target"
              position={Position.Left}
              id={handleId}
              className="!w-3 !h-3 !rounded-full !border-2 !border-background transition-colors"
              style={{
                backgroundColor: socketColors[socket.type],
                top: topOffset + 4,
                left: -6,
              }}
            />
          </Tooltip>
        );
      })}

      {/* Output handles */}
      {outputs.map((socket, index) => {
        const topOffset = 52 + index * 28;
        const handleId = `out-${socket.id}`;
        const isConnected = connectedHandles.outputs.has(handleId);
        return (
          <Tooltip key={handleId}>
            <TooltipTrigger asChild>
              <div
                className="absolute flex items-center gap-1 group/handle"
                style={{ right: 8, top: topOffset }}
              >
                {isConnected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectHandle(id, handleId);
                    }}
                    className="opacity-0 group-hover/handle:opacity-100 transition-opacity size-3.5 rounded-sm flex items-center justify-center hover:bg-destructive/20 text-muted-foreground hover:text-destructive focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100 nodrag"
                    aria-label={`Disconnect ${socket.label}`}
                  >
                    <X className="size-2.5" aria-hidden="true" />
                  </button>
                )}
                <span
                  className="text-[10px] text-muted-foreground"
                  style={{ color: socketColors[socket.type] }}
                >
                  {socket.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {socket.label} ({socket.type})
            </TooltipContent>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              className="!w-3 !h-3 !rounded-full !border-2 !border-background transition-colors"
              style={{
                backgroundColor: socketColors[socket.type],
                top: topOffset + 4,
                right: -6,
              }}
            />
          </Tooltip>
        );
      })}

      {/* Body */}
      <div
        className={cn('px-3 py-2 overflow-hidden', resizable && 'flex-1 flex flex-col min-h-0')}
        style={{
          marginTop: Math.max(inputs.length, outputs.length) * 28,
        }}
      >
        {children}
      </div>

      {/* Error footer */}
      {status === 'error' && data.error && (
        <div className="flex items-start gap-1.5 px-3 py-2 border-t border-destructive/30 bg-destructive/5 rounded-b-[10px]">
          <AlertCircle className="size-3.5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-destructive line-clamp-2">{data.error}</p>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
