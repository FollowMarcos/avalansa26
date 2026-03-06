"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No generations yet. Start creating!
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 scrollbar-thin">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {completedImages.map((image) => (
          <FeedItem
            key={image.id}
            image={image}
            onSetAsRef={setAsRef}
            onInpaint={() => setInpaintSourceImage(image)}
            onToggleFavorite={() => toggleFavorite(image.id)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8 flex items-center justify-center">
        {isLoadingMoreHistory && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
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
    <div className="group relative rounded-lg overflow-hidden border border-border bg-muted/20 transition-colors hover:border-border/80">
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={image.url}
          alt={image.prompt?.slice(0, 60) || "Generated image"}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100">
          {/* Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="p-1 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
            aria-label={image.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "size-3.5",
                image.isFavorite ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
          </button>

          {/* Edit dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="Use as reference"
              >
                <PenLine className="size-3.5 text-white" />
              </button>
            </DropdownMenuTrigger>
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
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
            {image.prompt}
          </p>
        </div>
      )}
    </div>
  );
});
