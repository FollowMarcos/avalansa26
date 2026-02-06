"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import { Eye, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  complete: "bg-emerald-500",
  generating: "bg-amber-500 animate-pulse",
  empty: "bg-muted-foreground/30",
};

export function ViewPanel() {
  const { views, activeViewId, setActiveView } = useChar();
  const [open, setOpen] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();

  const completeCount = views.filter((v) => v.status === "complete").length;

  return (
    <div className="absolute top-4 left-4 z-20">
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
                <Eye className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-mono font-medium">Views</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {completeCount}/{views.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOpen(false)}
                aria-label="Collapse views panel"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            {/* View list */}
            <ScrollArea className="max-h-[240px]">
              <div className="p-2 space-y-1">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      activeViewId === view.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                    aria-pressed={activeViewId === view.id}
                  >
                    {/* Status dot */}
                    <span
                      className={cn("size-2 rounded-full shrink-0", STATUS_COLORS[view.status])}
                      aria-hidden="true"
                    />
                    {/* Thumbnail */}
                    <span
                      className="size-7 rounded shrink-0 border border-border/50"
                      style={{
                        backgroundColor:
                          view.status === "complete" ? view.imageColor : "transparent",
                      }}
                    />
                    {/* Label & status */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono truncate">{view.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono capitalize">
                        {view.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Add view */}
            <div className="p-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs font-mono gap-1.5">
                <Plus className="size-3" />
                Add Custom View
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
              aria-label="Open views panel"
            >
              <Eye className="size-3.5" />
              Views
              <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                {completeCount}/{views.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
