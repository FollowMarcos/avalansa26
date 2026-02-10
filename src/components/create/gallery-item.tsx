"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Heart,
  Check,
  Download,
  Copy,
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
import { Loader } from "@/components/ui/loader";
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
              className={cn(
                "relative group rounded-lg overflow-hidden bg-muted border outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                isFocused && "ring-2 ring-ring",
                isCurrentSelected && !isBulkMode && "ring-2 ring-foreground",
                isSelected && isBulkMode && "ring-2 ring-primary border-primary",
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
              {/* Image */}
              <div className="relative w-full">
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
              </div>

              {/* Favorite button */}
              {!isBulkMode && (
                <button
                  type="button"
                  className={cn(
                    "absolute top-1 right-1 z-10 size-9 rounded-full flex items-center justify-center",
                    "bg-background/80 hover:bg-background transition-colors transition-opacity duration-150",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100",
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
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground hover:text-red-500",
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
                      "size-6 rounded-md border-2 flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background/80 border-border hover:border-primary",
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
                    "rounded-lg bg-background/90 backdrop-blur-sm border border-border shadow-sm px-1 py-0.5",
                    "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                    "transition-opacity duration-150",
                  )}
                >
                  <button
                    type="button"
                    className="size-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(image.url, image.id);
                    }}
                  >
                    <Download className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Split & download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSplitDownload(image.url, image.id);
                    }}
                  >
                    <Grid2x2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="size-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Reuse setup"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReuseSetup(image);
                    }}
                  >
                    <RotateCw className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Info badge */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono tabular-nums">
                  {image.settings.imageSize}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono tabular-nums text-muted-foreground">
                  {formatTime(image.timestamp)}
                </span>
              </div>
            </article>
          </TooltipTrigger>
          {/* Prompt preview tooltip */}
          {image.prompt && !isBulkMode && (
            <TooltipContent
              side="bottom"
              className="max-w-[280px] font-mono text-xs"
            >
              <p className="line-clamp-3">{image.prompt}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onViewDetails(image)}>
          <Eye className="size-4" aria-hidden="true" />
          View Details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDownload(image.url, image.id)}>
          <Download className="size-4" aria-hidden="true" />
          Download
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onSplitDownload(image.url, image.id)}
        >
          <Grid2x2 className="size-4" aria-hidden="true" />
          Split & Download (4 Slices)
        </ContextMenuItem>
        <ContextMenuSeparator />
        {image.prompt && (
          <ContextMenuItem onClick={() => onCopyPrompt(image.prompt)}>
            <Copy className="size-4" aria-hidden="true" />
            Copy Prompt
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onCopyUrl(image.url)}>
          <Link2 className="size-4" aria-hidden="true" />
          Copy Image URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onUseAsReference(image.url)}>
          <ImagePlus className="size-4" aria-hidden="true" />
          Use as Reference
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onReuseSetup(image)}>
          <RotateCw className="size-4" aria-hidden="true" />
          Reuse Setup
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onToggleFavorite(image.id)}>
          <Heart
            className={cn(
              "size-4",
              image.isFavorite && "fill-red-500 text-red-500",
            )}
            aria-hidden="true"
          />
          {image.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCompare(image)}>
          <GitCompareArrows className="size-4" aria-hidden="true" />
          Compare With…
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(image.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
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
      className="relative rounded-lg overflow-hidden bg-muted border border-border"
      role="status"
      aria-label="Generating image"
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-4",
          aspectClass,
        )}
      >
        {/* Skeleton shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/5 to-transparent animate-pulse" />
        <Loader size="sm" />
        <p className="text-xs text-muted-foreground font-mono text-center line-clamp-2 relative">
          {image.prompt || "Generating…"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failed card
// ---------------------------------------------------------------------------

export function FailedCard({ image }: { image: GeneratedImage }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden bg-destructive/5 border border-destructive/20"
      role="alert"
      aria-label="Generation failed"
    >
      <div className="aspect-square flex flex-col items-center justify-center gap-2 p-4">
        <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-sm" aria-hidden="true">
            !
          </span>
        </div>
        <p className="text-xs text-destructive font-mono text-center">
          Failed
        </p>
        <p className="text-[10px] text-muted-foreground text-center line-clamp-4">
          {image.error || image.prompt}
        </p>
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
