"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate, type GenerationSlot } from "./create-context";
import { X, Sparkles, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export function GenerationProgress() {
  const {
    isGenerating,
    generationSlots,
    cancelGeneration,
    selectGeneratedImage,
  } = useCreate();

  // Calculate counts first (before any conditional returns to satisfy React hooks rules)
  const successCount = generationSlots.filter((s) => s.status === "success").length;
  const failedCount = generationSlots.filter((s) => s.status === "failed").length;
  const generatingCount = generationSlots.filter((s) => s.status === "generating").length;

  const statusText = React.useMemo(() => {
    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} success`);
    if (failedCount > 0) parts.push(`${failedCount} failed`);
    return parts.join(", ") || "Starting…";
  }, [successCount, failedCount]);

  // Don't show if not generating and no recent results
  const hasActiveSlots = generationSlots.some(
    (slot) => slot.status !== "idle"
  );

  if (!isGenerating && !hasActiveSlots) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
          {/* Generation Slots */}
          <div className="flex items-center gap-2">
            {generationSlots.map((slot, index) => (
              <GenerationSlotItem
                key={slot.id || index}
                slot={slot}
                index={index}
                onSelect={() => {
                  if (slot.status === "success" && slot.imageUrl) {
                    selectGeneratedImage(slot.id);
                  }
                }}
              />
            ))}
          </div>

          {/* Status Text */}
          <div className="flex flex-col min-w-[100px]">
            <span className="text-sm font-medium text-white">
              {generatingCount > 0 ? "Generating..." : "Complete"}
            </span>
            <span className="text-xs text-zinc-400">{statusText}</span>
          </div>

          {/* Cancel/Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelGeneration}
            aria-label={isGenerating ? "Cancel generation" : "Close"}
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Select Image Button - show when there are successful generations */}
        {successCount > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-2"
          >
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6"
              onClick={() => {
                const firstSuccess = generationSlots.find(
                  (s) => s.status === "success"
                );
                if (firstSuccess) {
                  selectGeneratedImage(firstSuccess.id);
                }
              }}
            >
              Select Image
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface GenerationSlotItemProps {
  slot: GenerationSlot;
  index: number;
  onSelect: () => void;
}

function GenerationSlotItem({ slot, index, onSelect }: GenerationSlotItemProps) {
  const getBorderColor = () => {
    switch (slot.status) {
      case "success":
        return "border-green-500";
      case "failed":
        return "border-red-500";
      case "generating":
        return "border-orange-500";
      default:
        return "border-zinc-700";
    }
  };

  const getBackgroundColor = () => {
    switch (slot.status) {
      case "success":
        return "bg-green-500/10";
      case "failed":
        return "bg-red-500/10";
      case "generating":
        return "bg-orange-500/10";
      default:
        return "bg-zinc-800/50";
    }
  };

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      disabled={slot.status !== "success"}
      aria-label={
        slot.status === "success"
          ? `Select generated image ${index + 1}`
          : slot.status === "failed"
            ? `Generation ${index + 1} failed`
            : slot.status === "generating"
              ? `Generating image ${index + 1}`
              : `Slot ${index + 1} idle`
      }
      className={cn(
        "relative size-12 rounded-full border-2 overflow-hidden transition-all",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-zinc-900",
        getBorderColor(),
        getBackgroundColor(),
        slot.status === "success" && "cursor-pointer hover:scale-105",
        slot.status !== "success" && "cursor-default"
      )}
    >
      {/* Image Preview - using img for dynamic external URLs */}
      {slot.status === "success" && slot.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.imageUrl}
          alt={`Generated image ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Generating State */}
      {slot.status === "generating" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="size-5 text-orange-500" aria-hidden="true" />
          </motion.div>
        </div>
      )}

      {/* Failed State */}
      {slot.status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertCircle className="size-5 text-red-500" aria-hidden="true" />
        </div>
      )}

      {/* Idle State */}
      {slot.status === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-2 rounded-full bg-zinc-600" aria-hidden="true" />
        </div>
      )}

      {/* Success Indicator */}
      {slot.status === "success" && (
        <div className="absolute bottom-0 right-0 size-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-zinc-900">
          <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden="true" />
        </div>
      )}
    </motion.button>
  );
}
