"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate, GenerationMode } from "./create-context";
import { VerticalSlider } from "./vertical-slider";
import {
  Sparkles,
  Camera,
  Maximize,
  Eraser,
  Expand,
  Type,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolConfig {
  id: GenerationMode;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}

const tools: ToolConfig[] = [
  {
    id: "text2img",
    icon: Sparkles,
    label: "Magic Create",
    description: "Nano-fast high-fidelity image generation",
    color: "from-zinc-100 to-zinc-400",
  },
  {
    id: "img2img",
    icon: Camera,
    label: "Re-imagine",
    description: "Create variations or transformations of images",
    color: "from-zinc-200 to-zinc-500",
  },
  {
    id: "text-fidelity",
    icon: Type,
    label: "Perfect Text",
    description: "Specialized high-precision text rendering",
    color: "from-zinc-300 to-zinc-600",
  },
  {
    id: "upscale",
    icon: Maximize,
    label: "Upscale",
    description: "4K Banana Pro super-resolution",
    color: "from-zinc-400 to-zinc-700",
  },
  {
    id: "inpainting",
    icon: Eraser,
    label: "Fill/Erase",
    description: "Seamless object modification",
    color: "from-zinc-500 to-zinc-800",
  },
  {
    id: "outpainting",
    icon: Expand,
    label: "Expand",
    description: "Generative canvas expansion",
    color: "from-zinc-600 to-zinc-900",
  },
];

export function ToolSidebar() {
  const { mode, setMode, settings, updateSettings, leftSidebarOpen, toggleLeftSidebar } = useCreate();

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence initial={false}>
        {leftSidebarOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 64, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col items-center py-4 bg-zinc-900 border-r border-zinc-800"
          >
            {/* Tools */}
            <div className="flex flex-col gap-2">
              {tools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  isActive={mode === tool.id}
                  onClick={() => setMode(tool.id)}
                />
              ))}
            </div>

            {/* Separator */}
            <div className="w-8 h-px bg-zinc-700 my-4" />

            {/* Mode Indicator Slider (optional feedback) */}
            {mode === "img2img" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col items-center"
              >
                <VerticalSlider
                  value={settings.styleStrength}
                  onChange={(value) => updateSettings({ styleStrength: value })}
                  min={0}
                  max={100}
                  label="Style"
                  height={100}
                />
              </motion.div>
            )}

            {/* Collapse button */}
            <button
              onClick={toggleLeftSidebar}
              aria-label={leftSidebarOpen ? "Collapse tools" : "Expand tools"}
              aria-expanded={leftSidebarOpen}
              className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 h-12 rounded-r-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="size-4 text-zinc-400" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleLeftSidebar}
            aria-label="Expand tools"
            aria-expanded={false}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 size-6 h-12 rounded-r-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="size-4 text-zinc-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

function ToolButton({
  tool,
  isActive,
  onClick,
}: {
  tool: ToolConfig;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tool.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={tool.label}
          className={cn(
            "relative size-11 rounded-xl flex items-center justify-center transition-all duration-200",
            isActive
              ? "bg-zinc-100 text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          )}
        >

          <Icon
            className={cn(
              "relative z-10 size-5",
              isActive ? "text-zinc-900" : ""
            )}
            strokeWidth={1.5}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="font-medium">{tool.label}</div>
        <div className="text-xs text-muted-foreground">{tool.description}</div>
      </TooltipContent>
    </Tooltip>
  );
}
