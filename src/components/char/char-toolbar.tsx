"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import type { TemplateType } from "./char-context";
import {
  RotateCcw,
  Smile,
  Shirt,
  Swords,
  Download,
  Share2,
  Settings,
  ChevronUp,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TEMPLATES: { type: TemplateType; label: string; icon: React.ReactNode }[] = [
  { type: "turnaround", label: "Turnaround", icon: <RotateCcw className="size-3.5" /> },
  { type: "expression", label: "Expressions", icon: <Smile className="size-3.5" /> },
  { type: "outfit", label: "Outfits", icon: <Shirt className="size-3.5" /> },
  { type: "action", label: "Action Poses", icon: <Swords className="size-3.5" /> },
];

export function CharToolbar() {
  const { name, activeTemplate, setActiveTemplate } = useChar();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="relative z-10 border-b border-border bg-background/95 backdrop-blur-sm"
        style={{
          display: "grid",
          gridTemplateRows: collapsed ? "0fr" : "1fr",
          transition: "grid-template-rows 0.2s ease",
        }}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-2">
            {/* Left: Character name */}
            <div className="flex items-center gap-2 min-w-0">
              <Pencil className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-sm font-mono font-medium truncate">{name}</span>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                v1.0
              </Badge>
            </div>

            {/* Center: Template selector */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setActiveTemplate(t.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    activeTemplate === t.type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={activeTemplate === t.type}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Export sheet">
                    <Download className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Sheet</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Share">
                    <Share2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Settings">
                    <Settings className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-background border border-border rounded-full p-0.5 hover:bg-muted transition-colors"
          aria-label={collapsed ? "Expand toolbar" : "Collapse toolbar"}
        >
          {collapsed ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronUp className="size-3" />
          )}
        </button>
      </div>
    </TooltipProvider>
  );
}
