"use client";

import { useCreate } from "./create-context";
import { X, Sparkles } from "lucide-react";
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
    activeGenerations,
    cancelGeneration,
  } = useCreate();

  // Don't show if not generating and no active generations
  if (!isGenerating && activeGenerations === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          className="absolute bottom-36 right-4 z-30"
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-lg">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="size-4 text-foreground" aria-hidden="true" />
              </motion.div>
              <span className="text-sm font-medium">
                Generating {activeGenerations} image{activeGenerations !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cancel button */}
            {isGenerating && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelGeneration}
                    aria-label="Cancel generation"
                    className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Cancel
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
