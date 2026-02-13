"use client";

import * as React from "react";
import { useCreate } from "./create-context";
import { GenerationGallery } from "./generation-gallery";

interface CanvasViewportProps {
  /** When in workflow mode, render the workflow canvas instead */
  workflowCanvas?: React.ReactNode;
}

export function CanvasViewport({ workflowCanvas }: CanvasViewportProps) {
  const { viewMode } = useCreate();

  // Workflow mode: render the workflow canvas
  if (viewMode === "workflow" && workflowCanvas) {
    return (
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-muted/30">
        <div className="absolute inset-0">{workflowCanvas}</div>
      </div>
    );
  }

  // Gallery mode: render the gallery as the primary view
  return <GenerationGallery />;
}
