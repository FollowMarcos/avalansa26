"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate, type GenerationSlot } from "./create-context";
import { X, Sparkles, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GenerationProgress() {
  const {
    isGenerating,
    generationSlots,
    cancelGeneration,
    selectGeneratedImage,
    clearGenerationSlots,
  } = useCreate();

  // Calculate counts first (before any conditional returns to satisfy React hooks rules)
  const successCount = generationSlots.filter((s) => s.status === "success").length;
  const failedCount = generationSlots.filter((s) => s.status === "failed").length;
  const generatingCount = generationSlots.filter((s) => s.status === "generating").length;
  const idleCount = generationSlots.filter((s) => s.status === "idle").length;

  // Get error message from first failed slot
  const errorMessage = React.useMemo(() => {
    const failedSlot = generationSlots.find((s) => s.status === "failed" && s.error);
    return failedSlot?.error || null;
  }, [generationSlots]);

  // Don't show if not generating and no recent results
  const hasActiveSlots = generationSlots.some(
    (slot) => slot.status !== "idle"
  );

  if (!isGenerating && !hasActiveSlots) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          className="absolute bottom-36 right-4 z-30"
        >
          <div className="flex flex-col gap-2 p-2 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg">
            {/* Header with status and close */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-muted-foreground">
                {generatingCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
                    Generating
                  </span>
                ) : failedCount > 0 && successCount === 0 ? (
                  <span className="text-destructive">Failed</span>
                ) : (
                  <span>
                    {successCount}/{4 - idleCount} complete
                  </span>
                )}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isGenerating ? cancelGeneration : clearGenerationSlots}
                    aria-label={isGenerating ? "Cancel generation" : "Dismiss"}
                    className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isGenerating ? "Cancel" : "Dismiss"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Error Message - Show when there are failures */}
            {failedCount > 0 && errorMessage && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="px-1 max-w-[280px]"
              >
                <p className="text-[10px] text-destructive leading-tight line-clamp-2">
                  {errorMessage}
                </p>
              </motion.div>
            )}

            {/* Generation Slots - Single Row */}
            <div className="flex items-center gap-1.5">
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
          </div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}

interface GenerationSlotItemProps {
  slot: GenerationSlot;
  index: number;
  onSelect: () => void;
}

function GenerationSlotItem({ slot, index, onSelect }: GenerationSlotItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={onSelect}
          disabled={slot.status !== "success"}
          aria-label={
            slot.status === "success"
              ? `Select generated image ${index + 1}`
              : slot.status === "failed"
                ? `Generation ${index + 1} failed`
                : slot.status === "generating"
                  ? `Generating image ${index + 1}`
                  : `Slot ${index + 1} available`
          }
          className={cn(
            "relative size-12 rounded-lg border overflow-hidden transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            slot.status === "idle" && "border-dashed border-border bg-muted/30",
            slot.status === "generating" && "border-foreground/30 bg-muted/50",
            slot.status === "success" && "border-foreground/50 cursor-pointer hover:border-foreground hover:scale-[1.02]",
            slot.status === "failed" && "border-destructive/50 bg-destructive/10"
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
                <Sparkles className="size-4 text-foreground" aria-hidden="true" />
              </motion.div>
            </div>
          )}

          {/* Failed State */}
          {slot.status === "failed" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
            </div>
          )}

          {/* Idle State */}
          {slot.status === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-mono text-muted-foreground">{index + 1}</span>
            </div>
          )}

          {/* Success Indicator */}
          {slot.status === "success" && (
            <div className="absolute bottom-0.5 right-0.5 size-4 rounded-full bg-foreground flex items-center justify-center">
              <Check className="size-2.5 text-background" strokeWidth={3} aria-hidden="true" />
            </div>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {slot.status === "success" && "Click to select"}
        {slot.status === "failed" && (slot.error || "Failed")}
        {slot.status === "generating" && "Generating…"}
        {slot.status === "idle" && "Available"}
      </TooltipContent>
    </Tooltip>
  );
}
