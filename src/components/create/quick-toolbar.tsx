"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  GitBranch,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReactFlow } from "@xyflow/react";

const TOOLBAR_COLLAPSED_KEY = "canvas-toolbar-collapsed";

export function QuickToolbar() {
  const { viewMode, setViewMode, interactionMode, setInteractionMode } = useCreate();
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const [currentZoom, setCurrentZoom] = React.useState(100);

  // Update zoom display periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      try {
        setCurrentZoom(Math.round(getZoom() * 100));
      } catch {
        // ReactFlow may not be ready
      }
    }, 200);
    return () => clearInterval(interval);
  }, [getZoom]);

  // Collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(TOOLBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(TOOLBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Only show floating toolbar in workflow mode
  // Gallery mode has view switcher integrated into GalleryToolbar
  if (viewMode !== "workflow") return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div
          className={cn(
            "flex items-center gap-1 rounded-xl bg-background border border-border shadow-sm transition-all duration-200 ease-out",
            isCollapsed ? "px-1.5 py-1.5" : "px-2 py-1.5"
          )}
        >
          {/* Collapse/Expand Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                aria-label={isCollapsed ? "Expand toolbar" : "Collapse toolbar"}
                aria-expanded={!isCollapsed}
                className="size-8 rounded-lg"
              >
                {isCollapsed ? (
                  <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <ChevronUp className="size-4" strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}</TooltipContent>
          </Tooltip>

          {/* Collapsible content */}
          <div
            className={cn(
              "flex items-center gap-1 overflow-hidden transition-all duration-200 ease-out",
              isCollapsed ? "max-w-0 opacity-0" : "max-w-[600px] opacity-100"
            )}
          >
            <div className="w-px h-5 bg-border mx-1" />

            {/* Tool Switcher */}
            <div className="flex items-center" role="group" aria-label="Interaction tools">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInteractionMode("select")}
                    aria-label="Select tool (V)"
                    aria-pressed={interactionMode === "select"}
                    className={cn(
                      "size-8 rounded-lg",
                      interactionMode === "select" && "bg-muted"
                    )}
                  >
                    <MousePointer2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Select Tool (V)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInteractionMode("hand")}
                    aria-label="Hand tool (H)"
                    aria-pressed={interactionMode === "hand"}
                    className={cn(
                      "size-8 rounded-lg",
                      interactionMode === "hand" && "bg-muted"
                    )}
                  >
                    <Hand className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hand Tool (H)</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Zoom Controls */}
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => zoomOut({ duration: 200 })}
                    aria-label="Zoom out"
                    className="size-8 rounded-lg"
                  >
                    <ZoomOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <button
                onClick={() => fitView({ padding: 0.2, duration: 300 })}
                aria-label={`Current zoom ${currentZoom}%, click to fit view`}
                className="px-2 py-1 min-h-[32px] text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                {currentZoom}%
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => zoomIn({ duration: 200 })}
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
                    onClick={() => fitView({ padding: 0.2, duration: 300 })}
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
                    onClick={() => setViewMode("gallery")}
                    aria-label="Gallery view"
                    className="size-8 rounded-lg"
                  >
                    <LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gallery View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Workflow view"
                    aria-pressed
                    className="size-8 rounded-lg bg-muted"
                  >
                    <GitBranch className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Workflow View</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
