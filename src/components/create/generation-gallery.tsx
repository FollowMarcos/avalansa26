"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, type GeneratedImage } from "./create-context";
import { Download, Copy, ImagePlus, RotateCw, Check, Heart, Link2, Grid2x2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { GalleryToolbar } from "./gallery-toolbar";
import { BulkActionBar } from "./bulk-action-bar";
import { ImageDetailModal } from "./image-detail-modal";

export function GenerationGallery() {
  const {
    selectedImage,
    addReferenceImageFromUrl,
    reuseImageSetup,
    galleryFilterState,
    toggleImageSelection,
    getFilteredHistory,
    toggleFavorite,
    isGenerating,
    history,
    loadMoreHistory,
    hasMoreHistory,
    isLoadingMoreHistory,
  } = useCreate();

  const [detailImage, setDetailImage] = React.useState<GeneratedImage | null>(null);
  const filteredHistory = getFilteredHistory();
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Count pending images for loading state
  const pendingCount = history.filter(img => img.status === "pending").length;

  // Infinite scroll — load more when sentinel enters viewport
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMoreHistory) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreHistory) {
          loadMoreHistory();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreHistory, isLoadingMoreHistory, loadMoreHistory]);

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `generation-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Image URL copied");
    } catch (error) {
      console.error("Copy URL failed:", error);
      toast.error("Failed to copy URL");
    }
  };

  const handleUseAsReference = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await addReferenceImageFromUrl(url);
    toast.success("Added as reference");
  };

  const handleReuseSetup = async (e: React.MouseEvent, image: GeneratedImage) => {
    e.stopPropagation();
    await reuseImageSetup(image);
    toast.success("Setup restored");
  };

  const handleSplitDownload = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    toast.info("Splitting image\u2026");
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });

      const sliceCount = 4;
      const sliceHeight = img.height / sliceCount;

      const blobs = await Promise.all(
        Array.from({ length: sliceCount }, (_, i) => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = sliceHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, i * sliceHeight, img.width, sliceHeight, 0, 0, img.width, sliceHeight);
          return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create slice"));
            }, "image/png");
          });
        }),
      );

      for (let i = 0; i < blobs.length; i++) {
        const blobUrl = URL.createObjectURL(blobs[i]);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${id}-slice-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
      toast.success(`Downloaded ${blobs.length} slices`);
    } catch (error) {
      console.error("Split failed:", error);
      toast.error("Failed to split image");
    }
  };

  const handleImageClick = (image: GeneratedImage) => {
    if (galleryFilterState.bulkSelection.enabled) {
      toggleImageSelection(image.id);
    } else {
      setDetailImage(image);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    await toggleFavorite(imageId);
  };

  // Navigation for detail modal
  const handleDetailNavigate = (direction: "prev" | "next") => {
    if (!detailImage) return;
    const currentIndex = filteredHistory.findIndex(img => img.id === detailImage.id);
    if (currentIndex === -1) return;

    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredHistory.length) {
      setDetailImage(filteredHistory[newIndex]);
    }
  };

  const detailImageIndex = detailImage
    ? filteredHistory.findIndex(img => img.id === detailImage.id)
    : -1;

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "narrow" });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-Math.floor(hours / 24), "day");
  };

  const isSelected = (id: string) => galleryFilterState.bulkSelection.selectedIds.has(id);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <GalleryToolbar />
      </div>

      {/* Masonry Gallery Grid */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filteredHistory.length === 0 && pendingCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-muted-foreground font-mono">
              {galleryFilterState.searchQuery ||
               galleryFilterState.filters.aspectRatio.length > 0 ||
               galleryFilterState.filters.imageSize.length > 0
                ? "No images match your filters"
                : "No generations yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {galleryFilterState.searchQuery ||
               galleryFilterState.filters.aspectRatio.length > 0 ||
               galleryFilterState.filters.imageSize.length > 0
                ? "Try adjusting your search or filters"
                : "Enter a prompt below to start creating"}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {filteredHistory.map((image) =>
              image.status === "pending" ? (
                <PendingCard key={image.id} image={image} />
              ) : image.status === "failed" ? (
                <FailedCard key={image.id} image={image} />
              ) : (
                <GalleryItem
                  key={image.id}
                  image={image}
                  isSelected={isSelected(image.id)}
                  isBulkMode={galleryFilterState.bulkSelection.enabled}
                  isCurrentSelected={selectedImage?.id === image.id}
                  onImageClick={handleImageClick}
                  onDownload={handleDownload}
                  onCopyPrompt={handleCopyPrompt}
                  onCopyUrl={handleCopyUrl}
                  onUseAsReference={handleUseAsReference}
                  onReuseSetup={handleReuseSetup}
                  onSplitDownload={handleSplitDownload}
                  onToggleSelection={toggleImageSelection}
                  onToggleFavorite={handleToggleFavorite}
                  formatTime={formatTime}
                />
              )
            )}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMoreHistory && filteredHistory.length > 0 && (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            {isLoadingMoreHistory && <Loader size="sm" />}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar />

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={detailImage}
        isOpen={!!detailImage}
        onClose={() => setDetailImage(null)}
        onNavigate={handleDetailNavigate}
        hasPrev={detailImageIndex > 0}
        hasNext={detailImageIndex < filteredHistory.length - 1}
      />
    </div>
  );
}

// Memoized gallery item for performance
interface GalleryItemProps {
  image: GeneratedImage;
  isSelected: boolean;
  isBulkMode: boolean;
  isCurrentSelected: boolean;
  onImageClick: (image: GeneratedImage) => void;
  onDownload: (url: string, id: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onCopyUrl: (e: React.MouseEvent, url: string) => void;
  onUseAsReference: (e: React.MouseEvent, url: string) => void;
  onReuseSetup: (e: React.MouseEvent, image: GeneratedImage) => void;
  onSplitDownload: (e: React.MouseEvent, url: string, id: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  formatTime: (timestamp: number) => string;
}

const GalleryItem = React.memo(function GalleryItem({
  image,
  isSelected,
  isBulkMode,
  isCurrentSelected,
  onImageClick,
  onDownload,
  onCopyPrompt,
  onCopyUrl,
  onUseAsReference,
  onReuseSetup,
  onSplitDownload,
  onToggleSelection,
  onToggleFavorite,
  formatTime,
}: GalleryItemProps) {
  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative group rounded-lg overflow-hidden bg-muted border",
        isCurrentSelected && !isBulkMode && "ring-2 ring-foreground",
        isSelected && isBulkMode && "ring-2 ring-primary border-primary"
      )}
      style={{ contentVisibility: "auto" }}
    >
      <button
        type="button"
        aria-label={`${isBulkMode ? "Select" : "View"} image: ${image.prompt || "Generated image"}`}
        className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => onImageClick(image)}
      >
      {/* Image container - using aspect ratio from settings */}
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
      </button>

      {/* Favorite button - always visible on hover or when favorited */}
      {!isBulkMode && (
        <button
          type="button"
          className={cn(
            "absolute top-1 right-1 z-10 size-11 rounded-full flex items-center justify-center",
            "bg-background/80 hover:bg-background transition-colors transition-opacity duration-150",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100",
            image.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          aria-label={image.isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => onToggleFavorite(e, image.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleFavorite(e as unknown as React.MouseEvent, image.id);
            }
          }}
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              image.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Selection checkbox overlay */}
      {isBulkMode && (
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select image: ${image.prompt || "Generated image"}`}
          tabIndex={0}
          className={cn(
            "absolute top-2 left-2 z-10 cursor-pointer",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "transition-opacity duration-150"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(image.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelection(image.id);
            }
          }}
        >
          <div
            className={cn(
              "size-6 rounded-md border-2 flex items-center justify-center",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background/80 border-border hover:border-primary"
            )}
          >
            {isSelected && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
          </div>
        </div>
      )}

      {/* Hover overlay - hide in bulk mode */}
      {!isBulkMode && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Use as reference image"
              onClick={(e) => onUseAsReference(e, image.url)}
            >
              <ImagePlus className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Download image"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(image.url, image.id);
              }}
            >
              <Download className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Split image into 4 slices and download"
              onClick={(e) => onSplitDownload(e, image.url, image.id)}
            >
              <Grid2x2 className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Copy image URL"
              onClick={(e) => onCopyUrl(e, image.url)}
            >
              <Link2 className="size-4" aria-hidden="true" />
            </Button>
            {image.prompt && (
              <Button
                variant="secondary"
                size="icon"
                className="size-8 rounded-lg"
                aria-label="Copy prompt"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyPrompt(image.prompt);
                }}
              >
                <Copy className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-lg"
              aria-label="Reuse setup (image + prompt + settings)"
              onClick={(e) => onReuseSetup(e, image)}
            >
              <RotateCw className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Info badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono tabular-nums">
          {image.settings.imageSize}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono tabular-nums text-muted-foreground">
          {formatTime(image.timestamp)}
        </span>
      </div>
    </motion.article>
  );
});

/** Placeholder card shown while an image is being generated */
function PendingCard({ image }: { image: GeneratedImage }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden bg-muted border border-border"
      role="status"
      aria-label="Generating image"
    >
      <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4">
        <Loader size="sm" />
        <p className="text-xs text-muted-foreground font-mono text-center line-clamp-2">
          {image.prompt || "Generating\u2026"}
        </p>
      </div>
    </div>
  );
}

/** Card shown when image generation failed */
function FailedCard({ image }: { image: GeneratedImage }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden bg-destructive/5 border border-destructive/20"
      role="alert"
      aria-label="Generation failed"
    >
      <div className="aspect-square flex flex-col items-center justify-center gap-2 p-4">
        <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-sm" aria-hidden="true">!</span>
        </div>
        <p className="text-xs text-destructive font-mono text-center">Failed</p>
        <p className="text-[10px] text-muted-foreground text-center line-clamp-4">
          {image.error || image.prompt}
        </p>
      </div>
    </div>
  );
}
