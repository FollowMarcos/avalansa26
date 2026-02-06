"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import type { ViewSlot, Expression } from "./char-context";
import { Plus, Sparkles, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";

function ViewSlotCard({
  slot,
  isActive,
  onClick,
}: {
  slot: ViewSlot;
  isActive: boolean;
  onClick: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 transition-colors overflow-hidden",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive
          ? "border-primary ring-2 ring-primary/20"
          : slot.status === "empty"
            ? "border-dashed border-border hover:border-foreground/30"
            : "border-border hover:border-foreground/20"
      )}
      style={{ aspectRatio: "3/4" }}
      aria-label={`${slot.label} view - ${slot.status}`}
      aria-pressed={isActive}
    >
      {/* Label badge */}
      <Badge
        variant="secondary"
        className="absolute top-2 left-2 z-10 text-[10px] font-mono"
      >
        {slot.label}
      </Badge>

      {slot.status === "complete" ? (
        /* Mock generated image */
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: slot.imageColor }}
        >
          <User className="size-16 text-white/30" aria-hidden="true" />
          <span className="absolute bottom-3 text-white/60 text-xs font-mono">
            {slot.label}
          </span>
        </div>
      ) : slot.status === "generating" ? (
        /* Generating state */
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Sparkles className="size-8 animate-pulse text-primary" aria-hidden="true" />
          <span className="text-xs font-mono">Generating...</span>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Plus className="size-8" aria-hidden="true" />
          <span className="text-xs font-mono">Generate</span>
        </div>
      )}
    </motion.button>
  );
}

function ExpressionSlotCard({
  expression,
  isActive,
  onClick,
}: {
  expression: Expression;
  isActive: boolean;
  onClick: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 transition-colors overflow-hidden",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isActive
          ? "border-primary ring-2 ring-primary/20"
          : expression.status === "empty"
            ? "border-dashed border-border hover:border-foreground/30"
            : "border-border hover:border-foreground/20"
      )}
      style={{ aspectRatio: "1/1" }}
      aria-label={`${expression.name} expression - ${expression.status}`}
    >
      <Badge
        variant="secondary"
        className="absolute top-2 left-2 z-10 text-[10px] font-mono"
      >
        {expression.emoji} {expression.name}
      </Badge>

      {expression.status === "complete" ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: expression.imageColor }}
        >
          <span className="text-4xl">{expression.emoji}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Plus className="size-6" aria-hidden="true" />
          <span className="text-[10px] font-mono">Generate</span>
        </div>
      )}
    </motion.button>
  );
}

export function CharacterSheet() {
  const { activeTemplate, views, expressions, outfits, activeViewId, setActiveView, name } = useChar();

  return (
    <div className="flex-1 relative overflow-auto">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 h-full flex items-center justify-center p-8">
        {activeTemplate === "turnaround" && (
          <div className="w-full max-w-5xl">
            {/* Character name plate */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono tracking-tight">{name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                CHARACTER TURNAROUND SHEET
              </p>
            </div>
            {/* 2x3 grid */}
            <div className="grid grid-cols-3 gap-4">
              {views.map((slot) => (
                <ViewSlotCard
                  key={slot.id}
                  slot={slot}
                  isActive={activeViewId === slot.id}
                  onClick={() => setActiveView(slot.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTemplate === "expression" && (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono tracking-tight">{name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                EXPRESSION SHEET
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {expressions.map((expr) => (
                <ExpressionSlotCard
                  key={expr.id}
                  expression={expr}
                  isActive={activeViewId === expr.id}
                  onClick={() => setActiveView(expr.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTemplate === "outfit" && (
          <div className="w-full max-w-6xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono tracking-tight">{name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                OUTFIT LINEUP
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {outfits.map((outfit) => (
                <motion.div
                  key={outfit.id}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 overflow-hidden transition-colors",
                    outfit.isActive
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-foreground/20"
                  )}
                  style={{ aspectRatio: "3/4" }}
                >
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 z-10 text-[10px] font-mono"
                  >
                    {outfit.name}
                  </Badge>
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: outfit.color }}
                  >
                    <User className="size-16 text-white/30" aria-hidden="true" />
                  </div>
                  <p className="absolute bottom-3 text-white/70 text-[10px] font-mono text-center px-2 line-clamp-2">
                    {outfit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTemplate === "action" && (
          <div className="w-full max-w-5xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono tracking-tight">{name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ACTION POSES
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "a1", label: "Combat Stance", color: "#dc2626", status: "complete" as const },
                { id: "a2", label: "Drawing Bow", color: "#ea580c", status: "complete" as const },
                { id: "a3", label: "Casting Spell", color: "#7c3aed", status: "complete" as const },
                { id: "a4", label: "Leaping", color: "#0891b2", status: "empty" as const },
                { id: "a5", label: "Crouching", color: "#e0e7ff", status: "empty" as const },
                { id: "a6", label: "Running", color: "#e0e7ff", status: "empty" as const },
              ].map((pose) => (
                <ViewSlotCard
                  key={pose.id}
                  slot={{ ...pose, type: "dynamic", imageColor: pose.color }}
                  isActive={activeViewId === pose.id}
                  onClick={() => setActiveView(pose.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
