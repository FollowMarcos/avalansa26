"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useCreate } from "@/components/create/create-context";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Palette,
  PersonStanding,
  Smile,
  Shirt,
  MapPin,
} from "lucide-react";

export function EditorPromptComposer() {
  const {
    prompt,
    setPrompt,
    isGenerating,
    hasAvailableSlots,
    generate,
    settings,
    activeGenerations,
    selectedApiId,
  } = useCreate();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showNegative, setShowNegative] = React.useState(false);
  const { updateSettings } = useCreate();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating && hasAvailableSlots && selectedApiId) {
        generate();
      }
    }
  };

  // Active reference indicators
  const refChips = React.useMemo(() => {
    const chips: { label: string; color: string; icon: React.ReactNode }[] = [];
    if (settings.styleRef?.url)
      chips.push({ label: "Style", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400", icon: <Palette className="size-3" /> });
    if (settings.poseRef?.url)
      chips.push({ label: "Pose", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: <PersonStanding className="size-3" /> });
    if (settings.expressionRef?.image?.url || (settings.expressionRef?.tags?.length ?? 0) > 0) {
      const tags = settings.expressionRef?.tags?.join(", ") || "";
      chips.push({
        label: tags ? `Expression: ${tags}` : "Expression",
        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        icon: <Smile className="size-3" />,
      });
    }
    if (settings.clothingRef?.image?.url || (settings.clothingRef?.tags?.length ?? 0) > 0) {
      const tags = settings.clothingRef?.tags?.join(", ") || "";
      chips.push({
        label: tags ? `Clothing: ${tags}` : "Clothing",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        icon: <Shirt className="size-3" />,
      });
    }
    if (settings.locationRef?.image?.url || (settings.locationRef?.tags?.length ?? 0) > 0) {
      const tags = settings.locationRef?.tags?.join(", ") || "";
      chips.push({
        label: tags ? `Location: ${tags}` : "Location",
        color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
        icon: <MapPin className="size-3" />,
      });
    }
    return chips;
  }, [settings]);

  const canGenerate = prompt.trim().length > 0 && !isGenerating && hasAvailableSlots && !!selectedApiId;

  const disabledReason = !selectedApiId
    ? "Select a model first"
    : !prompt.trim()
    ? "Enter a prompt"
    : !hasAvailableSlots
    ? "Generation slots full"
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 space-y-2">
        {/* Reference summary chips */}
        <AnimatePresence>
          {refChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-wrap gap-1.5 overflow-hidden"
            >
              {refChips.map((chip, i) => (
                <motion.span
                  key={chip.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    chip.color
                  )}
                >
                  {chip.icon}
                  <span className="max-w-[140px] truncate">{chip.label}</span>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main prompt row */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to generate..."
              rows={2}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm",
                "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                "transition-shadow scrollbar-thin"
              )}
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <Button
                  onClick={() => generate()}
                  disabled={!canGenerate}
                  size="sm"
                  className="h-10 px-4 rounded-xl gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="size-4" />
                      <span className="text-xs">
                        {activeGenerations > 0 ? `${activeGenerations} active` : "Generating..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {disabledReason && !canGenerate && (
              <TooltipContent side="top" className="text-[10px]">
                {disabledReason}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Negative prompt toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowNegative(!showNegative)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNegative ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            Negative prompt
          </button>
          <AnimatePresence>
            {showNegative && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={settings.negativePrompt}
                  onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                  placeholder="What to avoid..."
                  className="mt-1 w-full h-7 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
