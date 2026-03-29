"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Heart,
  Check,
  Download,
  Copy,
  ClipboardCopy,
  TextCursorInput,
  ImagePlus,
  RotateCw,
  Link2,
  Grid2x2,
  Trash2,
  Eye,
  GitCompareArrows,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GeneratedImage } from "./create-context";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GalleryItemProps {
  image: GeneratedImage;
  isSelected: boolean;
  isBulkMode: boolean;
  isCurrentSelected: boolean;
  isFocused: boolean;
  onImageClick: (image: GeneratedImage, e: React.MouseEvent) => void;
  onDownload: (url: string, id: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onCopyUrl: (url: string) => void;
  onUseAsReference: (url: string) => void;
  onReuseSetup: (image: GeneratedImage) => void;
  onSplitDownload: (url: string, id: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onPasteToComposer: (prompt: string) => void;
  onCompare: (image: GeneratedImage) => void;
  onViewDetails: (image: GeneratedImage) => void;
  formatTime: (timestamp: number) => string;
  itemRef?: React.Ref<HTMLElement>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GalleryItem = React.memo(function GalleryItem({
  image,
  isSelected,
  isBulkMode,
  isCurrentSelected,
  isFocused,
  onImageClick,
  onDownload,
  onCopyPrompt,
  onCopyUrl,
  onUseAsReference,
  onReuseSetup,
  onSplitDownload,
  onToggleSelection,
  onToggleFavorite,
  onDelete,
  onPasteToComposer,
  onCompare,
  onViewDetails,
  formatTime,
  itemRef,
}: GalleryItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <article
              ref={itemRef as React.Ref<HTMLDivElement>}
              tabIndex={0}
              draggable={!isBulkMode}
              data-image-id={image.id}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", image.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "relative group rounded-none overflow-hidden bg-[var(--void)] border border-[var(--steel-faint)] outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)]",
                isFocused && "ring-2 ring-[var(--nerv-orange)]",
                isCurrentSelected && !isBulkMode && "ring-2 ring-[var(--nerv-orange)]",
                isSelected && isBulkMode && "ring-2 ring-[var(--nerv-orange)] border-[var(--nerv-orange)]",
                "hover:border-[var(--nerv-orange-dim)]",
              )}
              style={{ contentVisibility: "auto" }}
              onClick={(e) => onImageClick(image, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (isBulkMode) onToggleSelection(image.id);
                  else onViewDetails(image);
                }
                if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault();
                  onDelete(image.id);
                }
                if (e.key === " " && isBulkMode) {
                  e.preventDefault();
                  onToggleSelection(image.id);
                }
              }}
              role="button"
              aria-label={`${isBulkMode ? "Select" : "View"} image: ${image.prompt || "Generated image"}`}
            >
              {/* Image or Video */}
              <div className="relative w-full">
                {image.mediaType === 'video' ? (
                  <video
                    src={image.url}
                    className="w-full h-auto object-cover"
                    loop
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    aria-label={image.prompt || "Generated video"}
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.prompt || "Generated"}
                    width={512}
                    height={512}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    quality={75}
                  />
                )}
              </div>

              {/* Crosshair corner marks */}
              <div className="absolute top-0 left-0 w-3 h-px bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute top-0 left-0 w-px h-3 bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-px bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute top-0 right-0 w-px h-3 bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-px bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-px h-3 bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-px bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-px h-3 bg-[var(--nerv-orange-dim)]/60 pointer-events-none" />

              {/* Copy prompt & paste to composer buttons (top-left) */}
              {!isBulkMode && image.prompt && (
                <div
                  className={cn(
                    "absolute top-1 left-1 z-10 flex items-center gap-0.5",
                    "bg-[var(--void)]/80 backdrop-blur-sm px-0.5 py-0.5",
                    "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                    "transition-opacity duration-150",
                  )}
                >
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Copy prompt"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyPrompt(image.prompt);
                    }}
                  >
                    <ClipboardCopy className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Use prompt in composer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPasteToComposer(image.prompt);
                    }}
                  >
                    <TextCursorInput className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Favorite button */}
              {!isBulkMode && (
                <button
                  type="button"
                  className={cn(
                    "absolute top-1 right-1 z-10 size-9 flex items-center justify-center",
                    "bg-[var(--void)]/80 hover:bg-[var(--void)] transition-[color,background-color,opacity] duration-150",
                    "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] focus-visible:opacity-100",
                    image.isFavorite
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                  )}
                  aria-label={
                    image.isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(image.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(image.id);
                    }
                  }}
                >
                  <Heart
                    className={cn(
                      "size-4 transition-colors",
                      image.isFavorite
                        ? "fill-[var(--alert-red)] text-[var(--alert-red)]"
                        : "text-[var(--steel-dim)] hover:text-[var(--alert-red)]",
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* Selection checkbox (bulk mode) */}
              {isBulkMode && (
                <div
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Select image: ${image.prompt || "Generated image"}`}
                  tabIndex={-1}
                  className={cn(
                    "absolute top-2 left-2 z-10 cursor-pointer",
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    "transition-opacity duration-150",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(image.id);
                  }}
                >
                  <div
                    className={cn(
                      "size-6 border-2 flex items-center justify-center",
                      isSelected
                        ? "bg-[var(--nerv-orange)] border-[var(--nerv-orange)] text-[var(--void)]"
                        : "bg-[var(--void)]/80 border-[var(--steel-dim)] hover:border-[var(--nerv-orange)]",
                    )}
                  >
                    {isSelected && (
                      <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                    )}
                  </div>
                </div>
              )}

              {/* Hover action buttons */}
              {!isBulkMode && (
                <div
                  className={cn(
                    "absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5",
                    "bg-[var(--void)]/90 backdrop-blur-sm border border-[var(--nerv-orange-dim)]/40 px-1 py-0.5",
                    "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                    "transition-opacity duration-150",
                  )}
                >
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(image.url, image.id);
                    }}
                  >
                    <Download className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Split & download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSplitDownload(image.url, image.id);
                    }}
                  >
                    <Grid2x2 className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Use as reference"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseAsReference(image.url);
                    }}
                  >
                    <ImagePlus className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center hover:bg-[var(--nerv-orange)]/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
                    aria-label="Reuse setup"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReuseSetup(image);
                    }}
                  >
                    <RotateCw className="size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Info badge */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1 flex-wrap">
                  {image.mediaType === 'video' && (
                    <span className="px-1.5 py-0.5 bg-[var(--alert-red)]/80 text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums text-white font-medium">
                      {image.videoDuration ? `${image.videoDuration}s` : 'VID'}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 bg-[var(--void)]/80 text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums text-[var(--data-green)]">
                    {image.settings.imageSize}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--void)]/80 text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums text-[var(--steel-dim)]">
                    {image.settings.aspectRatio}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--void)]/80 text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums text-[var(--steel-dim)] truncate max-w-[80px]" title={image.settings.model}>
                    {image.settings.model}
                  </span>
                </div>
                <span
                  className="px-1.5 py-0.5 bg-[var(--void)]/80 text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums text-[var(--steel-dim)]"
                  suppressHydrationWarning
                >
                  {formatTime(image.timestamp)}
                </span>
              </div>
            </article>
          </TooltipTrigger>
          {/* Prompt preview tooltip */}
          {image.prompt && !isBulkMode && (
            <TooltipContent
              side="bottom"
              className="max-w-[280px] font-[family-name:var(--font-ibm-plex-mono)] text-xs rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 text-[var(--steel)]"
            >
              <p className="line-clamp-3">{image.prompt}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-56 rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
        <ContextMenuItem onClick={() => onViewDetails(image)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <Eye className="size-4" aria-hidden="true" />
          View Details
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--steel-faint)]" />
        <ContextMenuItem onClick={() => onDownload(image.url, image.id)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <Download className="size-4" aria-hidden="true" />
          Download
          <ContextMenuShortcut className="text-[var(--steel-dim)]">Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onSplitDownload(image.url, image.id)}
          className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]"
        >
          <Grid2x2 className="size-4" aria-hidden="true" />
          Split & Download (4 Slices)
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--steel-faint)]" />
        {image.prompt && (
          <ContextMenuItem onClick={() => onCopyPrompt(image.prompt)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
            <Copy className="size-4" aria-hidden="true" />
            Copy Prompt
            <ContextMenuShortcut className="text-[var(--steel-dim)]">Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onCopyUrl(image.url)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <Link2 className="size-4" aria-hidden="true" />
          Copy Image URL
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--steel-faint)]" />
        <ContextMenuItem onClick={() => onUseAsReference(image.url)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <ImagePlus className="size-4" aria-hidden="true" />
          Use as Reference
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onReuseSetup(image)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <RotateCw className="size-4" aria-hidden="true" />
          Reuse Setup
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--steel-faint)]" />
        <ContextMenuItem onClick={() => onToggleFavorite(image.id)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <Heart
            className={cn(
              "size-4",
              image.isFavorite && "fill-[var(--alert-red)] text-[var(--alert-red)]",
            )}
            aria-hidden="true"
          />
          {image.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCompare(image)} className="rounded-none text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)]">
          <GitCompareArrows className="size-4" aria-hidden="true" />
          Compare With…
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[var(--steel-faint)]" />
        <ContextMenuItem
          onClick={() => onDelete(image.id)}
          className="rounded-none text-[var(--alert-red)] focus:text-[var(--alert-red)] focus:bg-[var(--alert-red)]/15"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
          <ContextMenuShortcut className="text-[var(--steel-dim)]">Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

// ---------------------------------------------------------------------------
// Skeleton card for pending images
// ---------------------------------------------------------------------------

export function PendingCard({ image }: { image: GeneratedImage }) {
  const aspectClass = getAspectClass(image.settings.aspectRatio);

  return (
    <div
      className="relative rounded-none overflow-hidden bg-[var(--void)] border border-[var(--nerv-orange-dim)]/40"
      role="status"
      aria-label="Generating image"
    >
      <div className={cn("relative", aspectClass)}>
        {/* Color-cycling gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full blur-3xl animate-[breathe-1_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-20%] right-[-25%] w-[75%] h-[75%] rounded-full blur-3xl animate-[breathe-2_7s_ease-in-out_infinite]" />
          <div className="absolute top-[10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl animate-[breathe-3_8s_ease-in-out_infinite]" />
        </div>

        {/* Wave ripples emanating from center */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-[60%] h-[60%] rounded-full border border-white/[0.08] animate-[ripple_3.5s_ease-out_infinite]"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
        </div>

        {/* Frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-black/10 dark:bg-black/20" />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-end p-4 h-full">
          <p className="text-xs text-white/40 font-mono text-center line-clamp-2 animate-pulse">
            {image.prompt || "Generating\u2026"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failed card
// ---------------------------------------------------------------------------

export function FailedCard({
  image,
  onRetry,
  onDelete,
}: {
  image: GeneratedImage;
  onRetry?: (image: GeneratedImage) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div
      className="relative rounded-none overflow-hidden bg-[var(--void)] border border-[var(--alert-red-dim)]/40"
      role="alert"
      aria-label="Generation failed"
    >
      <div className="aspect-square flex flex-col items-center justify-center gap-2 p-4">
        <div className="size-8 border border-[var(--alert-red-dim)]/40 bg-[var(--alert-red)]/10 flex items-center justify-center">
          <span className="text-[var(--alert-red)] text-sm font-[family-name:var(--font-ibm-plex-mono)]" aria-hidden="true">
            !
          </span>
        </div>
        <p className="text-xs text-[var(--alert-red)] font-[family-name:var(--font-ibm-plex-mono)] text-center uppercase tracking-[0.05em]">
          {image.error || "Generation failed"}
        </p>
        <p className="text-[10px] text-[var(--steel-dim)] text-center line-clamp-2 font-[family-name:var(--font-ibm-plex-mono)]">
          {image.prompt}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {onRetry && (
            <button
              type="button"
              className="px-2.5 py-1 bg-[var(--nerv-orange)] text-[var(--void)] text-[10px] font-medium uppercase tracking-[0.05em] hover:bg-[var(--nerv-orange-hot)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)]"
              onClick={() => onRetry(image)}
            >
              Try again
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="px-2.5 py-1 bg-[var(--void-panel)] text-[var(--steel-dim)] text-[10px] font-medium uppercase tracking-[0.05em] border border-[var(--steel-faint)] hover:bg-[var(--steel-faint)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)]"
              onClick={() => onDelete(image.id)}
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAspectClass(ratio: string): string {
  switch (ratio) {
    case "1:1":
      return "aspect-square";
    case "16:9":
    case "21:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16]";
    case "2:3":
      return "aspect-[2/3]";
    case "3:2":
      return "aspect-[3/2]";
    case "3:4":
      return "aspect-[3/4]";
    case "4:3":
      return "aspect-[4/3]";
    case "4:5":
      return "aspect-[4/5]";
    case "5:4":
      return "aspect-[5/4]";
    default:
      return "aspect-square";
  }
}
