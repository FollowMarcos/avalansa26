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
    setViewMode,
  } = useCreate();

  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

  const handleUseAsReference = async () => {
    await addReferenceImageFromUrl(image.url);
    toast.success("Added as reference");
    onClose();
    setViewMode("canvas");
  };

  const handleReuseSetup = async () => {
    await reuseImageSetup(image);
    toast.success("Setup restored");
    onClose();
    setViewMode("canvas");
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
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
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

        <Image
          src={image.url}
          alt={image.prompt || "Generated image"}
          fill
          className="object-contain p-8"
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden overscroll-contain">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Image Section */}
          <div className="relative flex-1 min-h-[300px] md:min-h-0 bg-muted flex items-center justify-center group">
            <Image
              src={image.url}
              alt={image.prompt || "Generated image"}
              fill
              className="object-contain p-4"
              unoptimized
            />

            {/* Navigation arrows */}
            {hasPrev && onNavigate && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
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
                  <p className="text-sm leading-relaxed break-words">
                    {image.prompt || <span className="text-muted-foreground italic">No prompt</span>}
                  </p>
                </div>

                {/* Negative Prompt */}
                {image.settings.negativePrompt && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Negative Prompt
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">
                      {image.settings.negativePrompt}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Metadata */}
                <div className="space-y-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Details
                  </span>

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
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
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
                      onClick={handleUseAsReference}
                    >
                      <ImagePlus className="size-4" aria-hidden="true" />
                      Use as Ref
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-xs justify-start col-span-2"
                      onClick={handleReuseSetup}
                    >
                      <RotateCw className="size-4" aria-hidden="true" />
                      Reuse Setup (Image + Prompt + Settings)
                    </Button>
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
