"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useCreate } from "@/components/create/create-context";
import { ApiSelector } from "@/components/create/api-selector";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Minus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { ReferenceSection } from "./reference-section";
import { TagChipsInput } from "./tag-chips-input";
import {
  baseAspectRatioOptions,
  baseImageSizeOptions,
  AspectRatioShape,
  makeTaggedRef,
  EXPRESSION_PRESETS,
  CLOTHING_PRESETS,
  LOCATION_PRESETS,
} from "./editor-constants";

// ── Reference toolbar items ──────────────────────────────────────────────

interface RefItem {
  id: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  dotColor: string;
  iconColor: string;
  activeColor: string;
  accentColor: "violet" | "blue" | "amber" | "emerald" | "cyan";
}

const REF_ITEMS: RefItem[] = [
  { id: "style", icon: Palette, shortLabel: "Style", label: "Art Style Reference", dotColor: "bg-violet-500", iconColor: "text-violet-500", activeColor: "bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30", accentColor: "violet" },
  { id: "pose", icon: PersonStanding, shortLabel: "Pose", label: "Pose Reference", dotColor: "bg-blue-500", iconColor: "text-blue-500", activeColor: "bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/30", accentColor: "blue" },
  { id: "expression", icon: Smile, shortLabel: "Expr", label: "Expression", dotColor: "bg-amber-500", iconColor: "text-amber-500", activeColor: "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30", accentColor: "amber" },
  { id: "clothing", icon: Shirt, shortLabel: "Outfit", label: "Clothing", dotColor: "bg-emerald-500", iconColor: "text-emerald-500", activeColor: "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30", accentColor: "emerald" },
  { id: "location", icon: MapPin, shortLabel: "Place", label: "Location", dotColor: "bg-cyan-500", iconColor: "text-cyan-500", activeColor: "bg-cyan-500/15 text-cyan-500 ring-1 ring-cyan-500/30", accentColor: "cyan" },
];

// ── Component ───────────────────────────────────────────────────────────

