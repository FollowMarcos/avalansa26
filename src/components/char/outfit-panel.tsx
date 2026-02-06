"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import { Shirt, ChevronDown, Plus, Check } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OutfitPanel() {
  const { outfits, toggleOutfit } = useChar();
  const [open, setOpen] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute top-[300px] left-4 z-20">
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
                <Shirt className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-mono font-medium">Outfits</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {outfits.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOpen(false)}
                aria-label="Collapse outfits panel"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            {/* Outfit list */}
            <ScrollArea className="max-h-[200px]">
              <div className="p-2 space-y-1">
                {outfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => toggleOutfit(outfit.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      outfit.isActive
                        ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
                        : "hover:bg-muted"
                    )}
                    aria-pressed={outfit.isActive}
                  >
                    {/* Color swatch */}
                    <span
                      className="size-5 rounded-md shrink-0 border border-border/50"
                      style={{ backgroundColor: outfit.color }}
                    />
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono truncate">{outfit.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {outfit.description}
                      </p>
                    </div>
                    {/* Active indicator */}
                    {outfit.isActive && (
                      <Check className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Add outfit */}
            <div className="p-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs font-mono gap-1.5">
                <Plus className="size-3" />
                Add Outfit
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
              aria-label="Open outfits panel"
            >
              <Shirt className="size-3.5" />
              Outfits
              <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                {outfits.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
