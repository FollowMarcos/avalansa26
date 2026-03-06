"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ChatImageAttachment } from "@/types/chat";

interface GalleryImageCardProps {
  image: ChatImageAttachment;
  onClick: () => void;
}

export function GalleryImageCard({ image, onClick }: GalleryImageCardProps) {
  const handleDownload = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const link = document.createElement("a");
      link.href = image.url;
      link.download = `generated-${image.id}.png`;
      link.click();
    },
    [image]
  );

  const handleCopyPrompt = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (image.generationPrompt) {
        navigator.clipboard.writeText(image.generationPrompt);
        toast.success("Prompt copied");
      }
    },
    [image.generationPrompt]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-muted"
      onClick={onClick}
    >
      <Image
        src={image.url}
        alt={image.generationPrompt || "Generated image"}
        fill
        className="object-cover"
        unoptimized
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />

      {/* Hover actions */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Prompt text */}
        {image.generationPrompt && (
          <p className="text-[11px] text-white/80 line-clamp-2 mb-2 leading-snug">
            {image.generationPrompt}
          </p>
        )}

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          {image.generationPrompt && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleCopyPrompt}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
