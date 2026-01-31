"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { ImagePlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function CanvasViewport() {
  const {
    selectedImage,
    isGenerating,
    thinkingSteps,
    zoom,
    viewMode,
    inputImages,
  } = useCreate();

  const hasContent = selectedImage || isGenerating || inputImages.length > 0;

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Checkered transparency pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #333 25%, transparent 25%),
            linear-gradient(-45deg, #333 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #333 75%),
            linear-gradient(-45deg, transparent 75%, #333 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      />

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <GeneratingState key="generating" />
        ) : selectedImage ? (
          <ImageDisplay key={selectedImage.id} zoom={zoom} />
        ) : (
          <EmptyState key="empty" hasInputImages={inputImages.length > 0} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ hasInputImages }: { hasInputImages: boolean }) {
  const { addImages } = useCreate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) addImages(files);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addImages(files);
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
          "flex flex-col items-center justify-center p-12 rounded-3xl",
          "border-2 border-dashed border-zinc-700 hover:border-zinc-600",
          "transition-colors cursor-pointer group"
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
          <div className="size-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {hasInputImages ? (
              <Sparkles className="size-10 text-zinc-300" strokeWidth={1.5} />
            ) : (
              <ImagePlus className="size-10 text-zinc-300" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <h3 className="text-xl font-semibold text-zinc-200 mb-2">
          {hasInputImages ? "Ready to Generate" : "Create Something Amazing"}
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs">
          {hasInputImages
            ? "Enter a prompt below and click Generate"
            : "Drop images here or click to upload, then describe what you want to create"}
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
          <span className="px-2 py-1 rounded bg-zinc-800">Up to 14 images</span>
          <span className="px-2 py-1 rounded bg-zinc-800">4K resolution</span>
          <span className="px-2 py-1 rounded bg-zinc-800">Text rendering</span>
        </div>
      </div>
    </motion.div>
  );
}

function GeneratingState() {
  const { thinkingSteps, settings, cancelGeneration } = useCreate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 flex flex-col items-center justify-center text-center p-8"
    >


      {/* Spinner */}
      <div className="size-24 rounded-full border border-zinc-900 border-t-zinc-100 animate-spin mb-8 mx-auto" />

      {settings.thinking && thinkingSteps.length > 0 && (
        <div className="space-y-2 mb-6">
          {thinkingSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                step.completed ? "text-zinc-400" : "text-zinc-600"
              )}
            >
              <div
                className={cn(
                  "size-2 rounded-full",
                  step.completed ? "bg-green-500" : "bg-zinc-600 animate-pulse"
                )}
              />
              <span>{step.text}</span>
              {step.completed && <span className="text-green-500">✓</span>}
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-sm text-zinc-500 mb-4">Generating your image…</p>

      <button
        onClick={cancelGeneration}
        className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        Cancel
      </button>
    </motion.div>
  );
}

function ImageDisplay({ zoom }: { zoom: number }) {
  const { selectedImage } = useCreate();

  if (!selectedImage) return null;

  const scale = zoom / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative z-10 flex items-center justify-center p-8"
      style={{ transform: `scale(${scale})` }}
    >
      <div className="relative rounded-lg overflow-hidden border border-zinc-800">
        <Image
          src={selectedImage.url}
          alt={selectedImage.prompt || "Generated image"}
          width={selectedImage.settings.resolution === "4096" ? 1024 : parseInt(selectedImage.settings.resolution)}
          height={selectedImage.settings.resolution === "4096" ? 1024 : parseInt(selectedImage.settings.resolution)}
          className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
          unoptimized
        />
      </div>

      {/* Image info overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
        {selectedImage.settings.resolution}px • {selectedImage.settings.aspectRatio} • {selectedImage.mode}
      </div>
    </motion.div>
  );
}
