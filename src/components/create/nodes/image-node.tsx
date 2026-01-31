'use client';

import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { ImageNodeData } from '@/types/canvas';

interface ImageNodeProps {
  data: ImageNodeData;
  selected?: boolean;
}

/**
 * Custom React Flow node for displaying generated images
 */
export function ImageNode({ data, selected }: ImageNodeProps) {
  const { imageUrl, prompt, settings, timestamp } = data;

  // Format relative time
  const timeAgo = React.useMemo(() => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [timestamp]);

  // Truncate prompt for display
  const truncatedPrompt = React.useMemo(() => {
    if (prompt.length <= 50) return prompt;
    return prompt.slice(0, 47) + '...';
  }, [prompt]);

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-background shadow-md transition-all',
        'hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/50'
      )}
    >
      {/* Image container */}
      <div className="relative w-64 overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt={prompt}
          className="h-64 w-64 object-cover"
          draggable={false}
        />

        {/* Hover overlay with full prompt */}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <p className="p-3 text-xs text-white line-clamp-3">{prompt}</p>
        </div>
      </div>

      {/* Info section */}
      <div className="space-y-1 p-3">
        <p className="text-xs text-muted-foreground truncate" title={prompt}>
          {truncatedPrompt}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
          {settings.aspectRatio && <span>{settings.aspectRatio}</span>}
          {settings.imageSize && (
            <>
              <span>•</span>
              <span>{settings.imageSize}</span>
            </>
          )}
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Output handle for future connections */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          'h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/50',
          'transition-colors hover:bg-primary',
          '!right-[-6px]'
        )}
      />

      {/* Input handle for future connections */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          'h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/50',
          'transition-colors hover:bg-primary',
          '!left-[-6px]'
        )}
      />
    </div>
  );
}

export const nodeTypes = {
  imageNode: ImageNode,
} as const;
