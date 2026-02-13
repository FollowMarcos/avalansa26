"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, AspectRatio, ImageSize } from "./create-context";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { ApiSelector } from "./api-selector";
import {
  ImagePlus,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Zap,
  Clock,
  Trash2,
  ChevronDown,
  Minus,
  Plus,
  Bookmark,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
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

const imageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

// Visual aspect ratio shape with proper scaling
function AspectRatioShape({ ratio, size = "sm", className }: { ratio: AspectRatio; size?: "sm" | "md" | "lg"; className?: string }) {
  const getShapeDimensions = (r: AspectRatio): { width: number; height: number } => {
    const [w, h] = r.split(":").map(Number);
    const maxSize = size === "lg" ? 32 : size === "md" ? 20 : 14;
    if (w > h) {
      return { width: maxSize, height: Math.round((h / w) * maxSize) };
    } else if (h > w) {
      return { width: Math.round((w / h) * maxSize), height: maxSize };
    }
    return { width: maxSize, height: maxSize };
  };

  const { width, height } = getShapeDimensions(ratio);

  return (
    <div
      className={cn("border-2 border-current rounded-sm", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

interface PromptComposerProps {
  onSaveToVault?: () => void;
}

export function PromptComposer({ onSaveToVault }: PromptComposerProps = {}) {
  const {
    prompt,
    setPrompt,
    isPromptExpanded,
    setIsPromptExpanded,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    savedReferences,
    removeSavedReference,
    addSavedReferenceToActive,
    isGenerating,
    hasAvailableSlots,
    generate,
    settings,
    updateSettings,
    availableApis,
    selectedApiId,
    setSelectedApiId,
    isLoadingApis,
    activeGenerations,
    // Admin settings
    allowedImageSizes,
    allowedAspectRatios,
    maxOutputCount,
    allowFastMode,
    allowRelaxedMode,
  } = useCreate();

  // Filter options based on admin settings
  const filteredAspectRatios = React.useMemo(() => {
    return aspectRatioOptions.filter((opt) => allowedAspectRatios.includes(opt.value));
  }, [allowedAspectRatios]);

  const filteredImageSizes = React.useMemo(() => {
    return imageSizeOptions.filter((opt) => allowedImageSizes.includes(opt.value));
  }, [allowedImageSizes]);

  // Show speed toggle only if both modes are allowed
  const showSpeedToggle = allowFastMode && allowRelaxedMode;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-expand when prompt exceeds 150 characters
  React.useEffect(() => {
    if (prompt.length >= 150 && !isPromptExpanded) {
      setIsPromptExpanded(true);
    }
  }, [prompt.length, isPromptExpanded, setIsPromptExpanded]);

  const handleSubmit = () => {
    if (hasAvailableSlots && (prompt.trim() || referenceImages.length > 0)) {
      generate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = React.useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if item is an image
      if (item.type.startsWith('image/')) {
        event.preventDefault(); // Prevent default paste behavior for images

        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      addReferenceImages(imageFiles);
    }
  }, [addReferenceImages]);

  const hasReferences = referenceImages.length > 0;
  const maxVisibleRefs = 4;
  const hiddenRefCount = Math.max(0, referenceImages.length - maxVisibleRefs);

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-4xl mx-auto">
          <FileUpload
            onFilesAdded={addReferenceImages}
            multiple
            accept="image/*"
            disabled={!hasAvailableSlots}
          >
            {/* Main Composer Island */}
            <div className="relative">
              {/* Shadow layers for floating effect */}
              <div className="absolute inset-0 translate-y-4 bg-black/20 dark:bg-black/40 rounded-3xl blur-2xl" aria-hidden="true" />
              <div className="absolute inset-0 translate-y-2 bg-black/10 dark:bg-black/20 rounded-3xl blur-xl" aria-hidden="true" />

              <div className="relative bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-lg dark:shadow-none">
                {/* Main Input Area */}
                <div className="p-4 pb-2">
                  <div className="flex items-start gap-3">
                    {/* References Button with Badge */}
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "size-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 relative focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                hasReferences
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted dark:bg-zinc-800 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-200"
                              )}
                              aria-label="Add reference images"
                            >
                              <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
                              {hasReferences && (
                                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-background dark:bg-zinc-900 border-2 border-primary text-[10px] font-mono font-medium text-primary flex items-center justify-center">
                                  {referenceImages.length}
                                </span>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {hasReferences ? `${referenceImages.length} references` : "Add references"}
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" side="top" className="w-80 p-0">
                        <div className="p-3 space-y-3">
                          {/* Active References for this generation */}
                          {hasReferences && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-foreground">Active References</div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {referenceImages.map((img) => (
                                  <div key={img.id} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-muted dark:bg-zinc-800 border border-border dark:border-white/10">
                                      <Image src={img.preview} alt="Reference" width={48} height={48} className="w-full h-full object-cover" />
                                      {img.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <Loader className="size-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <button onClick={() => removeReferenceImage(img.id)} aria-label="Remove from active" className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-background dark:bg-zinc-900 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring">
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
                            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-muted dark:bg-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-700 text-sm transition-colors border-2 border-dashed border-border dark:border-zinc-700" disabled={!hasAvailableSlots || referenceImages.length >= 14}>
                              <ImagePlus className="size-4" aria-hidden="true" />
                              <span>Upload images</span>
                            </button>
                          </FileUploadTrigger>

                          {/* Your Library - auto-saved uploads */}
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
                                        <button onClick={() => addSavedReferenceToActive(saved)} className="aspect-square w-full rounded-lg overflow-hidden border border-border hover:border-foreground/50 transition-colors" aria-label={`Add ${saved.name || 'reference'}`}>
                                          <Image src={saved.url} alt={saved.name || 'Reference'} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">{saved.name || 'Reference image'}</TooltipContent>
                                    </Tooltip>
                                    <button onClick={(e) => { e.stopPropagation(); removeSavedReference(saved.id); }} aria-label="Delete from library" className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring">
                                      <Trash2 className="size-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground/70">Click to use • Uploads are auto-saved</p>
                            </>
                          )}

                          {savedReferences.length === 0 && !hasReferences && (
                            <p className="text-xs text-muted-foreground text-center py-2">Upload images to use as references.<br />They'll be saved to your library automatically.</p>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Input Area */}
                    <div className="flex-1 min-w-0">
                      {/* Inline reference thumbnails */}
                      <div
                        className={cn(
                          "transition-opacity duration-200 overflow-hidden",
                          hasReferences ? "opacity-100 max-h-20 mb-2" : "opacity-0 max-h-0"
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                              {referenceImages.slice(0, maxVisibleRefs).map((img) => (
                                <div key={img.id} className="relative group">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted dark:bg-zinc-800 border border-border dark:border-white/10">
                                    <Image src={img.preview} alt="Reference" width={32} height={32} className="w-full h-full object-cover" />
                                    {img.isUploading && (
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader className="size-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => removeReferenceImage(img.id)} aria-label="Remove" className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-background dark:bg-zinc-900 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring">
                                    <X className="size-2.5" />
                                  </button>
                                </div>
                              ))}
                              {hiddenRefCount > 0 && (
                                <span className="text-[10px] text-muted-foreground font-mono">+{hiddenRefCount}</span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Textarea */}
                      <div className="relative">
                        <div className={cn("overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-ring", isPromptExpanded ? "max-h-[200px]" : "max-h-[44px]")}>
                          <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={hasReferences ? "Describe how to transform your images…" : "What would you like to create?"}
                            name="prompt"
                            aria-label="Image generation prompt"
                            rows={isPromptExpanded ? 5 : 1}
                            className={cn(
                              "w-full bg-transparent text-base text-foreground dark:text-zinc-200 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 resize-none focus:outline-none",
                              isPromptExpanded ? "min-h-[120px] py-2.5" : "h-[44px] py-2.5"
                            )}
                          />
                        </div>
                        <div className="absolute bottom-0.5 right-0 flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground dark:text-zinc-600 font-mono tabular-nums">{prompt.length}</span>
                          <button onClick={() => setIsPromptExpanded(!isPromptExpanded)} className="size-6 rounded-lg flex items-center justify-center text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 transition-colors focus-visible:ring-2 focus-visible:ring-ring" aria-label={isPromptExpanded ? "Collapse" : "Expand"}>
                            {isPromptExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save to Vault Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={onSaveToVault}
                          disabled={!prompt.trim()}
                          variant="ghost"
                          className={cn(
                            "size-9 rounded-xl flex items-center justify-center transition-colors shrink-0 p-0",
                            "hover:bg-muted dark:hover:bg-zinc-800",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Save prompt to vault"
                        >
                          <Bookmark className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Save to Vault</TooltipContent>
                    </Tooltip>

                    {/* Generate Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSubmit}
                          disabled={!hasAvailableSlots || (!prompt.trim() && referenceImages.length === 0)}
                          className={cn(
                            "size-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 p-0",
                            "bg-foreground dark:bg-white text-background dark:text-zinc-900 hover:bg-foreground/90 dark:hover:bg-zinc-100",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Generate image"
                        >
                          {isGenerating && !hasAvailableSlots ? (
                            <Loader variant="circular" size="sm" className="border-background dark:border-zinc-900" />
                          ) : (
                            <Sparkles className="size-5" strokeWidth={1.5} aria-hidden="true" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Generate</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Settings Row - Redesigned */}
                <div className="flex items-center gap-1.5 px-4 pb-3 pt-1 overflow-x-auto">
                  <div className="w-11 shrink-0" />

                  {/* API Selector */}
                  <ApiSelector
                    apis={availableApis}
                    selectedApiId={selectedApiId}
                    onSelect={setSelectedApiId}
                    disabled={!hasAvailableSlots || isLoadingApis}
                  />

                  <div className="w-px h-5 bg-border dark:bg-zinc-700/50 shrink-0 mx-1" />

                  {/* Aspect Ratio - Visual Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        aria-label={`Aspect ratio: ${settings.aspectRatio}`}
                        aria-haspopup="listbox"
                        className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-muted/50 dark:bg-zinc-800/50 hover:bg-muted dark:hover:bg-zinc-800 border border-transparent hover:border-border dark:hover:border-zinc-700 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <AspectRatioShape ratio={settings.aspectRatio} size="sm" className="text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground dark:text-zinc-300">{settings.aspectRatio}</span>
                        <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-auto p-2">
                      <div role="listbox" aria-label="Aspect ratio options" className="grid grid-cols-3 gap-1">
                        {filteredAspectRatios.map((ratio) => (
                          <button
                            key={ratio.value}
                            role="option"
                            aria-selected={settings.aspectRatio === ratio.value}
                            onClick={() => updateSettings({ aspectRatio: ratio.value })}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-colors",
                              settings.aspectRatio === ratio.value
                                ? "bg-primary/10 dark:bg-primary/20 ring-1 ring-primary"
                                : "hover:bg-muted dark:hover:bg-zinc-800"
                            )}
                          >
                            <AspectRatioShape
                              ratio={ratio.value}
                              size="md"
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

                  {/* Quality - Segmented Control */}
                  <div
                    role="radiogroup"
                    aria-label="Image quality"
                    className="flex items-center h-8 p-0.5 rounded-lg bg-muted/50 dark:bg-zinc-800/50 shrink-0"
                  >
                    {filteredImageSizes.map((size) => (
                      <Tooltip key={size.value}>
                        <TooltipTrigger asChild>
                          <button
                            role="radio"
                            aria-checked={settings.imageSize === size.value}
                            onClick={() => updateSettings({ imageSize: size.value })}
                            className={cn(
                              "h-7 px-3 rounded-md text-xs font-medium transition-colors",
                              settings.imageSize === size.value
                                ? "bg-background dark:bg-zinc-700 text-foreground dark:text-zinc-100 shadow-sm"
                                : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-300"
                            )}
                          >
                            {size.label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{size.desc}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  {/* Speed - Toggle Pill (only show if both modes are allowed) */}
                  {showSpeedToggle && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => updateSettings({ generationSpeed: settings.generationSpeed === "fast" ? "relaxed" : "fast" })}
                          aria-label={`Generation speed: ${settings.generationSpeed === "fast" ? "Fast" : "Relax"}`}
                          className={cn(
                            "flex items-center gap-1.5 h-8 px-3 rounded-lg transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring",
                            settings.generationSpeed === "fast"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                          )}
                        >
                          {settings.generationSpeed === "fast" ? (
                            <Zap className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Clock className="size-3.5" aria-hidden="true" />
                          )}
                          <span className="text-xs font-medium">
                            {settings.generationSpeed === "fast" ? "Fast" : "Relax"}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        {settings.generationSpeed === "fast"
                          ? "Generate images immediately"
                          : "Queue images for background generation. Takes longer but doesn't block you."}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Quantity - Stepper */}
                  <div
                    role="spinbutton"
                    aria-label="Number of images to generate"
                    aria-valuenow={Math.min(settings.outputCount, maxOutputCount)}
                    aria-valuemin={1}
                    aria-valuemax={maxOutputCount}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        updateSettings({ outputCount: Math.min(maxOutputCount, settings.outputCount + 1) });
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        updateSettings({ outputCount: Math.max(1, settings.outputCount - 1) });
                      }
                    }}
                    className="flex items-center h-11 rounded-lg bg-muted/50 dark:bg-zinc-800/50 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
                  >
                    <button
                      onClick={() => updateSettings({ outputCount: Math.max(1, settings.outputCount - 1) })}
                      disabled={settings.outputCount <= 1}
                      className="size-11 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      aria-label="Decrease count"
                      tabIndex={-1}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-foreground dark:text-zinc-200 tabular-nums">
                      {Math.min(settings.outputCount, maxOutputCount)}
                    </span>
                    <button
                      onClick={() => updateSettings({ outputCount: Math.min(maxOutputCount, settings.outputCount + 1) })}
                      disabled={settings.outputCount >= maxOutputCount}
                      className="size-11 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      aria-label="Increase count"
                      tabIndex={-1}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Negative Prompt - Inline Input */}
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="flex items-center h-8 px-2.5 rounded-lg bg-muted/30 dark:bg-zinc-800/30 border border-transparent focus-within:border-border dark:focus-within:border-zinc-700 transition-colors">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2 shrink-0">Avoid</span>
                      <input
                        type="text"
                        value={settings.negativePrompt}
                        onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                        placeholder="blurry, watermark…"
                        aria-label="Negative prompt - things to avoid in generation"
                        autoComplete="off"
                        className="flex-1 min-w-0 bg-transparent text-xs text-foreground dark:text-zinc-300 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Status - Show active generation count */}
                  {activeGenerations > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 flex items-center gap-1.5 ml-2">
                      <span className="relative flex size-1.5">
                        <span className={cn("absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75", !prefersReducedMotion && "animate-ping")} />
                        <span className="relative inline-flex rounded-full size-1.5 bg-amber-500" />
                      </span>
                      <span>Generating {activeGenerations}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </FileUpload>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
