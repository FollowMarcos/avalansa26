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
  Images,
  Maximize2,
  Minimize2,
  Zap,
  Clock,
  Ban,
  Bookmark,
  Library,
  Trash2,
  Settings,
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

function AspectRatioShape({ ratio, className }: { ratio: AspectRatio; className?: string }) {
  const getShapeDimensions = (r: AspectRatio): { width: number; height: number } => {
    const [w, h] = r.split(":").map(Number);
    const maxSize = 14;
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
      className={cn("border-2 border-current rounded-[2px]", className)}
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

  const [showSettings, setShowSettings] = React.useState(false);
  const [showNegative, setShowNegative] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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

  const hasReferences = referenceImages.length > 0;

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
            {/* Floating Island Container */}
            <div className="relative">
              {/* Shadow layers for floating effect */}
              <div className="absolute inset-0 translate-y-4 bg-black/40 rounded-3xl blur-2xl" aria-hidden="true" />
              <div className="absolute inset-0 translate-y-2 bg-black/20 rounded-3xl blur-xl" aria-hidden="true" />

              <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                {/* Settings Drawer */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-800/30 border-b border-white/5">
                        {/* First row: API, Ratio, Quality, Speed */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* API Selector */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">API</span>
                            <ApiSelector
                              apis={availableApis}
                              selectedApiId={selectedApiId}
                              onSelect={setSelectedApiId}
                              disabled={isGenerating || isLoadingApis}
                            />
                          </div>

                          {/* Aspect Ratio */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ratio</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                                  aria-label={`Aspect ratio ${settings.aspectRatio}`}
                                >
                                  <AspectRatioShape ratio={settings.aspectRatio} className="text-zinc-400" />
                                  <span className="font-mono text-zinc-300">{settings.aspectRatio}</span>
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
                          </div>

                          {/* Quality */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Quality</span>
                            <div className="flex items-center gap-1">
                              {imageSizeOptions.map((size) => (
                                <button
                                  key={size.value}
                                  onClick={() => updateSettings({ imageSize: size.value })}
                                  className={cn(
                                    "px-2.5 py-2 rounded-xl text-xs font-mono transition-colors",
                                    settings.imageSize === size.value
                                      ? "bg-white text-zinc-900"
                                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                  )}
                                  aria-label={`Quality ${size.label}`}
                                >
                                  {size.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Speed */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Speed</span>
                            <button
                              onClick={() => updateSettings({
                                generationSpeed: settings.generationSpeed === "fast" ? "relaxed" : "fast"
                              })}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-sm transition-colors"
                              aria-label={settings.generationSpeed === "fast" ? "Fast mode" : "Batch mode"}
                            >
                              {settings.generationSpeed === "fast" ? (
                                <Zap className="size-4 text-amber-400" aria-hidden="true" />
                              ) : (
                                <Clock className="size-4 text-zinc-400" aria-hidden="true" />
                              )}
                              <span className={cn(
                                "font-mono",
                                settings.generationSpeed === "fast" ? "text-amber-400" : "text-zinc-400"
                              )}>
                                {settings.generationSpeed === "fast" ? "Fast" : "Batch"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Second row: Count, Negative, References, Library */}
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                          {/* Count */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Count</span>
                            <div className="flex items-center gap-1" role="radiogroup" aria-label="Number of images">
                              {[1, 2, 3, 4].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => updateSettings({ outputCount: n })}
                                  role="radio"
                                  aria-checked={settings.outputCount === n}
                                  className={cn(
                                    "size-8 rounded-lg text-xs font-mono transition-colors",
                                    settings.outputCount === n
                                      ? "bg-white text-zinc-900"
                                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                  )}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Negative Prompt Toggle */}
                          <button
                            onClick={() => setShowNegative(!showNegative)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors mt-auto",
                              showNegative ? "bg-zinc-700" : "bg-zinc-800 hover:bg-zinc-700"
                            )}
                            aria-label="Toggle negative prompt"
                            aria-expanded={showNegative}
                          >
                            <Ban className="size-4 text-zinc-400" aria-hidden="true" />
                            <span className="text-zinc-400 font-mono">Negative</span>
                          </button>

                          {/* References and Library */}
                          <div className="flex items-center gap-2 ml-auto">
                            <FileUploadTrigger asChild>
                              <button
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                                aria-label="Add reference images"
                                disabled={isGenerating || referenceImages.length >= 14}
                              >
                                <ImagePlus className="size-4 text-zinc-400" aria-hidden="true" />
                                <span className="text-zinc-400 font-mono">References</span>
                                {hasReferences && (
                                  <span className="text-xs text-zinc-500 font-mono">{referenceImages.length}/14</span>
                                )}
                              </button>
                            </FileUploadTrigger>

                            {savedReferences.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                                    aria-label="Open saved library"
                                  >
                                    <Library className="size-4 text-zinc-400" aria-hidden="true" />
                                    <span className="text-zinc-400 font-mono">Library</span>
                                    <span className="text-xs text-zinc-500 font-mono">{savedReferences.length}</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" side="top" className="w-64 max-h-64 overflow-auto">
                                  <DropdownMenuLabel className="text-xs font-mono">Saved References</DropdownMenuLabel>
                                  <div className="grid grid-cols-4 gap-1 p-2">
                                    {savedReferences.map((saved) => (
                                      <div key={saved.id} className="relative group">
                                        <button
                                          onClick={() => addSavedReferenceToActive(saved)}
                                          className="w-12 h-12 rounded-lg overflow-hidden border border-border hover:border-foreground/50 transition-colors"
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
                                          <Trash2 className="size-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {/* Negative Prompt Input */}
                        {showNegative && (
                          <div className="mt-4">
                            <input
                              type="text"
                              value={settings.negativePrompt}
                              onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                              placeholder="blurry, low quality, distorted, watermark…"
                              aria-label="Negative prompt"
                              className="w-full px-3 py-2 rounded-xl bg-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reference Images Row (when visible) */}
                <AnimatePresence>
                  {hasReferences && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-zinc-800/20">
                        <div className="flex items-center gap-1 text-xs text-zinc-500 mr-2 flex-shrink-0">
                          <Images className="size-3.5" />
                          <span className="font-mono">References</span>
                        </div>

                        {referenceImages.map((img) => (
                          <div key={img.id} className="relative flex-shrink-0 group">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10">
                              <Image
                                src={img.preview}
                                alt="Reference"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                              {img.isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader className="size-4 text-white" />
                                </div>
                              )}
                            </div>
                            {img.storagePath && !img.isUploading && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => saveReferenceImage(img)}
                                    aria-label="Save to library"
                                    className="absolute -top-1 -left-1 size-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-zinc-900"
                                  >
                                    <Bookmark className="size-2.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Save to library</TooltipContent>
                              </Tooltip>
                            )}
                            <button
                              onClick={() => removeReferenceImage(img.id)}
                              aria-label="Remove reference image"
                              className="absolute -top-1 -right-1 size-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:border-red-500"
                            >
                              <X className="size-2.5 text-zinc-400 group-hover:text-white" />
                            </button>
                          </div>
                        ))}

                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-auto font-mono">
                          {referenceImages.length}/14
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Input Row */}
                <div className="flex items-end gap-3 p-4">
                  {/* Settings Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                          "size-12 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                          showSettings
                            ? "bg-white text-zinc-900"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        )}
                        aria-label="Toggle settings"
                        aria-expanded={showSettings}
                      >
                        <Settings className="size-5" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Settings</TooltipContent>
                  </Tooltip>

                  {/* Expandable Prompt Input */}
                  <div className="flex-1 min-w-0 relative">
                    <motion.div
                      animate={{ height: isPromptExpanded ? "auto" : "48px" }}
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
                            ? "Describe how to transform or style your images…"
                            : "What would you like to create?"
                        }
                        aria-label="Image generation prompt"
                        disabled={isGenerating}
                        rows={isPromptExpanded ? 6 : 1}
                        className={cn(
                          "w-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-500 resize-none focus:outline-none",
                          isPromptExpanded ? "min-h-[160px] py-3" : "h-[48px] py-3"
                        )}
                      />
                    </motion.div>

                    {/* Expand/Collapse & Character Count */}
                    <div className="absolute bottom-1 right-0 flex items-center gap-1">
                      <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
                        {prompt.length}
                      </span>
                      <button
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        className="size-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
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

                  {/* Generate Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isGenerating || (!prompt.trim() && referenceImages.length === 0)}
                    className={cn(
                      "size-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 p-0",
                      "bg-white text-zinc-900 hover:bg-zinc-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    aria-label="Generate image"
                  >
                    {isGenerating ? (
                      <Loader variant="circular" size="sm" className="border-zinc-900" />
                    ) : (
                      <Sparkles className="size-5" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </FileUpload>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
