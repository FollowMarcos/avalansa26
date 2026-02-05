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
  Users,
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
import { TagInput } from "./tag-input";
import { CollectionSelector } from "./collection-selector";
import { SocialShareMenu } from "./social-share-menu";
import { InlineCharacterSelector } from "./character-selector";
import { useCharacterVault } from "./use-character-vault";

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
    toggleFavorite,
  } = useCreate();

  const [copied, setCopied] = React.useState(false);
  const [urlCopied, setUrlCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Character vault for linking
  const characterVault = useCharacterVault();
  const [linkedCharacterIds, setLinkedCharacterIds] = React.useState<string[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = React.useState(false);

  // Load linked characters when modal opens with a new image
  React.useEffect(() => {
    if (isOpen && image?.id) {
      setIsLoadingCharacters(true);
      characterVault.getCharactersForGeneration(image.id)
        .then((characters) => {
          setLinkedCharacterIds(characters.map((c) => c.id));
        })
        .finally(() => setIsLoadingCharacters(false));

      // Also ensure character vault is loaded
      if (characterVault.characters.length === 0) {
        characterVault.loadVault();
      }
    }
  }, [isOpen, image?.id]);

  const handleLinkCharacter = async (characterId: string) => {
    if (!image?.id) return false;
    const success = await characterVault.linkGenerationToCharacter(image.id, characterId);
    if (success) {
      setLinkedCharacterIds((prev) => [...prev, characterId]);
    }
    return success;
  };

  const handleUnlinkCharacter = async (characterId: string) => {
    if (!image?.id) return false;
    const success = await characterVault.unlinkGenerationFromCharacter(image.id, characterId);
    if (success) {
      setLinkedCharacterIds((prev) => prev.filter((id) => id !== characterId));
    }
    return success;
  };

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
    setViewMode("canvas");
    onClose();
  };

  const handleReuseSetup = async () => {
    await reuseImageSetup(image);
    toast.success("Setup restored");
    setViewMode("canvas");
    onClose();
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
      <DialogContent className="max-w-4xl max-h-[90dvh] p-0 gap-0 overflow-hidden overscroll-contain">
        <div className="flex flex-col md:flex-row h-full max-h-[90dvh]">
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
                  <p className="text-sm leading-relaxed break-words">
                    {image.prompt || <span className="text-muted-foreground italic">No prompt</span>}
                  </p>
                </div>

                {/* Negative Prompt */}
                {image.settings.negativePrompt && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Negative Prompt
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">
                      {image.settings.negativePrompt}
                    </p>
                  </div>
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

                {/* Characters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Characters
                    </span>
                  </div>
                  <InlineCharacterSelector
                    characters={characterVault.characters}
                    linkedCharacterIds={linkedCharacterIds}
                    onLink={handleLinkCharacter}
                    onUnlink={handleUnlinkCharacter}
                  />
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
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
