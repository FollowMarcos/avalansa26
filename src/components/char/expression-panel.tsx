"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import { Smile, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ExpressionPanel() {
  const { expressions, activeViewId, setActiveView } = useChar();
  const [open, setOpen] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();

  const completeCount = expressions.filter((e) => e.status === "complete").length;

  return (
    <div className="absolute top-4 right-4 z-20">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="w-64 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Smile className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-mono font-medium">Expressions</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {completeCount}/{expressions.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOpen(false)}
                aria-label="Collapse expressions panel"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            {/* Expression grid */}
            <div className="p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {expressions.map((expr) => (
                  <button
                    key={expr.id}
                    onClick={() => setActiveView(expr.id)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border transition-colors aspect-square",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      activeViewId === expr.id
                        ? "border-primary ring-1 ring-primary/20"
                        : expr.status === "complete"
                          ? "border-border hover:border-foreground/20"
                          : "border-dashed border-border hover:border-foreground/30"
                    )}
                    aria-label={`${expr.name} - ${expr.status}`}
                    aria-pressed={activeViewId === expr.id}
                  >
                    {expr.status === "complete" ? (
                      <div
                        className="w-full h-full rounded-lg flex flex-col items-center justify-center"
                        style={{ backgroundColor: expr.imageColor }}
                      >
                        <span className="text-lg">{expr.emoji}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                        <span className="text-sm">{expr.emoji}</span>
                        <Plus className="size-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Labels below */}
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {expressions.map((expr) => (
                  <p key={expr.id} className="text-[9px] text-muted-foreground font-mono text-center truncate">
                    {expr.name}
                  </p>
                ))}
              </div>
            </div>

            {/* Add expression */}
            <div className="p-2 border-t border-border/50">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs font-mono gap-1.5">
                <Plus className="size-3" />
                Add Expression
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
              aria-label="Open expressions panel"
            >
              <Smile className="size-3.5" />
              Expressions
              <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                {completeCount}/{expressions.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