export function EditorPromptComposer() {
  const {
    prompt,
    setPrompt,
    isGenerating,
    hasAvailableSlots,
    generate,
    settings,
    updateSettings,
    activeGenerations,
    selectedApiId,
    availableApis,
    setSelectedApiId,
    isLoadingApis,
    allowedAspectRatios,
    allowedImageSizes,
    maxOutputCount,
    history,
    savedReferences,
  } = useCreate();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showNegative, setShowNegative] = React.useState(false);

  const completedGens = React.useMemo(
    () => history.filter((g) => g.status === "completed" && g.url).slice(0, 40),
    [history]
  );

  const filteredAspectRatios = React.useMemo(
    () => baseAspectRatioOptions.filter((o) => allowedAspectRatios.includes(o.value)),
    [allowedAspectRatios]
  );

  const filteredImageSizes = React.useMemo(
    () => baseImageSizeOptions.filter((o) => allowedImageSizes.includes(o.value)),
    [allowedImageSizes]
  );

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

  const isRefActive = (id: string): boolean => {
    switch (id) {
      case "style": return !!settings.styleRef?.url;
      case "pose": return !!settings.poseRef?.url;
      case "expression": return !!(settings.expressionRef?.image?.url || (settings.expressionRef?.tags?.length ?? 0) > 0);
      case "clothing": return !!(settings.clothingRef?.image?.url || (settings.clothingRef?.tags?.length ?? 0) > 0);
      case "location": return !!(settings.locationRef?.image?.url || (settings.locationRef?.tags?.length ?? 0) > 0);
      default: return false;
    }
  };

  const renderRefContent = (id: string) => {
    switch (id) {
      case "style":
        return (
          <ReferenceSection label="Style" description="Pick an image to use only its art style." accentColor="violet" icon={Palette}
            image={settings.styleRef} onImageChange={(ref) => updateSettings({ styleRef: ref })}
            completedGens={completedGens} savedReferences={savedReferences} />
        );
      case "pose":
        return (
          <ReferenceSection label="Pose" description="Pick an image to match only its body pose." accentColor="blue" icon={PersonStanding}
            image={settings.poseRef} onImageChange={(ref) => updateSettings({ poseRef: ref })}
            completedGens={completedGens} savedReferences={savedReferences} />
        );
      case "expression":
        return (
          <ReferenceSection label="Expression" description="Set a facial expression via image and/or tags." accentColor="amber" icon={Smile}
            image={settings.expressionRef?.image}
            onImageChange={(ref) => updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { image: ref }) })}
            completedGens={completedGens} savedReferences={savedReferences}>
            <TagChipsInput tags={settings.expressionRef?.tags || []}
              onTagsChange={(tags) => updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { tags }) })}
              presetTags={EXPRESSION_PRESETS} customText={settings.expressionRef?.customText || ""}
              onCustomTextChange={(customText) => updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { customText }) })}
              accentColor="amber" placeholder="Add expression..." />
          </ReferenceSection>
        );
      case "clothing":
        return (
          <ReferenceSection label="Clothing" description="Set clothing style via image and/or tags." accentColor="emerald" icon={Shirt}
            image={settings.clothingRef?.image}
            onImageChange={(ref) => updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { image: ref }) })}
            completedGens={completedGens} savedReferences={savedReferences}>
            <TagChipsInput tags={settings.clothingRef?.tags || []}
              onTagsChange={(tags) => updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { tags }) })}
              presetTags={CLOTHING_PRESETS} customText={settings.clothingRef?.customText || ""}
              onCustomTextChange={(customText) => updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { customText }) })}
              accentColor="emerald" placeholder="Add clothing..." />
          </ReferenceSection>
        );
      case "location":
        return (
          <ReferenceSection label="Location" description="Set background/location via image and/or tags." accentColor="cyan" icon={MapPin}
            image={settings.locationRef?.image}
            onImageChange={(ref) => updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { image: ref }) })}
            completedGens={completedGens} savedReferences={savedReferences}>
            <TagChipsInput tags={settings.locationRef?.tags || []}
              onTagsChange={(tags) => updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { tags }) })}
              presetTags={LOCATION_PRESETS} customText={settings.locationRef?.customText || ""}
              onCustomTextChange={(customText) => updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { customText }) })}
              accentColor="cyan" placeholder="Add location..." />
          </ReferenceSection>
        );
      default: return null;
    }
  };

  const getRefThumb = (id: string): string | undefined => {
    switch (id) {
      case "style": return settings.styleRef?.url;
      case "pose": return settings.poseRef?.url;
      case "expression": return settings.expressionRef?.image?.url;
      case "clothing": return settings.clothingRef?.image?.url;
      case "location": return settings.locationRef?.image?.url;
      default: return undefined;
    }
  };

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

        {/* Inline settings row */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
          {/* API / Model selector */}
          <ApiSelector
            apis={availableApis}
            selectedApiId={selectedApiId}
            onSelect={setSelectedApiId}
            disabled={isLoadingApis}
          />

          <div className="w-px h-5 bg-border/60 shrink-0" />

          {/* Aspect Ratio popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Aspect ratio: ${settings.aspectRatio}`}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors shrink-0"
              >
                <AspectRatioShape ratio={settings.aspectRatio} className="text-muted-foreground" />
                <span className="text-xs font-medium">{settings.aspectRatio}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-auto p-2">
              <div role="listbox" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1">
                {filteredAspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    role="option"
                    aria-selected={settings.aspectRatio === ratio.value}
                    onClick={() => updateSettings({ aspectRatio: ratio.value })}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-150",
                      settings.aspectRatio === ratio.value
                        ? "bg-primary/10 ring-1 ring-primary shadow-sm"
                        : "hover:bg-muted hover:scale-105 active:scale-95"
                    )}
                  >
                    <AspectRatioShape
                      ratio={ratio.value}
                      className={settings.aspectRatio === ratio.value ? "text-primary" : "text-muted-foreground"}
                    />
                    <span className={cn(
                      "text-[10px] font-mono",
                      settings.aspectRatio === ratio.value ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {ratio.value}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quality segmented control */}
          <div role="radiogroup" aria-label="Image quality" className="flex items-center h-8 p-0.5 rounded-lg bg-muted/50 shrink-0">
            {filteredImageSizes.map((size) => (
              <Tooltip key={size.value}>
                <TooltipTrigger asChild>
                  <button
                    role="radio"
                    aria-checked={settings.imageSize === size.value}
                    onClick={() => updateSettings({ imageSize: size.value })}
                    className={cn(
                      "h-7 px-3 rounded-md text-xs font-medium transition-all duration-150",
                      settings.imageSize === size.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {size.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px]">{size.desc}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Output count stepper */}
          <div
            role="spinbutton"
            aria-label="Number of images"
            aria-valuenow={settings.outputCount}
            aria-valuemin={1}
            aria-valuemax={maxOutputCount}
            className="flex items-center h-8 rounded-lg bg-muted/50 shrink-0"
          >
            <button
              type="button"
              onClick={() => updateSettings({ outputCount: Math.max(1, settings.outputCount - 1) })}
              disabled={settings.outputCount <= 1}
              className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Decrease count"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-medium tabular-nums">
              {settings.outputCount}
            </span>
            <button
              type="button"
              onClick={() => updateSettings({ outputCount: Math.min(maxOutputCount, settings.outputCount + 1) })}
              disabled={settings.outputCount >= maxOutputCount}
              className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Increase count"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Reference image buttons */}
          <div className="w-px h-5 bg-border/60 shrink-0" />
          {REF_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRefActive(item.id);
            const thumb = getRefThumb(item.id);
            return (
              <Popover key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={item.label}
                        className={cn(
                          "relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? item.activeColor
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        <span className="text-xs font-medium hidden sm:inline">{item.shortLabel}</span>
                        {thumb && (
                          <div className={cn("size-4 rounded overflow-hidden border", active ? "border-current/30" : "border-border")}>
                            <img src={thumb} alt="" className="w-full h-full object-cover" draggable={false} />
                          </div>
                        )}
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px]">{item.label}</TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="start"
                  side="top"
                  className="w-80 p-4 max-h-[60vh] overflow-y-auto scrollbar-thin"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={cn("size-3.5", item.iconColor)} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  {renderRefContent(item.id)}
                </PopoverContent>
              </Popover>
            );
          })}
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
