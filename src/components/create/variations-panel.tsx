"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, type AspectRatio, type ImageSize } from "./create-context";
import { ApiSelector } from "./api-selector";
import { Plus, X, ChevronDown, ImagePlus, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "motion/react";

const baseAspectRatioOptions: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "Standard" },
  { value: "3:4", label: "Portrait" },
  { value: "16:9", label: "Wide" },
  { value: "9:16", label: "Tall" },
  { value: "3:2", label: "Photo" },
  { value: "2:3", label: "Portrait" },
  { value: "4:5", label: "Social" },
  { value: "21:9", label: "Ultra" },
];

const flash31AspectRatioOptions: { value: AspectRatio; label: string }[] = [
  { value: "4:1", label: "Banner" },
  { value: "1:4", label: "Pillar" },
  { value: "8:1", label: "Strip" },
  { value: "1:8", label: "Column" },
];

const baseImageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

const flash31ImageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "0.5K", label: "0.5K", desc: "Tiny" },
];

function isFlash31Model(modelId: string | null | undefined): boolean {
  return modelId === "gemini-3.1-flash-image-preview";
}

function AspectRatioShape({ ratio, className }: { ratio: AspectRatio; className?: string }) {
  const [w, h] = ratio.split(":").map(Number);
  const maxSize = 12;
  let width: number;
  let height: number;
  if (w > h) {
    width = maxSize;
    height = Math.round((h / w) * maxSize);
  } else if (h > w) {
    width = Math.round((w / h) * maxSize);
    height = maxSize;
  } else {
    width = maxSize;
    height = maxSize;
  }

  return (
    <div
      className={cn("border-[1.5px] border-current rounded-[2px]", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

export function VariationsPanel() {
  const {
    variationSlots,
    addVariationSlot,
    removeVariationSlot,
    updateVariationSlot,
    addVariationReferenceImages,
    removeVariationReferenceImage,
    allowedAspectRatios,
    allowedImageSizes,
    availableApis,
    selectedApiId,
    isGenerating,
  } = useCreate();

  // Per-slot file input refs
  const fileInputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());

  const selectedModelId = React.useMemo(() => {
    if (!selectedApiId) return null;
    return availableApis.find((a) => a.id === selectedApiId)?.model_id ?? null;
  }, [selectedApiId, availableApis]);
  const isFlash31 = isFlash31Model(selectedModelId);

  const filteredAspectRatios = React.useMemo(() => {
    const base = baseAspectRatioOptions.filter((opt) => allowedAspectRatios.includes(opt.value));
    if (isFlash31) return [...base, ...flash31AspectRatioOptions];
    return base;
  }, [allowedAspectRatios, isFlash31]);

  const filteredImageSizes = React.useMemo(() => {
    const base = baseImageSizeOptions.filter((opt) => allowedImageSizes.includes(opt.value));
    if (isFlash31) return [...flash31ImageSizeOptions, ...base];
    return base;
  }, [allowedImageSizes, isFlash31]);

  const handleFileSelect = React.useCallback((slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addVariationReferenceImages(slotId, files);
    }
    e.target.value = "";
  }, [addVariationReferenceImages]);

  return (
    <div className="space-y-2 px-4 pt-3 pb-2">
      <div className="flex items-center justify-between pl-[calc(0.25rem+1.25rem+0.5rem)]">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Variations ({variationSlots.length}/4)
        </span>
        {variationSlots.length < 4 && (
          <button
            onClick={addVariationSlot}
            disabled={isGenerating}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="size-3" />
            Add
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {variationSlots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-1.5"
          >
            {/* Main row: badge + prompt + controls */}
            <div className="flex items-center gap-2">
              {/* Slot number badge */}
              <span className="size-5 rounded-full bg-muted dark:bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">
                {index + 1}
              </span>

              {/* Secondary prompt input */}
              <input
                type="text"
                value={slot.secondaryPrompt}
                onChange={(e) => updateVariationSlot(slot.id, { secondaryPrompt: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                placeholder={`Scene/context for variation ${index + 1}...`}
                disabled={isGenerating}
                className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-muted/30 dark:bg-zinc-800/30 border border-transparent focus:border-border dark:focus:border-zinc-600 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors disabled:opacity-50"
              />

              {/* Reference image button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => fileInputRefs.current.get(slot.id)?.click()}
                    disabled={isGenerating || slot.referenceImages.length >= 5}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                      slot.referenceImages.length > 0
                        ? "bg-primary/10 dark:bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <ImagePlus className="size-3.5" />
                    {slot.referenceImages.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-medium">
                        {slot.referenceImages.length}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {slot.referenceImages.length >= 5 ? "Max 5 references" : "Add reference images"}
                </TooltipContent>
              </Tooltip>
              <input
                ref={(el) => {
                  if (el) fileInputRefs.current.set(slot.id, el);
                  else fileInputRefs.current.delete(slot.id);
                }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(slot.id, e)}
              />

              {/* Per-slot model selector */}
              <ApiSelector
                apis={availableApis}
                selectedApiId={slot.apiId || selectedApiId}
                onSelect={(id) => updateVariationSlot(slot.id, { apiId: id })}
                disabled={isGenerating}
                className="h-8 text-[10px]"
              />

              {/* Per-slot aspect ratio picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    disabled={isGenerating}
                    className="h-8 px-2 rounded-lg bg-muted/30 dark:bg-zinc-800/30 hover:bg-muted dark:hover:bg-zinc-800 text-[10px] font-mono text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <AspectRatioShape ratio={slot.aspectRatio} className="text-muted-foreground" />
                    <span>{slot.aspectRatio}</span>
                    <ChevronDown className="size-2.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" side="top" className="w-auto p-2">
                  <div role="listbox" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1">
                    {filteredAspectRatios.map((ratio) => (
                      <button
                        key={ratio.value}
                        role="option"
                        aria-selected={slot.aspectRatio === ratio.value}
                        onClick={() => updateVariationSlot(slot.id, { aspectRatio: ratio.value })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                          slot.aspectRatio === ratio.value
                            ? "bg-primary/10 dark:bg-primary/20 ring-1 ring-primary"
                            : "hover:bg-muted dark:hover:bg-zinc-800"
                        )}
                      >
                        <AspectRatioShape
                          ratio={ratio.value}
                          className={slot.aspectRatio === ratio.value ? "text-primary" : "text-muted-foreground"}
                        />
                        <span className={cn(
                          "text-[10px] font-mono",
                          slot.aspectRatio === ratio.value ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {ratio.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Per-slot image size */}
              <div className="flex items-center h-8 p-0.5 rounded-lg bg-muted/30 dark:bg-zinc-800/30 shrink-0">
                {filteredImageSizes.map((size) => (
                  <Tooltip key={size.value}>
                    <TooltipTrigger asChild>
                      <button
                        disabled={isGenerating}
                        onClick={() => updateVariationSlot(slot.id, { imageSize: size.value })}
                        className={cn(
                          "h-7 px-2 rounded-md text-[10px] font-medium transition-colors",
                          slot.imageSize === size.value
                            ? "bg-background dark:bg-zinc-700 text-foreground dark:text-zinc-100 shadow-sm"
                            : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-300 disabled:opacity-50"
                        )}
                      >
                        {size.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">{size.desc}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Remove button */}
              {variationSlots.length > 1 && (
                <button
                  onClick={() => removeVariationSlot(slot.id)}
                  disabled={isGenerating}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  aria-label={`Remove variation ${index + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              )}

              {/* Spacer when only 1 slot (no remove button) */}
              {variationSlots.length === 1 && <div className="w-8 shrink-0" />}
            </div>

            {/* Reference image thumbnails row */}
            {slot.referenceImages.length > 0 && (
              <div className="flex items-center gap-1.5 pl-7">
                {slot.referenceImages.map((img) => (
                  <div key={img.id} className="relative group size-8 rounded-md overflow-hidden shrink-0">
                    {img.isUploading ? (
                      <div className="size-full bg-muted dark:bg-zinc-800 flex items-center justify-center">
                        <Loader2 className="size-3 text-muted-foreground animate-spin" />
                      </div>
                    ) : (
                      <Image
                        src={img.preview}
                        alt="Reference"
                        width={32}
                        height={32}
                        className="size-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeVariationReferenceImage(slot.id, img.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Remove reference image"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
                {slot.referenceImages.length < 5 && (
                  <button
                    onClick={() => fileInputRefs.current.get(slot.id)?.click()}
                    disabled={isGenerating}
                    className="size-8 rounded-md border border-dashed border-border dark:border-zinc-700 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
