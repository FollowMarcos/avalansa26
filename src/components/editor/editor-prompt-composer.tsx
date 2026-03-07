"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useCreate } from "@/components/create/create-context";
import { ApiSelector } from "@/components/create/api-selector";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Minus,
  Plus,
  ImagePlus,
  X,
  Trash2,
} from "lucide-react";
import {
  baseAspectRatioOptions,
  baseImageSizeOptions,
  AspectRatioShape,
} from "./editor-constants";

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
    savedReferences,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    addSavedReferenceToActive,
    removeSavedReference,
  } = useCreate();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showNegative, setShowNegative] = React.useState(false);

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
      if ((prompt.trim() || referenceImages.length > 0) && !isGenerating && hasAvailableSlots && selectedApiId) {
        generate();
      }
    }
  };

  const handlePaste = React.useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) addReferenceImages(imageFiles);
  }, [addReferenceImages]);

  const hasReferences = referenceImages.length > 0;

  const canGenerate = (prompt.trim().length > 0 || referenceImages.length > 0) && !isGenerating && hasAvailableSlots && !!selectedApiId;

  const disabledReason = !selectedApiId
    ? "Select a model first"
    : !prompt.trim()
    ? "Enter a prompt"
    : !hasAvailableSlots
    ? "Generation slots full"
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <FileUpload onFilesAdded={addReferenceImages} multiple accept="image/*" disabled={!hasAvailableSlots}>
      <div className="border-t border-white/[0.06] bg-background/95 backdrop-blur-sm px-3 py-2 space-y-2">
        {/* Inline reference image thumbnails */}
        <AnimatePresence>
          {hasReferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                {referenceImages.slice(0, 6).map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="size-8 rounded-md overflow-hidden bg-muted border border-white/[0.06]">
                      <Image src={img.preview} alt="Reference" width={36} height={36} className="w-full h-full object-cover" />
                      {img.isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(img.id)}
                      aria-label="Remove reference"
                      className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-background border border-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
                {referenceImages.length > 6 && (
                  <span className="text-[10px] text-muted-foreground font-mono">+{referenceImages.length - 6}</span>
                )}
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">{referenceImages.length}/14</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main prompt row */}
        <div className="flex items-end gap-2">
          {/* Reference images button */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "size-10 rounded-lg flex items-center justify-center transition-colors shrink-0 relative focus-visible:ring-2 focus-visible:ring-ring",
                      hasReferences
                        ? "bg-white/[0.12] text-foreground"
                        : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    )}
                    aria-label="Add reference images"
                  >
                    <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    {hasReferences && (
                      <span className="absolute -top-1 -right-1 size-4 rounded-full bg-background border-2 border-primary text-[9px] font-mono font-medium text-primary flex items-center justify-center">
                        {referenceImages.length}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                {hasReferences ? `${referenceImages.length} references` : "Add references"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" side="top" className="w-80 p-0">
              <div className="p-3 space-y-3">
                {/* Active References */}
                {hasReferences && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Active References</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {referenceImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <div className="aspect-square rounded-md overflow-hidden bg-muted border border-white/[0.06]">
                            <Image src={img.preview} alt="Reference" width={48} height={48} className="w-full h-full object-cover" />
                            {img.isUploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader className="size-3 text-white" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReferenceImage(img.id)}
                            aria-label="Remove from active"
                            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right font-mono">{referenceImages.length}/14</div>
                  </div>
                )}

                {/* Upload button */}
                <FileUploadTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-sm transition-colors border-2 border-dashed border-white/[0.1]"
                    disabled={!hasAvailableSlots || referenceImages.length >= 14}
                  >
                    <ImagePlus className="size-4" aria-hidden="true" />
                    <span>Upload images</span>
                  </button>
                </FileUploadTrigger>

                {/* Saved library */}
                {savedReferences.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Library</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{savedReferences.length} saved</div>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
                      {savedReferences.map((saved) => (
                        <div key={saved.id} className="relative group">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => addSavedReferenceToActive(saved)}
                                className="aspect-square w-full rounded-md overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-colors"
                                aria-label={`Add ${saved.name || "reference"}`}
                              >
                                <Image src={saved.url} alt={saved.name || "Reference"} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{saved.name || "Reference image"}</TooltipContent>
                          </Tooltip>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSavedReference(saved.id); }}
                            aria-label="Delete from library"
                            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/70">Click to use &middot; Uploads are auto-saved</p>
                  </>
                )}

                {savedReferences.length === 0 && !hasReferences && (
                  <p className="text-xs text-muted-foreground text-center py-2">Upload images to use as references.<br />They&apos;ll be saved to your library automatically.</p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={hasReferences ? "Describe how to transform your images..." : "Describe what you want to generate..."}
              rows={2}
              className={cn(
                "w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm",
                "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/[0.15] focus:border-white/[0.1]",
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
                  className="h-10 px-4 rounded-lg gap-2"
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

          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* Aspect Ratio popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Aspect ratio: ${settings.aspectRatio}`}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.06] transition-colors shrink-0"
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
          <div role="radiogroup" aria-label="Image quality" className="flex items-center h-8 p-0.5 rounded-md bg-white/[0.04] shrink-0">
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
            className="flex items-center h-8 rounded-md bg-white/[0.04] shrink-0"
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
                  className="mt-1 w-full h-7 px-2 text-xs rounded-md border border-white/[0.06] bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-white/[0.15] transition-shadow"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </FileUpload>
    </TooltipProvider>
  );
}
