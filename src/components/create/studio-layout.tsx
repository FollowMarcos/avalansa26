"use client";

import * as React from "react";
import { useCreate } from "./create-context";
import { CanvasViewport } from "./canvas-viewport";
import { SettingsPanel } from "./settings-panel";
import { PromptComposer } from "./prompt-composer";
import { QuickToolbar } from "./quick-toolbar";
import { ThinkingDisplay } from "./thinking-display";
import { GenerationGallery } from "./generation-gallery";
import { motion } from "motion/react";

export function StudioLayout() {
  const { addReferenceImages } = useCreate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-8rem)] flex flex-col bg-background text-foreground overflow-hidden"
    >
      {/* Grain texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-noise opacity-[0.03]" />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center - Canvas/Gallery */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          {/* Quick Toolbar */}
          <QuickToolbar />

          {/* Thinking Display */}
          <ThinkingDisplay />

          {/* Canvas Viewport */}
          <CanvasViewport />

          {/* Gallery View (overlay when active) */}
          <GenerationGallery />

          {/* Prompt Composer */}
          <PromptComposer />
        </div>

        {/* Right Sidebar - Settings */}
        <SettingsPanel />
      </div>

      {/* Drag overlay for file uploads */}
      <DragOverlay onDrop={addReferenceImages} />
    </motion.div>
  );
}

function DragOverlay({ onDrop }: { onDrop: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        onDrop(files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDrop]);

  if (!isDragging) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/95"
    >
      <div className="text-center">
        <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 font-mono">
          Drop images here
        </h3>
        <p className="text-sm text-muted-foreground">
          Add up to 14 reference images
        </p>
      </div>
    </motion.div>
  );
}
