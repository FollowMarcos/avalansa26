"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { ImagePlus, Sparkles, Type, Images } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FlowCanvas } from "./flow-canvas";

export function CanvasViewport() {
  const {
    isGenerating,
    referenceImages,
    nodes,
  } = useCreate();

  const hasNodes = nodes.length > 0;

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-muted/30">
      {/* Show FlowCanvas when we have nodes (even during generation) */}
      {hasNodes && (
        <div className="absolute inset-0">
          <FlowCanvas />
        </div>
      )}

      {/* Overlay for generating state or empty state */}
      <AnimatePresence mode="wait">
        {isGenerating && !hasNodes ? (
          <GeneratingState key="generating" />
        ) : isGenerating && hasNodes ? (
          <GeneratingOverlay key="generating-overlay" />
        ) : !hasNodes ? (
          <EmptyState key="empty" hasReferenceImages={referenceImages.length > 0} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GeneratingOverlay() {
  const { thinkingSteps, cancelGeneration } = useCreate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg">
        {/* Spinner */}
        <div className="size-5 rounded-full border-2 border-border border-t-foreground animate-spin flex-shrink-0" />

        {/* Current step */}
        <div className="flex flex-col">
          {thinkingSteps.length > 0 && (
            <span className="text-sm font-mono text-foreground">
              {thinkingSteps.find(s => !s.completed)?.text || "Finalizing..."}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            Generating new image...
          </span>
        </div>

        {/* Cancel button */}
        <button
          onClick={cancelGeneration}
          className="ml-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono rounded hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ hasReferenceImages }: { hasReferenceImages: boolean }) {
  const { addReferenceImages } = useCreate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) addReferenceImages(files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addReferenceImages(files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative z-10 flex flex-col items-center justify-center text-center p-8"
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center p-12 rounded-2xl",
          "border-2 border-dashed border-border hover:border-muted-foreground",
          "transition-colors cursor-pointer group bg-background/50"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="relative mb-6">
          <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
            {hasReferenceImages ? (
              <Sparkles className="size-10 text-foreground" strokeWidth={1.5} />
            ) : (
              <ImagePlus className="size-10 text-foreground" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2 font-mono">
          {hasReferenceImages ? "Ready to Generate" : "Create Something"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {hasReferenceImages
            ? "Enter a prompt below to generate"
            : "Drop images here or click to add references"}
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded bg-muted border border-border flex items-center gap-1">
            <Images className="size-3" />
            Up to 14 refs
          </span>
          <span className="px-2 py-1 rounded bg-muted border border-border">
            Native 4K
          </span>
          <span className="px-2 py-1 rounded bg-muted border border-border flex items-center gap-1">
            <Type className="size-3" />
            94% text accuracy
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function GeneratingState() {
  const { thinkingSteps, cancelGeneration } = useCreate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 flex flex-col items-center justify-center text-center p-8"
    >
      {/* Spinner */}
      <div className="size-20 rounded-full border-2 border-border border-t-foreground animate-spin mb-8 mx-auto" />

      {thinkingSteps.length > 0 && (
        <div className="space-y-2 mb-6 max-w-sm">
          {thinkingSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-2 text-sm font-mono",
                step.completed ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "size-2 rounded-full flex-shrink-0",
                  step.completed ? "bg-foreground" : "bg-muted-foreground animate-pulse"
                )}
              />
              <span className="text-left">{step.text}</span>
              {step.completed && <span className="text-foreground ml-auto">+</span>}
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-4 font-mono">
        Generating with Nano Banana Pro...
      </p>

      <button
        onClick={cancelGeneration}
        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        Cancel
      </button>
    </motion.div>
  );
}

