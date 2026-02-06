"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, type GeneratedImage } from "./create-context";
import {
  Layers,
  Trash2,
  X,
  Download,
  Copy,
  ImagePlus,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function HistoryIsland() {
  const prefersReducedMotion = useReducedMotion();
  const {
    history,
    selectedImage,
    selectImage,
    clearHistory,
    historyPanelOpen,
    toggleHistoryPanel,
    addReferenceImageFromUrl,
    reuseImageSetup,
  } = useCreate();

  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleDownload = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
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
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleUseAsReference = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await addReferenceImageFromUrl(url);
    toast.success("Added as reference");
  };

  const handleReuseSetup = async (e: React.MouseEvent, image: GeneratedImage) => {
    e.stopPropagation();
    await reuseImageSetup(image);
    toast.success("Setup restored");
  };

  const renderImageThumbnail = (image: GeneratedImage) => {
    const isPending = image.status === "pending" || !image.url;

    return (
      <motion.button
        key={image.id}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        onClick={() => !isPending && selectImage(image)}
        disabled={isPending}
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden group",
          "border border-border transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          isPending
            ? "cursor-default border-dashed"
            : "hover:border-foreground/30",
          selectedImage?.id === image.id && !isPending && "ring-2 ring-foreground"
        )}
      >
        {isPending ? (
          <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center gap-2">
            <div className={cn("size-6 border-2 border-muted-foreground/30 border-t-blue-500 rounded-full", !prefersReducedMotion && "animate-spin")} aria-hidden="true" />
            <span className="text-[10px] font-mono text-muted-foreground">Generating…</span>
          </div>
        ) : (
          <Image
            src={image.url}
            alt={image.prompt || "Generated"}
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {!isPending && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleUseAsReference(e, image.url)}
                    aria-label="Use as reference image"
                    className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ImagePlus className="size-3.5 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Use as reference</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleDownload(e, image.url, image.id)}
                    aria-label="Download image"
                    className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Download className="size-3.5 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              {image.prompt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => handleCopyPrompt(e, image.prompt)}
                      aria-label="Copy prompt"
                      className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Copy className="size-3.5 text-zinc-900" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy prompt</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleReuseSetup(e, image)}
                    aria-label="Reuse setup (image + prompt + settings)"
                    className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <RotateCw className="size-3.5 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Reuse setup</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
          {isPending ? "Queued" : formatTime(image.timestamp)}
        </div>
      </motion.button>
    );
  };

  return (
    <>
      {/* Clear History Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all {history.length} generation
              {history.length !== 1 ? "s" : ""} from history? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TooltipProvider delayDuration={300}>
        <div className="absolute top-4 right-4 z-20">
          <AnimatePresence initial={false} mode="wait">
            {historyPanelOpen ? (
              <motion.div
                key="panel"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="w-72 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-mono font-medium">History</span>
                    {history.length > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({history.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {history.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowClearConfirm(true)}
                            aria-label="Clear history"
                            className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear history</TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleHistoryPanel}
                      aria-label="Close history panel"
                      className="size-7 rounded-lg"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="h-[320px]">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Layers
                        className="size-8 text-muted-foreground/30 mb-2"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        No generations yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {history.map(renderImageThumbnail)}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            ) : (
              <motion.div
                key="button"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleHistoryPanel}
                      aria-label="Open history"
                      className="size-10 rounded-xl bg-background/95 backdrop-blur-xl border-border shadow-lg"
                    >
                      <Layers className="size-4" aria-hidden="true" />
                      {history.length > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-foreground text-background text-[10px] font-mono flex items-center justify-center">
                          {history.length > 9 ? "9+" : history.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">History</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </>
  );
}
