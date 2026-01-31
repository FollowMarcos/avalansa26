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
  ChevronUp,
  Maximize2,
  Minimize2,
  Zap,
  Clock,
  Ban,
  Bookmark,
  BookmarkCheck,
  Library,
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
  const promptLength = prompt.length;

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
            <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
              {/* Reference Images Row */}
              <AnimatePresence>
                {(hasReferences || savedReferences.length > 0) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2 flex-shrink-0">
                        <Images className="size-3.5" />
                        <span>References</span>
                      </div>

                      {/* Saved references library picker */}
                      {savedReferences.length > 0 && (
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors flex-shrink-0"
                                  aria-label="Add from saved library"
                                >
                                  <Library className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Saved library ({savedReferences.length})</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="start" side="top" className="w-64 max-h-64 overflow-auto">
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

                      {/* Active reference images */}
                      {referenceImages.map((img) => (
                        <div key={img.id} className="relative flex-shrink-0 group">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border">
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
                          {/* Save to library button */}
                          {img.storagePath && !img.isUploading && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => saveReferenceImage(img)}
                                  aria-label="Save to library"
                                  className="absolute -top-1 -left-1 size-4 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                >
                                  <Bookmark className="size-2.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Save to library</TooltipContent>
                            </Tooltip>
                          )}
                          {/* Remove button */}
                          <button
                            onClick={() => removeReferenceImage(img.id)}
                            aria-label="Remove reference image"
                            className="absolute -top-1 -right-1 size-4 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="size-2.5 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto font-mono">
                        {referenceImages.length}/14
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings Row */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
                {/* API Selector */}
                <ApiSelector
                  apis={availableApis}
                  selectedApiId={selectedApiId}
                  onSelect={setSelectedApiId}
                  disabled={isGenerating || isLoadingApis}
                />

                <div className="w-px h-5 bg-border mx-1" />

                {/* Aspect Ratio - Compact Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 gap-1 rounded-lg font-mono text-xs"
                        >
                          <span>{settings.aspectRatio}</span>
                          <ChevronUp className="size-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Aspect Ratio</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" side="top" className="min-w-[140px]">
                    <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
                      Aspect Ratio
                    </DropdownMenuLabel>
                    {aspectRatioOptions.map((ratio) => (
                      <DropdownMenuItem
                        key={ratio.value}
                        onClick={() => updateSettings({ aspectRatio: ratio.value })}
                        className={cn(
                          "font-mono text-xs",
                          settings.aspectRatio === ratio.value && "bg-muted"
                        )}
                      >
                        <span className="font-medium">{ratio.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {ratio.category}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Quality - Compact Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 gap-1 rounded-lg font-mono text-xs"
                        >
                          <span>{settings.imageSize}</span>
                          <ChevronUp className="size-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Quality</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" side="top" className="min-w-[100px]">
                    <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
                      Quality
                    </DropdownMenuLabel>
                    {imageSizeOptions.map((size) => (
                      <DropdownMenuItem
                        key={size.value}
                        onClick={() => updateSettings({ imageSize: size.value })}
                        className={cn(
                          "font-mono text-xs",
                          settings.imageSize === size.value && "bg-muted"
                        )}
                      >
                        {size.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Output Count - Compact Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 gap-1 rounded-lg font-mono text-xs"
                        >
                          <span>×{settings.outputCount}</span>
                          <ChevronUp className="size-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Images per batch</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" side="top" className="min-w-[100px]">
                    <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
                      Count
                    </DropdownMenuLabel>
                    {[1, 2, 3, 4].map((count) => (
                      <DropdownMenuItem
                        key={count}
                        onClick={() => updateSettings({ outputCount: count })}
                        className={cn(
                          "font-mono text-xs",
                          settings.outputCount === count && "bg-muted"
                        )}
                      >
                        {count} image{count > 1 ? "s" : ""}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Generation Speed - Toggle Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSettings({
                        generationSpeed: settings.generationSpeed === "fast" ? "relaxed" : "fast"
                      })}
                      aria-label={settings.generationSpeed === "fast" ? "Fast mode" : "Relaxed mode"}
                      className="h-8 px-2.5 gap-1.5 rounded-lg font-mono text-xs"
                    >
                      {settings.generationSpeed === "fast" ? (
                        <>
                          <Zap className="size-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Fast</span>
                        </>
                      ) : (
                        <>
                          <Clock className="size-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Batch</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium">{settings.generationSpeed === "fast" ? "Fast Mode" : "Batch Mode"}</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.generationSpeed === "fast"
                        ? "Immediate generation"
                        : "Lower cost, queued processing"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Negative Prompt Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNegative(!showNegative)}
                      aria-label="Toggle negative prompt"
                      aria-expanded={showNegative}
                      className={cn(
                        "size-8 rounded-lg",
                        showNegative && "bg-muted"
                      )}
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Negative prompt</TooltipContent>
                </Tooltip>

                <div className="flex-1" />

                {/* Generate Button - Now in settings row */}
                <Button
                  onClick={handleSubmit}
                  disabled={isGenerating || (!prompt.trim() && referenceImages.length === 0)}
                  className={cn(
                    "h-8 px-4 rounded-lg font-medium text-sm gap-1.5",
                    "bg-foreground text-background hover:bg-foreground/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isGenerating ? (
                    <Loader variant="circular" size="sm" className="border-background" />
                  ) : (
                    <>
                      <Sparkles className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                      <span>Generate</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Negative Prompt Expansion */}
              <AnimatePresence>
                {showNegative && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border"
                  >
                    <div className="px-4 py-3 bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Ban className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground font-mono">
                          Negative (elements to avoid)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={settings.negativePrompt}
                        onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                        placeholder="blurry, low quality, distorted, watermark…"
                        aria-label="Negative prompt - elements to avoid in generation"
                        className="w-full bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Input Area */}
              <div className="flex items-end gap-3 p-3">
                {/* Image Upload Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FileUploadTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-11 rounded-xl flex-shrink-0",
                            hasReferences
                              ? "text-foreground bg-muted"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          disabled={isGenerating || referenceImages.length >= 14}
                        >
                          <ImagePlus className="size-5" strokeWidth={1.5} />
                        </Button>
                      </FileUploadTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add reference images (up to 14)</TooltipContent>
                </Tooltip>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      hasReferences
                        ? "Describe how to transform or style your images…"
                        : "Describe the image you want to create…"
                    }
                    aria-label="Image generation prompt"
                    disabled={isGenerating}
                    rows={isPromptExpanded ? 6 : 1}
                    className={cn(
                      "w-full bg-transparent text-base resize-none focus:outline-none",
                      "placeholder:text-muted-foreground",
                      isPromptExpanded ? "min-h-[160px]" : "min-h-[44px] py-3"
                    )}
                    style={{
                      height: isPromptExpanded ? "auto" : undefined,
                    }}
                  />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Character Count */}
                  <span
                    aria-label={`Prompt length: ${promptLength} characters`}
                    className="px-2 py-1 text-xs font-mono text-muted-foreground tabular-nums"
                  >
                    {promptLength}
                  </span>

                  {/* Expand/Collapse */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        aria-label={isPromptExpanded ? "Collapse prompt" : "Expand prompt"}
                        className="size-8 rounded-lg"
                      >
                        {isPromptExpanded ? (
                          <Minimize2 className="size-4" />
                        ) : (
                          <Maximize2 className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {isPromptExpanded ? "Collapse" : "Expand"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </FileUpload>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
