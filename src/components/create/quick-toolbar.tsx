"use client";

import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { Button } from "@/components/ui/button";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  LayoutGrid,
  Square,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReactFlow } from "@xyflow/react";

export function QuickToolbar() {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    viewMode,
    setViewMode,
    selectedImage,
    nodes,
  } = useCreate();

  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const currentZoom = Math.round(getZoom() * 100);

  const handleZoomIn = () => zoomIn({ duration: 200 });
  const handleZoomOut = () => zoomOut({ duration: 200 });
  const handleFitView = () => fitView({ padding: 0.2, duration: 300 });

  const handleDownload = async () => {
    if (!selectedImage) return;
    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generation-${selectedImage.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-background border border-border shadow-sm">
          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  className="size-8 rounded-lg"
                >
                  <Undo2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  className="size-8 rounded-lg"
                >
                  <Redo2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Zoom */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={nodes.length === 0}
                  aria-label="Zoom out"
                  className="size-8 rounded-lg"
                >
                  <ZoomOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <button
              onClick={handleFitView}
              disabled={nodes.length === 0}
              aria-label={`Current zoom ${currentZoom}%, click to fit view`}
              className="px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center disabled:opacity-50"
            >
              {currentZoom}%
            </button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={nodes.length === 0}
                  aria-label="Zoom in"
                  className="size-8 rounded-lg"
                >
                  <ZoomIn className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFitView}
                  disabled={nodes.length === 0}
                  aria-label="Fit view"
                  className="size-8 rounded-lg"
                >
                  <Maximize2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit View</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* View Mode */}
          <div className="flex items-center" role="group" aria-label="View mode">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("canvas")}
                  aria-label="Canvas view"
                  aria-pressed={viewMode === "canvas"}
                  className={cn(
                    "size-8 rounded-lg",
                    viewMode === "canvas" && "bg-muted"
                  )}
                >
                  <Square className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Canvas View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("gallery")}
                  aria-label="Gallery view"
                  aria-pressed={viewMode === "gallery"}
                  className={cn(
                    "size-8 rounded-lg",
                    viewMode === "gallery" && "bg-muted"
                  )}
                >
                  <LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gallery View</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                disabled={!selectedImage}
                aria-label="Download selected image"
                className="size-8 rounded-lg"
              >
                <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
