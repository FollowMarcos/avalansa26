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
  Ban,
  Bookmark,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const aspectRatioOptions: { value: AspectRatio; label: string; category: string }[] = [
  { value: "1:1", label: "1:1", category: "Square" },
  { value: "4:3", label: "4:3", category: "Standard" },
  { value: "3:4", label: "3:4", category: "Portrait" },
  { value: "16:9", label: "16:9", category: "Wide" },
  { value: "9:16", label: "9:16", category: "Tall" },
  { value: "3:2", label: "3:2", category: "Photo" },
  { value: "2:3", label: "2:3", category: "Portrait" },
  { value: "5:4", label: "5:4", category: "Photo" },
  { value: "4:5", label: "4:5", category: "Social" },
  { value: "21:9", label: "21:9", category: "Ultra" },
];

const imageSizeOptions: { value: ImageSize; label: string }[] = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

// Prompt suggestions for empty state
const promptSuggestions = [
  "A serene Japanese garden at sunset",
  "Futuristic cyberpunk cityscape",
  "Minimalist product photography",
  "Portrait with dramatic lighting",
  "Abstract fluid art in vibrant colors",
  "Cozy cabin interior in winter",
];

function AspectRatioShape({ ratio, className }: { ratio: AspectRatio; className?: string }) {
  const getShapeDimensions = (r: AspectRatio): { width: number; height: number } => {
    const [w, h] = r.split(":").map(Number);
    const maxSize = 12;
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
      className={cn("border-[1.5px] border-current rounded-[1px]", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

export function PromptComposer() {
  const {
    prompt,
    setPrompt,
    isPromptExpanded,
    setIsPromptExpanded,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    savedReferences,
    saveReferenceImage,
    removeSavedReference,
    addSavedReferenceToActive,
    isGenerating,
    generate,
    settings,
    updateSettings,
    availableApis,
    selectedApiId,
    setSelectedApiId,
    isLoadingApis,
  } = useCreate();

  const [showNegative, setShowNegative] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-expand when prompt exceeds 150 characters
  React.useEffect(() => {
    if (prompt.length >= 150 && !isPromptExpanded) {
      setIsPromptExpanded(true);
    }
  }, [prompt.length, isPromptExpanded, setIsPromptExpanded]);

  const handleSubmit = () => {
    if (!isGenerating && (prompt.trim() || referenceImages.length > 0)) {
      generate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    textareaRef.current?.focus();
  };

  const hasReferences = referenceImages.length > 0;
  const showEmptyState = !prompt.trim() && !hasReferences && !isGenerating;
  const maxVisibleRefs = 4;
  const hiddenRefCount = Math.max(0, referenceImages.length - maxVisibleRefs);

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-30 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <FileUpload
            onFilesAdded={addReferenceImages}
            multiple
            accept="image/*"
            disabled={isGenerating}
          >
            {/* Main Composer Island */}
            <div className="relative">
              {/* Shadow layers for floating effect */}
              <div className="absolute inset-0 translate-y-4 bg-black/20 dark:bg-black/40 rounded-3xl blur-2xl" aria-hidden="true" />
              <div className="absolute inset-0 translate-y-2 bg-black/10 dark:bg-black/20 rounded-3xl blur-xl" aria-hidden="true" />

              <div className="relative bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-lg dark:shadow-none">
                {/* Main Input Area */}
                <div className="p-4 pb-2">
                  {/* Inline Reference Thumbnails + Textarea */}
                  <div className="flex items-start gap-3">
                    {/* References Button with Badge */}
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "size-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 relative",
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
                      <DropdownMenuContent align="start" side="top" className="w-72">
                        <DropdownMenuLabel className="text-xs font-mono">Reference Images</DropdownMenuLabel>
                        <div className="p-2 space-y-3">
                          {/* Current references */}
                          {hasReferences && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-5 gap-1.5">
                                {referenceImages.map((img) => (
                                  <div key={img.id} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-muted dark:bg-zinc-800 border border-border dark:border-white/10">
                                      <Image
                                        src={img.preview}
                                        alt="Reference"
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                      />
                                      {img.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <Loader className="size-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    {img.storagePath && !img.isUploading && (
                                      <button
                                        onClick={() => saveReferenceImage(img)}
                                        aria-label="Save to library"
                                        className="absolute -top-1 -left-1 size-4 rounded-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground text-[8px]"
                                      >
                                        <Bookmark className="size-2" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => removeReferenceImage(img.id)}
                                      aria-label="Remove"
                                      className="absolute -top-1 -right-1 size-4 rounded-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <X className="size-2" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="text-[10px] text-muted-foreground text-right font-mono">
                                {referenceImages.length}/14
                              </div>
                            </div>
                          )}

                          {/* Upload button */}
                          <FileUploadTrigger asChild>
                            <button
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-muted dark:bg-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-700 text-sm transition-colors border-2 border-dashed border-border dark:border-zinc-700"
                              disabled={isGenerating || referenceImages.length >= 14}
                            >
                              <ImagePlus className="size-4" />
                              <span>Upload images</span>
                            </button>
                          </FileUploadTrigger>

                          {/* Saved library */}
                          {savedReferences.length > 0 && (
                            <>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Saved Library
                              </div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {savedReferences.map((saved) => (
                                  <div key={saved.id} className="relative group">
                                    <button
                                      onClick={() => addSavedReferenceToActive(saved)}
                                      className="aspect-square w-full rounded-lg overflow-hidden border border-border hover:border-foreground/50 transition-colors"
                                      aria-label={`Add ${saved.name}`}
                                    >
                                      <Image
                                        src={saved.url}
                                        alt={saved.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                      />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeSavedReference(saved.id);
                                      }}
                                      aria-label="Remove from library"
                                      className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="size-2" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Input Area */}
                    <div className="flex-1 min-w-0">
                      {/* Inline reference thumbnails when present */}
                      <AnimatePresence>
                        {hasReferences && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-2 overflow-hidden"
                          >
                            <div className="flex items-center gap-1.5">
                              {referenceImages.slice(0, maxVisibleRefs).map((img) => (
                                <div key={img.id} className="relative group">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted dark:bg-zinc-800 border border-border dark:border-white/10">
                                    <Image
                                      src={img.preview}
                                      alt="Reference"
                                      width={32}
                                      height={32}
                                      className="w-full h-full object-cover"
                                    />
                                    {img.isUploading && (
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader className="size-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeReferenceImage(img.id)}
                                    aria-label="Remove"
                                    className="absolute -top-1 -right-1 size-4 rounded-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <X className="size-2" />
                                  </button>
                                </div>
                              ))}
                              {hiddenRefCount > 0 && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  +{hiddenRefCount} more
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Textarea */}
                      <div className="relative">
                        <motion.div
                          animate={{ height: isPromptExpanded ? "auto" : "44px" }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                              hasReferences
                                ? "Describe how to transform your images…"
                                : "What would you like to create?"
                            }
                            aria-label="Image generation prompt"
                            disabled={isGenerating}
                            rows={isPromptExpanded ? 5 : 1}
                            className={cn(
                              "w-full bg-transparent text-base text-foreground dark:text-zinc-200 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 resize-none focus:outline-none",
                              isPromptExpanded ? "min-h-[120px] py-2.5" : "h-[44px] py-2.5"
                            )}
                          />
                        </motion.div>

                        {/* Expand/Collapse & Character Count */}
                        <div className="absolute bottom-0.5 right-0 flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground dark:text-zinc-600 font-mono tabular-nums">
                            {prompt.length}
                          </span>
                          <button
                            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                            className="size-6 rounded-lg flex items-center justify-center text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 transition-colors"
                            aria-label={isPromptExpanded ? "Collapse prompt" : "Expand prompt"}
                          >
                            {isPromptExpanded ? (
                              <Minimize2 className="size-3.5" />
                            ) : (
                              <Maximize2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Empty State Suggestions */}
                      <AnimatePresence>
                        {showEmptyState && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2"
                          >
                            <div className="flex flex-wrap gap-1.5">
                              {promptSuggestions.slice(0, 4).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="px-2.5 py-1 rounded-full text-xs bg-muted/50 dark:bg-zinc-800/50 text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-zinc-200 transition-colors border border-transparent hover:border-border dark:hover:border-zinc-700"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Generate Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSubmit}
                          disabled={isGenerating || (!prompt.trim() && referenceImages.length === 0)}
                          className={cn(
                            "size-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 p-0",
                            "bg-foreground dark:bg-white text-background dark:text-zinc-900 hover:bg-foreground/90 dark:hover:bg-zinc-100",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Generate image"
                        >
                          {isGenerating ? (
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

                {/* All Settings Row */}
                <div className="flex items-center gap-2 px-4 pb-3 pt-1 overflow-x-auto">
                  {/* Spacer to align with prompt */}
                  <div className="w-11 shrink-0" />

                  {/* API Selector */}
                  <ApiSelector
                    apis={availableApis}
                    selectedApiId={selectedApiId}
                    onSelect={setSelectedApiId}
                    disabled={isGenerating || isLoadingApis}
                  />

                  {/* Divider */}
                  <div className="w-px h-4 bg-border dark:bg-zinc-700 shrink-0" />

                  {/* Aspect Ratio Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-300 transition-colors shrink-0"
                        aria-label={`Aspect ratio ${settings.aspectRatio}`}
                      >
                        <AspectRatioShape ratio={settings.aspectRatio} />
                        <span className="text-xs font-mono">{settings.aspectRatio}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="min-w-[160px]">
                      <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
                        Aspect Ratio
                      </DropdownMenuLabel>
                      {aspectRatioOptions.map((ratio) => (
                        <DropdownMenuItem
                          key={ratio.value}
                          onClick={() => updateSettings({ aspectRatio: ratio.value })}
                          className={cn(
                            "font-mono text-xs gap-3",
                            settings.aspectRatio === ratio.value && "bg-muted"
                          )}
                        >
                          <AspectRatioShape ratio={ratio.value} className="opacity-60" />
                          <span className="font-medium">{ratio.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {ratio.category}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Quality Pills */}
                  <div className="flex items-center gap-0.5 shrink-0" role="radiogroup" aria-label="Image quality">
                    {imageSizeOptions.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => updateSettings({ imageSize: size.value })}
                        role="radio"
                        aria-checked={settings.imageSize === size.value}
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-mono transition-colors",
                          settings.imageSize === size.value
                            ? "bg-muted dark:bg-zinc-700 text-foreground dark:text-zinc-200"
                            : "text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-muted/50 dark:hover:bg-zinc-800"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>

                  {/* Speed Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => updateSettings({
                          generationSpeed: settings.generationSpeed === "fast" ? "relaxed" : "fast"
                        })}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors shrink-0",
                          settings.generationSpeed === "fast"
                            ? "text-amber-500 dark:text-amber-400 hover:bg-amber-500/10"
                            : "text-muted-foreground dark:text-zinc-500 hover:bg-muted dark:hover:bg-zinc-800"
                        )}
                        aria-label={settings.generationSpeed === "fast" ? "Fast mode" : "Batch mode"}
                      >
                        {settings.generationSpeed === "fast" ? (
                          <Zap className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="size-3.5" aria-hidden="true" />
                        )}
                        <span className="text-[11px] font-mono">
                          {settings.generationSpeed === "fast" ? "Fast" : "Batch"}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {settings.generationSpeed === "fast" ? "Immediate generation" : "Lower cost, queued"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Count Pills */}
                  <div className="flex items-center gap-0.5 shrink-0" role="radiogroup" aria-label="Number of images">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateSettings({ outputCount: n })}
                        role="radio"
                        aria-checked={settings.outputCount === n}
                        className={cn(
                          "size-6 rounded-md text-[11px] font-mono transition-colors",
                          settings.outputCount === n
                            ? "bg-muted dark:bg-zinc-700 text-foreground dark:text-zinc-200"
                            : "text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-muted/50 dark:hover:bg-zinc-800"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Negative Prompt Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowNegative(!showNegative)}
                        className={cn(
                          "size-6 rounded-md flex items-center justify-center transition-colors shrink-0",
                          showNegative
                            ? "bg-muted dark:bg-zinc-700 text-foreground dark:text-zinc-200"
                            : "text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-muted/50 dark:hover:bg-zinc-800"
                        )}
                        aria-label="Toggle negative prompt"
                        aria-expanded={showNegative}
                      >
                        <Ban className="size-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Negative prompt</TooltipContent>
                  </Tooltip>

                  {/* Keyboard hint - pushed to end */}
                  {prompt.trim() && !isGenerating && (
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 ml-auto font-mono shrink-0">
                      ⏎ generate
                    </span>
                  )}

                  {/* Generating indicator */}
                  {isGenerating && (
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 ml-auto font-mono shrink-0 flex items-center gap-1.5">
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                      </span>
                      generating...
                    </span>
                  )}
                </div>

                {/* Negative Prompt Row */}
                <AnimatePresence>
                  {showNegative && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-11 shrink-0" />
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 dark:bg-zinc-800/50 border border-border dark:border-white/5">
                            <Ban className="size-3.5 text-muted-foreground dark:text-zinc-500 shrink-0" />
                            <input
                              type="text"
                              value={settings.negativePrompt}
                              onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                              placeholder="blurry, low quality, distorted…"
                              aria-label="Negative prompt"
                              className="flex-1 bg-transparent text-sm text-foreground dark:text-zinc-300 placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FileUpload>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
