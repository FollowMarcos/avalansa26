"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import { Palette, ChevronDown, Lock, Unlock, Pipette } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PALETTE_LABELS = ["Skin", "Skin Shadow", "Hair", "Hair Highlight", "Primary", "Secondary", "Accent", "Metal"];

export function ColorPalettePanel() {
  const { colorPalette, paletteLocked, togglePaletteLock } = useChar();
  const [open, setOpen] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute bottom-24 left-4 z-20">
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div
              key="panel"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: -20 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-60 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Palette className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs font-mono font-medium">Color Palette</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("size-6", paletteLocked && "text-primary")}
                        onClick={togglePaletteLock}
                        aria-label={paletteLocked ? "Unlock palette" : "Lock palette"}
                        aria-pressed={paletteLocked}
                      >
                        {paletteLocked ? (
                          <Lock className="size-3" />
                        ) : (
                          <Unlock className="size-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {paletteLocked ? "Palette locked (consistent across views)" : "Lock palette"}
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setOpen(false)}
                    aria-label="Collapse palette panel"
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Color swatches */}
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  {colorPalette.map((color, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "flex flex-col items-center gap-1 group",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg p-1"
                          )}
                          aria-label={`${PALETTE_LABELS[i] ?? `Color ${i + 1}`}: ${color}`}
                        >
                          <span
                            className="size-8 rounded-lg border-2 border-border/50 transition-transform group-hover:scale-110 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[8px] text-muted-foreground font-mono truncate w-full text-center">
                            {PALETTE_LABELS[i] ?? `C${i + 1}`}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="font-mono text-xs">
                        {color}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {paletteLocked && (
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 bg-primary/5 rounded-md border border-primary/10">
                    <Lock className="size-2.5 text-primary shrink-0" aria-hidden="true" />
                    <p className="text-[9px] text-primary/80 font-mono">
                      Locked - colors stay consistent across views
                    </p>
                  </div>
                )}
              </div>

              {/* Extract button */}
              <div className="p-2 border-t border-border/50">
                <Button variant="outline" size="sm" className="w-full h-7 text-xs font-mono gap-1.5">
                  <Pipette className="size-3" />
                  Extract from Sheet
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="h-8 text-xs font-mono gap-1.5 bg-background/95 backdrop-blur-xl shadow-md"
                aria-label="Open color palette panel"
              >
                <Palette className="size-3.5" />
                Palette
                <div className="flex -space-x-1">
                  {colorPalette.slice(0, 4).map((color, i) => (
                    <span
                      key={i}
                      className="size-3 rounded-full border border-background"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
