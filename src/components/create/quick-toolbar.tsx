"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Maximize2,
  Download,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QuickToolbar() {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    viewMode,
    setViewMode,
    selectedImage,
  } = useCreate();

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(25, zoom - 25));
  const handleZoomReset = () => setZoom(100);

  const handleDownload = async () => {
    if (!selectedImage) return;

    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `create-${selectedImage.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-700">
            <ToolbarButton
              icon={Undo2}
              tooltip="Undo (Ctrl+Z)"
              onClick={undo}
              disabled={!canUndo}
            />
            <ToolbarButton
              icon={Redo2}
              tooltip="Redo (Ctrl+Shift+Z)"
              onClick={redo}
              disabled={!canRedo}
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 px-2 border-r border-zinc-700">
            <ToolbarButton
              icon={ZoomOut}
              tooltip="Zoom Out"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
            />
            <button
              onClick={handleZoomReset}
              aria-label="Reset zoom to 100%"
              className="px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 tabular-nums transition-colors"
            >
              {zoom}%
            </button>
            <ToolbarButton
              icon={ZoomIn}
              tooltip="Zoom In"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-0.5 px-2 border-r border-zinc-700">
            <ToolbarButton
              icon={Maximize2}
              tooltip="Canvas View"
              onClick={() => setViewMode("canvas")}
              active={viewMode === "canvas"}
            />
            <ToolbarButton
              icon={LayoutGrid}
              tooltip="Gallery View"
              onClick={() => setViewMode("gallery")}
              active={viewMode === "gallery"}
            />
          </div>

          {/* Download */}
          <div className="flex items-center gap-0.5 pl-2">
            <ToolbarButton
              icon={Download}
              tooltip="Download Image"
              onClick={handleDownload}
              disabled={!selectedImage}
            />
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  icon: Icon,
  tooltip,
  onClick,
  disabled,
  active,
}: {
  icon: React.ElementType;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          className={cn(
            "size-8 rounded-lg flex items-center justify-center transition-colors",
            active
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
            disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
          )}
        >
          <Icon className="size-4" strokeWidth={1.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
