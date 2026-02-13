"use client";

import * as React from "react";
import Image from "next/image";
import {
  Download,
  Copy,
  ImagePlus,
  RotateCw,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  Ratio,
  ImageIcon,
  Sparkles,
  Heart,
  Tags,
  FolderOpen,
  Link2,
  Images,
  Cpu,
  Grid2x2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCreate, type GeneratedImage } from "./create-context";
import { cn } from "@/lib/utils";
import { ZoomableImage } from "./zoomable-image";
import { TagInput } from "./tag-input";
import { CollectionSelector } from "./collection-selector";
import { SocialShareMenu } from "./social-share-menu";

const SOURCE_LABELS: Record<string, string> = {
  characterTurnaround: "Character Turnaround Sheet",
};

interface ImageDetailModalProps {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageDetailModal({
  image,
  isOpen,
  onClose,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}: ImageDetailModalProps) {
  const {
    addReferenceImageFromUrl,
    reuseImageSetup,
    bulkDeleteImages,
    toggleFavorite,
  } = useCreate();

  const [copied, setCopied] = React.useState(false);
  const [urlCopied, setUrlCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [promptExpanded, setPromptExpanded] = React.useState(false);


  // Reset expanded state when navigating to a different image
  React.useEffect(() => {
    setPromptExpanded(false);
  }, [image?.id]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev && onNavigate) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && hasNext && onNavigate) {
        onNavigate("next");
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrev, hasNext, onNavigate, onClose, isFullscreen]);

  // Scroll-wheel navigation: scroll up = prev, scroll down = next
  const handleScrollNavigate = React.useCallback(
    (direction: -1 | 1) => {
      if (!onNavigate) return;
      if (direction === -1 && hasPrev) onNavigate("prev");
      else if (direction === 1 && hasNext) onNavigate("next");
    },
    [onNavigate, hasPrev, hasNext],
  );

  if (!image) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `generation-${image.id}.png`;
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

