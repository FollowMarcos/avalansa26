"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon } from "lucide-react";
import { useCreateV2 } from "./createv2-context";
import { GalleryImageCard } from "./gallery-image-card";
import { GalleryLightbox } from "./gallery-lightbox";

export function GalleryColumn() {
  const {
    galleryImages,
    selectedGalleryImage,
    setSelectedGalleryImage,
    lightboxOpen,
    setLightboxOpen,
  } = useCreateV2();

  // Show newest first
  const sortedImages = React.useMemo(
    () => [...galleryImages].reverse(),
    [galleryImages]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Gallery</h2>
        </div>
        {sortedImages.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {sortedImages.length} image{sortedImages.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Gallery grid */}
      <ScrollArea className="flex-1">
        {sortedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 px-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Images you generate will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-3">
            {sortedImages.map((img) => (
              <GalleryImageCard
                key={img.id}
                image={img}
                onClick={() => {
                  setSelectedGalleryImage(img);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Lightbox */}
      <GalleryLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        image={selectedGalleryImage}
        images={sortedImages}
        onNavigate={setSelectedGalleryImage}
      />
    </div>
  );
}
