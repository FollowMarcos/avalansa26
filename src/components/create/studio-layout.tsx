"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { CanvasViewport } from "./canvas-viewport";
import { ToolSidebar } from "./tool-sidebar";
import { SettingsPanel } from "./settings-panel";
import { PromptComposer } from "./prompt-composer";
import { QuickToolbar } from "./quick-toolbar";
import { ThinkingDisplay } from "./thinking-display";
import { GenerationGallery } from "./generation-gallery";
import { motion } from "motion/react";

export function StudioLayout() {
  const { viewMode } = useCreate();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        // Undo - handled in context
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        // Redo - handled in context
      }
      // Ctrl/Cmd + G for generate
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        // Generate - would need to be triggered from context
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-screen flex flex-col bg-zinc-950 overflow-hidden"
    >
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <ToolSidebar />

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
      <DragOverlay />
    </motion.div>
  );
}

function DragOverlay() {
  const [isDragging, setIsDragging] = React.useState(false);
  const { addImages } = useCreate();

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
        addImages(files);
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
  }, [addImages]);

  if (!isDragging) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-white"
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
        <h3 className="text-xl font-semibold text-white mb-2">Drop images here</h3>
        <p className="text-sm text-zinc-400">Add up to 14 reference images</p>
      </div>
    </motion.div>
  );
}
