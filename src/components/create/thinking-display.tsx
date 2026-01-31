"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Check } from "lucide-react";

export function ThinkingDisplay() {
  const { isGenerating, thinkingSteps, settings } = useCreate();

  if (!isGenerating || !settings.thinking || thinkingSteps.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
            <div className="size-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Brain className="size-4 text-zinc-300" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Visual Reasoning</h4>
              <p className="text-xs text-zinc-500">AI is thinking…</p>
            </div>
          </div>

          <div className="space-y-2">
            {thinkingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  step.completed ? "text-zinc-300" : "text-zinc-500"
                )}
              >
                <div
                  className={cn(
                    "size-4 rounded-full flex items-center justify-center flex-shrink-0",
                    step.completed
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-800 border border-zinc-700"
                  )}
                >
                  {step.completed ? (
                    <Check className="size-2.5" />
                  ) : (
                    <div className="size-1.5 rounded-full bg-zinc-600 animate-pulse" />
                  )}
                </div>
                <span className={cn(step.completed && "line-through opacity-60")}>
                  {step.text}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-zinc-100"
                initial={{ width: "0%" }}
                animate={{
                  width: `${(thinkingSteps.filter(s => s.completed).length / thinkingSteps.length) * 100}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