  const handleCopyPrompt = async () => {
    if (!image.prompt) return;
    try {
      await navigator.clipboard.writeText(image.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
      toast.success("Image URL copied");
    } catch (error) {
      console.error("Copy URL failed:", error);
      toast.error("Failed to copy URL");
    }
  };

  const handleUseAsReference = async () => {
    await addReferenceImageFromUrl(image.url);
    toast.success("Added as reference");
    onClose();
  };

  const handleReuseSetup = async () => {
    await reuseImageSetup(image);
    toast.success("Setup restored");
    onClose();
  };

  const handleSplitDownload = async () => {
    toast.info("Splitting image…");
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = image.url;
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
        a.download = `${image.id}-slice-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
      toast.success(`Downloaded ${blobs.length} slices`);
    } catch (error) {
      console.error("Split failed:", error);
      toast.error("Failed to split image");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await bulkDeleteImages([image.id]);
      toast.success("Image deleted");
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "long" });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    if (days < 7) return rtf.format(-days, "day");
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen image view"
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onClick={() => setIsFullscreen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setIsFullscreen(false);
          }
        }}
        tabIndex={-1}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(false);
          }}
          aria-label="Close fullscreen"
        >
          <X className="size-6" aria-hidden="true" />
        </Button>

        {/* Navigation arrows */}
        {hasPrev && onNavigate && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 size-12"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("prev");
            }}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-8" aria-hidden="true" />
          </Button>
        )}
        {hasNext && onNavigate && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 size-12"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("next");
            }}
            aria-label="Next image"
          >
            <ChevronRight className="size-8" aria-hidden="true" />
          </Button>
        )}

        {/* Zoomable image — double-click to zoom in/out, drag to pan */}
        <ZoomableImage
          src={image.url}
          alt={image.prompt || "Generated image"}
          className="w-full h-full p-8"
          imageClassName="p-8"
          onSingleClick={() => setIsFullscreen(false)}
          onScrollNavigate={handleScrollNavigate}
        />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90dvh] p-0 gap-0 overflow-hidden overscroll-contain">
        <div className="flex flex-col md:flex-row h-full max-h-[90dvh]">
          {/* Image Section */}
          <div className="relative flex-1 min-h-[300px] md:min-h-0 bg-muted flex items-center justify-center group">
            {/* Zoomable image — double-click to zoom in/out, drag to pan */}
            <ZoomableImage
              src={image.url}
              alt={image.prompt || "Generated image"}
              className="absolute inset-0"
              imageClassName="p-4"
              onScrollNavigate={handleScrollNavigate}
            />

            {/* Navigation arrows */}
            {hasPrev && onNavigate && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                onClick={() => onNavigate("prev")}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
            )}
            {hasNext && onNavigate && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                onClick={() => onNavigate("next")}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
            )}

            {/* Fullscreen button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              onClick={() => setIsFullscreen(true)}
              aria-label="View fullscreen"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Info Section */}
          <div className="w-full md:w-80 flex flex-col border-t md:border-t-0 md:border-l border-border">
            <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
              <DialogTitle className="font-mono text-sm">Image Details</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Prompt */}
                {image.settings.source ? (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Source
                    </span>
                    <p className="text-sm font-medium">
                      {SOURCE_LABELS[image.settings.source] ?? image.settings.source}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground uppercase">
                        Prompt
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1"
                        onClick={handleCopyPrompt}
                        disabled={!image.prompt}
                      >
                        {copied ? (
                          <>
                            <Check className="size-3" aria-hidden="true" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" aria-hidden="true" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed break-words",
                        !promptExpanded && "line-clamp-3",
                      )}
                    >
                      {image.prompt || <span className="text-muted-foreground italic">No prompt</span>}
                    </p>
                    {image.prompt && image.prompt.length > 100 && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                        onClick={() => setPromptExpanded((v) => !v)}
                      >
                        {promptExpanded ? "Hide" : "See all"}
                      </button>
                    )}
                  </div>
                )}

                {/* Negative Prompt */}
                {image.settings.negativePrompt && (
                  <NegativePromptSection text={image.settings.negativePrompt} />
                )}

                {/* Reference Images */}
                {image.settings.referenceImages && image.settings.referenceImages.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Images className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs font-mono text-muted-foreground uppercase">
                          Reference Images ({image.settings.referenceImages.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {image.settings.referenceImages.map((ref, index) => (
                          <a
                            key={ref.storagePath || index}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-md overflow-hidden border border-border hover:border-primary transition-colors group"
                          >
                            <Image
                              src={ref.url}
                              alt={`Reference image ${index + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Favorite */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    Favorite
                  </span>
                  <Button
                    variant={image.isFavorite ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => toggleFavorite(image.id)}
                  >
                    <Heart
                      className={cn(
                        "size-4",
                        image.isFavorite && "fill-red-500 text-red-500"
                      )}
                      aria-hidden="true"
                    />
                    {image.isFavorite ? "Favorited" : "Add to favorites"}
                  </Button>
                </div>

                <Separator />

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tags className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Tags
                    </span>
                  </div>
                  <TagInput imageId={image.id} />
                </div>

                <Separator />

                {/* Collections */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Collections
                    </span>
                  </div>
                  <CollectionSelector imageId={image.id} />
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    Details
                  </span>

                  {/* Model */}
                  {image.settings.model && (
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <Cpu className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="text-sm font-mono font-medium truncate">{image.settings.model}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Aspect Ratio */}
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <Ratio className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                        <p className="text-sm font-mono font-medium tabular-nums">{image.settings.aspectRatio}</p>
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quality</p>
                        <p className="text-sm font-mono font-medium tabular-nums">{image.settings.imageSize}</p>
                      </div>
                    </div>

                    {/* Generation Speed */}
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mode</p>
                        <p className="text-sm font-mono font-medium capitalize">
                          {image.settings.generationSpeed}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-mono font-medium">
                          {getRelativeTime(image.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full date */}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(image.timestamp)}
                  </p>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    Actions
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start"
                      onClick={handleDownload}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start"
                      onClick={handleCopyUrl}
                    >
                      {urlCopied ? (
                        <>
                          <Check className="size-4" aria-hidden="true" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Link2 className="size-4" aria-hidden="true" />
                          Copy URL
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start"
                      onClick={handleUseAsReference}
                    >
                      <ImagePlus className="size-4" aria-hidden="true" />
                      Use as Ref
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start"
                      onClick={handleReuseSetup}
                    >
                      <RotateCw className="size-4" aria-hidden="true" />
                      Reuse Setup
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start col-span-2"
                      onClick={handleSplitDownload}
                    >
                      <Grid2x2 className="size-4" aria-hidden="true" />
                      Split & Download (4 Slices)
                    </Button>

                    {/* Social Share */}
                    <SocialShareMenu
                      imageUrl={image.url}
                      prompt={image.prompt}
                      className="col-span-2 justify-start font-mono text-xs"
                    />
                  </div>
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="space-y-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 font-mono text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete Image
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The image will be permanently
                          deleted from your history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NegativePromptSection({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = React.useState(false);

  React.useEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) { setClamped(false); return; }

    const check = () => {
      // Temporarily remove line-clamp to measure full content height
      el.style.display = 'block';
      el.style.webkitLineClamp = 'unset';
      el.style.overflow = 'visible';
      const fullHeight = el.scrollHeight;

      el.style.display = '';
      el.style.webkitLineClamp = '';
      el.style.overflow = '';
      const clampedHeight = el.clientHeight;

      setClamped(fullHeight > clampedHeight + 1);
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();

    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono text-muted-foreground uppercase">
        Negative Prompt
      </span>
      <p
        ref={ref}
        className={cn(
          "text-sm text-muted-foreground leading-relaxed break-words",
          !expanded && "line-clamp-2",
        )}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
}
