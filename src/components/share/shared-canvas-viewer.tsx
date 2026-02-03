'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Eye, Calendar, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SharedCanvasResponse } from '@/types/share';
import type { ImageNodeData } from '@/types/canvas';

interface SharedCanvasViewerProps {
  data: SharedCanvasResponse;
}

/**
 * Read-only image node for shared canvas view
 */
function SharedImageNode({
  data,
  showPrompts,
  allowDownload,
}: {
  data: ImageNodeData;
  showPrompts: boolean;
  allowDownload: boolean;
}) {
  const { imageUrl, prompt, settings } = data;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allowDownload) {
      toast.error('Downloads are disabled for this shared canvas');
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `shared-image.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    }
  };

  // Calculate dimensions based on aspect ratio
  const parseAspectRatio = (aspectRatio: string): { w: number; h: number } => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return { w: w || 1, h: h || 1 };
  };

  const { w, h } = parseAspectRatio(settings.aspectRatio || '1:1');
  const baseWidth = 240;
  const aspectHeight = Math.round((baseWidth / w) * h);
  const clampedHeight = Math.min(400, Math.max(160, aspectHeight));
  const adjustedWidth = Math.round((clampedHeight / h) * w);
  const finalWidth = Math.min(320, Math.max(160, adjustedWidth));
  const finalHeight = Math.round((finalWidth / w) * h);

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-background shadow-md',
        'border-border'
      )}
      style={{ width: finalWidth }}
    >
      <div
        className="relative overflow-hidden rounded-t-lg"
        style={{ width: finalWidth, height: finalHeight }}
      >
        <img
          src={imageUrl}
          alt={showPrompts ? prompt : 'Generated image'}
          width={finalWidth}
          height={finalHeight}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Hover overlay with download (if allowed) */}
        {allowDownload && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDownload}
                aria-label="Download image"
                className="size-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Download className="size-5 text-zinc-900" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="space-y-1 p-3">
        {showPrompts ? (
          <p className="text-xs text-muted-foreground truncate" title={prompt}>
            {prompt.length > 50 ? prompt.slice(0, 47) + '…' : prompt}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Prompt hidden</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
          {settings.aspectRatio && <span>{settings.aspectRatio}</span>}
          {settings.imageSize && (
            <>
              <span>•</span>
              <span>{settings.imageSize}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Custom node types for shared view
 */
function createSharedNodeTypes(showPrompts: boolean, allowDownload: boolean) {
  return {
    imageNode: ({ data }: { data: ImageNodeData }) => (
      <SharedImageNode
        data={data}
        showPrompts={showPrompts}
        allowDownload={allowDownload}
      />
    ),
  };
}

export function SharedCanvasViewer({ data }: SharedCanvasViewerProps) {
  const { share, canvas, owner } = data;

  const nodeTypes = React.useMemo(
    () => createSharedNodeTypes(share.show_prompts, share.allow_download),
    [share.show_prompts, share.allow_download]
  );

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title and owner */}
            <div className="flex items-center gap-3 min-w-0">
              {owner.avatar_url && (
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={owner.avatar_url} alt={owner.username || 'User'} />
                  <AvatarFallback>
                    <User className="size-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">{share.title}</h1>
                {owner.username && (
                  <Link
                    href={`/u/${owner.username}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    @{owner.username}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-1.5" title="View count">
                <Eye className="size-4" aria-hidden="true" />
                <span className="font-mono">{share.view_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Created date">
                <Calendar className="size-4" aria-hidden="true" />
                <span>{formatDate(share.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {share.description && (
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              {share.description}
            </p>
          )}
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 relative">
        <ReactFlow
          nodes={canvas.nodes as Node<ImageNodeData>[]}
          edges={canvas.edges}
          nodeTypes={nodeTypes}
          defaultViewport={canvas.viewport}
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          className="bg-muted/30"
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
            position="bottom-left"
            className="!bg-background/95 !backdrop-blur-xl !border-border !shadow-lg !rounded-xl !mb-4 [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!rounded-lg [&>button:hover]:!bg-muted [&>button]:!w-9 [&>button]:!h-9 [&>button]:!cursor-pointer [&>button]:transition-colors [&>button>svg]:!fill-foreground [&>button>svg]:!max-w-4 [&>button>svg]:!max-h-4"
          />
          <MiniMap
            nodeColor={() => 'hsl(var(--muted-foreground))'}
            maskColor="hsl(var(--background) / 0.8)"
            className="!bg-background !border-border"
            pannable
            zoomable
          />
        </ReactFlow>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Created with{' '}
            <Link href="/" className="font-semibold hover:underline">
              AVALANSA
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
