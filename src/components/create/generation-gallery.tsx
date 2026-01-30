"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { motion } from "motion/react";
import { Download, Maximize2, Copy, Trash2, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GenerationGallery() {
  const { history, selectedImage, selectImage, viewMode } = useCreate();

  if (viewMode !== "gallery") return null;

  return (
    <div className="absolute inset-0 z-10 bg-zinc-950">
      <ScrollArea className="h-full">
        <div className="p-6">
          {history.length === 0 ? (
            <EmptyGallery />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {history.map((image, index) => (
                <GalleryItem
                  key={image.id}
                  image={image}
                  isSelected={selectedImage?.id === image.id}
                  onSelect={() => selectImage(image)}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-2">No generations yet</h3>
      <p className="text-sm text-zinc-500 max-w-xs">
        Your generated images will appear here. Start by entering a prompt and clicking Generate.
      </p>
    </div>
  );
}

interface GalleryItemProps {
  image: {
    id: string;
    url: string;
    prompt: string;
    mode: string;
    timestamp: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function GalleryItem({ image, isSelected, onSelect, index }: GalleryItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `create-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.prompt);
  };

  const timeAgo = formatTimeAgo(image.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative group rounded-xl overflow-hidden cursor-pointer",
        "bg-zinc-900 border-2 transition-all duration-200",
        isSelected
          ? "border-violet-500 shadow-lg shadow-violet-500/20"
          : "border-transparent hover:border-zinc-700"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.prompt || "Generated image"}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
            "transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Hover actions */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1",
            "transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyPrompt}
            className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Info overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3",
            "transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-xs text-white/90 line-clamp-2 mb-1">
            {image.prompt || "No prompt"}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="capitalize">{image.mode.replace("-", " ")}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
          <Maximize2 className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
