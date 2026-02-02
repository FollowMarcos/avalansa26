'use client';

import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ImagePlus, Download, Copy, AlertCircle, RefreshCw, RotateCw } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
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
 * Supports loading, success, and failed states
 */
export function ImageNode({ data, selected, id }: ImageNodeProps & { id: string }) {
  const { imageUrl, prompt, negativePrompt, settings, timestamp, status = 'success', thinkingStep, error, generationId } = data;
  const { addReferenceImageFromUrl, deleteNode, retryGeneration, reuseImageSetup } = useCreate();

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
    if (status === 'loading') return 'Generating...';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [timestamp, status]);

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
      a.download = `generation-${data.generationId}.png`;
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

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryGeneration(id);
  };

  const handleReuseSetup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const generatedImage: import('../create-context').GeneratedImage = {
      id: generationId,
      url: imageUrl,
      prompt,
      timestamp,
      settings: {
        ...settings,
        // Add missing CreateSettings fields with defaults
        styleStrength: 100, // Default to full strength
        negativePrompt: negativePrompt || '', // Use stored negative prompt or empty
      } as import('../create-context').CreateSettings,
    };
    await reuseImageSetup(generatedImage);
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-background shadow-md transition-all',
        'hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : status === 'failed'
          ? 'border-destructive ring-2 ring-destructive/20'
          : 'border-border hover:border-muted-foreground/50'
      )}
      style={{ width: finalWidth }}
    >
      {/* Delete button - top right corner (only for success/failed states) */}
      {status !== 'loading' && (
        <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteButton onDelete={handleDelete} />
        </div>
      )}

      {/* Main content container with dynamic aspect ratio */}
      <div
        className="relative overflow-hidden rounded-t-lg"
        style={{ width: finalWidth, height: finalHeight }}
      >
        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 dark:bg-zinc-800/50 animate-pulse">
            <Loader size="lg" className="mb-3" />
            <p className="text-sm text-muted-foreground font-medium px-4 text-center">
              {thinkingStep || 'Generating...'}
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && imageUrl && (
          <>
            <img
              src={imageUrl}
              alt={prompt}
              width={finalWidth}
              height={finalHeight}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReuseSetup}
                      aria-label="Reuse setup (image + prompt + settings)"
                      className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <RotateCw className="size-4 text-zinc-900" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Reuse setup</TooltipContent>
                </Tooltip>
              </div>

              {/* Prompt on bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white line-clamp-2">{prompt}</p>
              </div>
            </div>
          </>
        )}

        {/* FAILED STATE */}
        {status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 dark:bg-destructive/20 p-4">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <p className="text-sm text-center text-destructive font-medium mb-4 line-clamp-3">
              {error || 'Generation failed'}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleRetry}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
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
