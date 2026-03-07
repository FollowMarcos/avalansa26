"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  useCreate,
  type GeneratedImage,
  type ReferenceImageInfo,
} from "@/components/create/create-context";
import { makeTaggedRef } from "./editor-constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Palette,
  PersonStanding,
  Smile,
  Shirt,
  MapPin,
  ImagePlus,
  PenLine,
  Paintbrush,
  Heart,
  Loader2,
  ImageOff,
  AlertCircle,
} from "lucide-react";
import { ImageDetailModal } from "@/components/create/image-detail-modal";


export function EditorHistoryFeed() {
  const {
    history,
    loadMoreHistory,
    hasMoreHistory,
    isLoadingMoreHistory,
    settings,
    updateSettings,
    addReferenceImageFromUrl,
    setInpaintSourceImage,
    toggleFavorite,
  } = useCreate();

  const pendingImages = React.useMemo(
    () => history.filter((img) => img.status === "pending"),
    [history]
  );

  const completedImages = React.useMemo(
    () => history.filter((img) => img.status === "completed" && img.url),
    [history]
  );

  const failedImages = React.useMemo(
    () => history.filter((img) => img.status === "failed"),
    [history]
  );

  // Detail modal state
  const [detailImage, setDetailImage] = React.useState<GeneratedImage | null>(null);

  const detailImageIndex = React.useMemo(
    () => detailImage ? completedImages.findIndex((img) => img.id === detailImage.id) : -1,
    [detailImage, completedImages]
  );

  const handleDetailNavigate = React.useCallback(
    (direction: "prev" | "next") => {
      const newIndex = direction === "prev" ? detailImageIndex - 1 : detailImageIndex + 1;
      if (newIndex >= 0 && newIndex < completedImages.length) {
        setDetailImage(completedImages[newIndex]);
      }
    },
    [detailImageIndex, completedImages]
  );

  // Infinite scroll via intersection observer
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreHistory && !isLoadingMoreHistory) {
          loadMoreHistory();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMoreHistory, isLoadingMoreHistory, loadMoreHistory]);

  const setAsRef = (image: GeneratedImage, type: string) => {
    const ref: ReferenceImageInfo = { url: image.url };
    switch (type) {
      case "style":
        updateSettings({ styleRef: ref });
        break;
      case "pose":
        updateSettings({ poseRef: ref });
        break;
      case "expression":
        updateSettings({
          expressionRef: makeTaggedRef(settings.expressionRef, { image: ref }),
        });
        break;
      case "clothing":
        updateSettings({
          clothingRef: makeTaggedRef(settings.clothingRef, { image: ref }),
        });
        break;
      case "location":
        updateSettings({
          locationRef: makeTaggedRef(settings.locationRef, { image: ref }),
        });
        break;
      case "generic":
        addReferenceImageFromUrl(image.url);
        break;
    }
  };

  if (completedImages.length === 0 && pendingImages.length === 0 && failedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground px-6">
        <div className="rounded-2xl bg-muted/40 p-5">
          <ImageOff className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground/70">No generations yet</p>
          <p className="text-xs text-muted-foreground">
            Write a prompt below and hit Generate to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full overflow-y-auto p-2 scrollbar-thin">
        <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {/* Pending / generating items */}
            {pendingImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PendingItem image={image} />
              </motion.div>
            ))}

            {/* Failed items */}
            {failedImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <FailedItem image={image} />
              </motion.div>
            ))}

            {/* Completed items */}
            {completedImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
              >
                <FeedItem
                  image={image}
                  onClick={() => setDetailImage(image)}
                  onSetAsRef={setAsRef}
                  onInpaint={() => setInpaintSourceImage(image)}
                  onToggleFavorite={() => toggleFavorite(image.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {isLoadingMoreHistory && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Image detail modal */}
        <ImageDetailModal
          image={detailImage}
          isOpen={!!detailImage}
          onClose={() => setDetailImage(null)}
          onNavigate={handleDetailNavigate}
          hasPrev={detailImageIndex > 0}
          hasNext={detailImageIndex < completedImages.length - 1}
        />
      </div>
    </TooltipProvider>
  );
}

// ── Individual feed item ────────────────────────────────────────────────

interface FeedItemProps {
  image: GeneratedImage;
  onClick: () => void;
  onSetAsRef: (image: GeneratedImage, type: string) => void;
  onInpaint: () => void;
  onToggleFavorite: () => void;
}

const FeedItem = React.memo(function FeedItem({
  image,
  onClick,
  onSetAsRef,
  onInpaint,
  onToggleFavorite,
}: FeedItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragGhostRef = React.useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/uri-list", image.url);
    e.dataTransfer.setData("application/x-editor-image", JSON.stringify({ url: image.url, prompt: image.prompt }));
    e.dataTransfer.effectAllowed = "copy";

    // Build a clean drag ghost: small rounded thumbnail
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-1000px;left:-1000px;width:64px;height:64px;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;";
    const img = document.createElement("img");
    img.src = image.url;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    ghost.appendChild(img);
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, 32, 32);

    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.02] transition-all duration-200 hover:border-white/[0.12] cursor-pointer",
        isDragging && "opacity-40 scale-95 ring-1 ring-primary/30"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={image.url}
          alt={image.prompt?.slice(0, 60) || "Generated image"}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2">
          {/* Favorite */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                aria-label={image.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "size-3.5 transition-colors",
                    image.isFavorite ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              {image.isFavorite ? "Unfavorite" : "Favorite"}
            </TooltipContent>
          </Tooltip>

          {/* Edit dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                    aria-label="Use as reference"
                  >
                    <PenLine className="size-3.5 text-white" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                Use as reference
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onSetAsRef(image, "style")}>
                <Palette className="size-3.5 mr-2 text-violet-500" />
                Use as Style Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetAsRef(image, "pose")}>
                <PersonStanding className="size-3.5 mr-2 text-blue-500" />
                Use as Pose Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetAsRef(image, "expression")}>
                <Smile className="size-3.5 mr-2 text-amber-500" />
                Use as Expression Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetAsRef(image, "clothing")}>
                <Shirt className="size-3.5 mr-2 text-emerald-500" />
                Use as Clothing Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetAsRef(image, "location")}>
                <MapPin className="size-3.5 mr-2 text-cyan-500" />
                Use as Location Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetAsRef(image, "generic")}>
                <ImagePlus className="size-3.5 mr-2 text-muted-foreground" />
                Use as Generic Reference
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInpaint(); }}>
                <Paintbrush className="size-3.5 mr-2 text-rose-500" />
                Inpaint this image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Prompt preview */}
      {image.prompt && (
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {image.prompt}
          </p>
        </div>
      )}
    </div>
  );
});

// ── Pending (generating) item ───────────────────────────────────────────

function PendingItem({ image }: { image: GeneratedImage }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.02]">
      <div className="aspect-square relative flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="size-8 rounded-full border-2 border-foreground/20 border-t-foreground/60 animate-spin" />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">Generating...</span>
      </div>
      {image.prompt && (
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {image.prompt}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Failed item ─────────────────────────────────────────────────────────

function FailedItem({ image }: { image: GeneratedImage }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-destructive/30 bg-destructive/5">
      <div className="aspect-square relative flex flex-col items-center justify-center gap-2">
        <AlertCircle className="size-5 text-destructive/60" />
        <span className="text-[10px] text-destructive/80 font-medium">Failed</span>
        {image.error && (
          <p className="text-[9px] text-destructive/60 text-center px-4 line-clamp-2">{image.error}</p>
        )}
      </div>
      {image.prompt && (
        <div className="px-2 py-1.5 border-t border-destructive/10">
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {image.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
