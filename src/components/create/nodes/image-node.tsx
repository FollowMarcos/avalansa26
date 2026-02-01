'use client';

import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ImagePlus, Download, Copy } from 'lucide-react';
import { DeleteButton } from './delete-button';
import type { ImageNodeData } from '@/types/canvas';
import { useCreate } from '../create-context';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImageNodeProps {
  data: ImageNodeData;
  selected?: boolean;
}

/**
 * Parse aspect ratio string to get width/height multipliers
 */
function parseAspectRatio(aspectRatio: string): { w: number; h: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  return { w: w || 1, h: h || 1 };
}

/**
 * Custom React Flow node for displaying generated images
 */
export function ImageNode({ data, selected, id }: ImageNodeProps & { id: string }) {
  const { imageUrl, prompt, settings, timestamp, generationId } = data;
  const { addReferenceImageFromUrl, deleteNode } = useCreate();

  // Calculate dimensions based on aspect ratio
  const { w, h } = parseAspectRatio(settings.aspectRatio || '1:1');
  const baseWidth = 240; // Base width in pixels
  const aspectHeight = Math.round((baseWidth / w) * h);

  // Clamp height to reasonable bounds (min 160, max 400)
  const clampedHeight = Math.min(400, Math.max(160, aspectHeight));
  const adjustedWidth = Math.round((clampedHeight / h) * w);
  const finalWidth = Math.min(320, Math.max(160, adjustedWidth));
  const finalHeight = Math.round((finalWidth / w) * h);

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
    return prompt.slice(0, 47) + '…';
  }, [prompt]);

  const handleUseAsReference = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addReferenceImageFromUrl(imageUrl);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `generation-${generationId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDelete = () => {
    deleteNode(id);
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-background shadow-md transition-all',
        'hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/50'
      )}
      style={{ width: finalWidth }}
    >
      {/* Image container with dynamic aspect ratio */}
      <div
        className="relative overflow-hidden rounded-t-lg"
        style={{ width: finalWidth, height: finalHeight }}
      >
        <img
          src={imageUrl}
          alt={prompt}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
          {/* Action buttons */}
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleUseAsReference}
                  aria-label="Use as reference image"
                  className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ImagePlus className="size-4 text-zinc-900" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Use as reference</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownload}
                  aria-label="Download image"
                  className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Download className="size-4 text-zinc-900" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyPrompt}
                  aria-label="Copy prompt"
                  className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Copy className="size-4 text-zinc-900" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy prompt</TooltipContent>
            </Tooltip>
            <DeleteButton onDelete={handleDelete} />
          </div>

          {/* Prompt on bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white line-clamp-2">{prompt}</p>
          </div>
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
