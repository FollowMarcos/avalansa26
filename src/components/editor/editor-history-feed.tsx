"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  useCreate,
  type GeneratedImage,
  type ReferenceImageInfo,
  type TaggedReference,
} from "@/components/create/create-context";
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
} from "lucide-react";

function makeTaggedRef(
  current: TaggedReference | undefined,
  patch: Partial<TaggedReference>
): TaggedReference {
  return {
    image: patch.image !== undefined ? patch.image : current?.image,
    tags: patch.tags !== undefined ? patch.tags : current?.tags || [],
    customText:
      patch.customText !== undefined ? patch.customText : current?.customText || "",
  };
}

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

  const completedImages = React.useMemo(
    () => history.filter((img) => img.status === "completed" && img.url),
    [history]
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

  if (completedImages.length === 0) {
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
      <div className="h-full overflow-y-auto p-3 scrollbar-thin">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
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
      </div>
    </TooltipProvider>
  );
}

// ── Individual feed item ────────────────────────────────────────────────

interface FeedItemProps {
  image: GeneratedImage;
  onSetAsRef: (image: GeneratedImage, type: string) => void;
  onInpaint: () => void;
  onToggleFavorite: () => void;
}

const FeedItem = React.memo(function FeedItem({
  image,
  onSetAsRef,
  onInpaint,
  onToggleFavorite,
}: FeedItemProps) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-border/60 bg-muted/10 transition-all duration-200 hover:border-border hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20">
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={image.url}
          alt={image.prompt?.slice(0, 60) || "Generated image"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
              <DropdownMenuItem onClick={onInpaint}>
                <Paintbrush className="size-3.5 mr-2 text-rose-500" />
                Inpaint this image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Prompt preview */}
      {image.prompt && (
        <div className="px-2.5 py-2">
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {image.prompt}
          </p>
        </div>
      )}
    </div>
  );
});
