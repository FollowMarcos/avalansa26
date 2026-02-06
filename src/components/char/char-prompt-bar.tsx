"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import {
  Sparkles,
  ChevronDown,
  Eye,
  Shirt,
  Smile,
  Zap,
  Crown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const VIEW_OPTIONS = [
  { value: "front", label: "Front View" },
  { value: "side", label: "Side View" },
  { value: "back", label: "Back View" },
  { value: "three-quarter", label: "3/4 View" },
  { value: "top-down", label: "Top-Down" },
  { value: "dynamic", label: "Dynamic Pose" },
];

const EXPRESSION_OPTIONS = [
  { value: "neutral", label: "Neutral", emoji: "\u{1F610}" },
  { value: "determined", label: "Determined", emoji: "\u{1F624}" },
  { value: "happy", label: "Happy", emoji: "\u{1F60A}" },
  { value: "angry", label: "Angry", emoji: "\u{1F621}" },
  { value: "sad", label: "Sad", emoji: "\u{1F622}" },
  { value: "surprised", label: "Surprised", emoji: "\u{1F632}" },
];

export function CharPromptBar() {
  const { name, basePrompt, outfits, settings, setQuality } = useChar();
  const [additionalPrompt, setAdditionalPrompt] = React.useState("");
  const [selectedView, setSelectedView] = React.useState("front");
  const [selectedExpression, setSelectedExpression] = React.useState("neutral");
  const activeOutfit = outfits.find((o) => o.isActive);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4">
      {/* Shadow layers */}
      <div className="absolute inset-0 translate-y-4 blur-2xl bg-background/40 rounded-2xl" />
      <div className="absolute inset-0 translate-y-2 blur-xl bg-background/60 rounded-2xl" />

      <div className="relative bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Character brief row */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
          <User className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-xs font-mono font-medium">{name}</span>
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            Base: {basePrompt}
          </span>
        </div>

        {/* Prompt textarea */}
        <div className="px-4 py-3">
          <Textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="Add view-specific details... (e.g., 'dramatic lighting, wind blowing hair')"
            className="min-h-[60px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
            aria-label="Additional prompt for this view"
          />
        </div>

        {/* Settings row */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/50">
          {/* View target */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs font-mono gap-1.5">
                <Eye className="size-3" aria-hidden="true" />
                {VIEW_OPTIONS.find((v) => v.value === selectedView)?.label}
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedView(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
                    selectedView === option.value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Outfit selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs font-mono gap-1.5">
                <Shirt className="size-3" aria-hidden="true" />
                {activeOutfit?.name ?? "No Outfit"}
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
              {outfits.map((outfit) => (
                <button
                  key={outfit.id}
                  className={cn(
                    "w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
                    outfit.isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: outfit.color }}
                  />
                  {outfit.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Expression */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs font-mono gap-1.5">
                <Smile className="size-3" aria-hidden="true" />
                {EXPRESSION_OPTIONS.find((e) => e.value === selectedExpression)?.emoji}{" "}
                {EXPRESSION_OPTIONS.find((e) => e.value === selectedExpression)?.label}
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              {EXPRESSION_OPTIONS.map((expr) => (
                <button
                  key={expr.value}
                  onClick={() => setSelectedExpression(expr.value)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
                    selectedExpression === expr.value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {expr.emoji} {expr.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quality toggle */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
            <button
              onClick={() => setQuality("draft")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors",
                settings.quality === "draft"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={settings.quality === "draft"}
            >
              <Zap className="size-2.5" />
              Draft
            </button>
            <button
              onClick={() => setQuality("final")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors",
                settings.quality === "final"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={settings.quality === "final"}
            >
              <Crown className="size-2.5" />
              Final
            </button>
          </div>

          {/* Generate button */}
          <Button size="sm" className="h-7 text-xs font-mono gap-1.5">
            <Sparkles className="size-3" aria-hidden="true" />
            Generate
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="px-4 py-1 border-t border-border/30 bg-muted/20">
          <p className="text-[10px] text-muted-foreground font-mono text-center">
            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono mr-1">
              Ctrl+Enter
            </Badge>
            to generate
          </p>
        </div>
      </div>
    </div>
  );
}
