"use client";

import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { motion, AnimatePresence } from "motion/react";

export function ThinkingDisplay() {
  const { isGenerating, thinkingSteps } = useCreate();

  if (!isGenerating || thinkingSteps.length === 0) return null;

  const completedCount = thinkingSteps.filter(s => s.completed).length;
  const progress = (completedCount / thinkingSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="px-4 py-3 rounded-xl bg-background border border-border shadow-sm min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              Thinking...
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {completedCount}/{thinkingSteps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Current step */}
          <div className="mt-2">
            {thinkingSteps.map((step, index) => {
              const isActive = !step.completed && (index === 0 || thinkingSteps[index - 1].completed);
              if (!isActive && !step.completed) return null;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step.completed ? 0.5 : 1 }}
                  className={cn(
                    "text-xs font-mono flex items-center gap-2",
                    step.completed ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  <span className={cn(
                    "size-1.5 rounded-full",
                    step.completed ? "bg-muted-foreground" : "bg-foreground animate-pulse"
                  )} />
                  {step.text}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
