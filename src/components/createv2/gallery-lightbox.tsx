"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import type { ChatImageAttachment } from "@/types/chat";

interface GalleryLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ChatImageAttachment | null;
  images: ChatImageAttachment[];
  onNavigate: (image: ChatImageAttachment) => void;
}

export function GalleryLightbox({ open, onOpenChange, image, images, onNavigate }: GalleryLightboxProps) {
  const currentIndex = image ? images.findIndex((img) => img.id === image.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goTo = React.useCallback(
    (direction: "prev" | "next") => {
      const idx = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
      if (idx >= 0 && idx < images.length) {
        onNavigate(images[idx]);
      }
    },
    [currentIndex, images, onNavigate]
  );

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) goTo("prev");
      if (e.key === "ArrowRight" && hasNext) goTo("next");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, hasPrev, hasNext, goTo]);

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-background/95 backdrop-blur-sm border-border overflow-hidden [&>button]:hidden">
        <div className="relative flex flex-col h-[85vh]">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = image.url;
                  link.download = `generated-${image.id}.png`;
                  link.click();
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              {image.generationPrompt && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(image.generationPrompt!);
                    toast.success("Prompt copied");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Image area */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {/* Navigation arrows */}
            {hasPrev && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => goTo("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => goTo("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            <div className="relative w-full h-full">
              <Image
                src={image.url}
                alt={image.generationPrompt || "Generated image"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Bottom info */}
          {image.generationPrompt && (
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {image.generationPrompt}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
