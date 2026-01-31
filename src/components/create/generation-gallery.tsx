"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { Download, Copy, X, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GenerationGallery() {
  const { viewMode, setViewMode, history, selectedImage, selectImage, addReferenceImageFromUrl } = useCreate();

  if (viewMode !== "gallery") return null;

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `generation-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleUseAsReference = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await addReferenceImageFromUrl(url);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-mono font-medium">Gallery</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("canvas")}
            aria-label="Close gallery"
            className="size-8 rounded-lg"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>

        {/* Gallery Grid */}
        <ScrollArea className="h-[calc(100%-65px)]">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-muted-foreground font-mono">No generations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start creating to see your images here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
              {history.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select image: ${image.prompt || "Generated image"}`}
                  className={cn(
                    "relative group rounded-lg overflow-hidden bg-muted border border-border cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    selectedImage?.id === image.id && "ring-2 ring-foreground"
                  )}
                  onClick={() => {
                    selectImage(image);
                    setViewMode("canvas");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectImage(image);
                      setViewMode("canvas");
                    }
                  }}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={image.url}
                      alt={image.prompt || "Generated"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-8 rounded-lg"
                        aria-label="Use as reference image"
                        onClick={(e) => handleUseAsReference(e, image.url)}
                      >
                        <ImagePlus className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-8 rounded-lg"
                        aria-label="Download image"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.url, image.id);
                        }}
                      >
                        <Download className="size-4" />
                      </Button>
                      {image.prompt && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8 rounded-lg"
                          aria-label="Copy prompt"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(image.prompt);
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Info badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono">
                      {image.settings.imageSize}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono text-muted-foreground">
                      {formatTime(image.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
