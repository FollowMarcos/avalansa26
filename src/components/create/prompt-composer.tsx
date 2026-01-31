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
        <div className="max-w-3xl mx-auto">
          <FileUpload
            onFilesAdded={addReferenceImages}
            multiple
            accept="image/*"
            disabled={isGenerating}
          >
            <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
              {/* Reference Images Row */}
              <AnimatePresence>
                {hasReferences && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2 flex-shrink-0">
                        <Images className="size-3.5" />
                        <span>Image Reference</span>
                      </div>
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
                          </div>
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
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border overflow-x-auto">
                {/* API Selector */}
                <ApiSelector
                  apis={availableApis}
                  selectedApiId={selectedApiId}
                  onSelect={setSelectedApiId}
                  disabled={isGenerating || isLoadingApis}
                />

                <div className="w-px h-5 bg-border" />

                {/* Aspect Ratio */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 gap-1 rounded-lg font-mono text-xs"
                    >
                      <span>{settings.aspectRatio}</span>
                      <ChevronUp className="size-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="min-w-[140px]">
                    <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
                      Aspect Ratio
                    </DropdownMenuLabel>
                    {aspectRatioOptions.map((ratio) => (
                      <DropdownMenuItem
                        key={ratio.value}
                        onClick={() => updateSettings({ aspectRatio: ratio.value })}
                        className={cn(
                          "font-mono",
                          settings.aspectRatio === ratio.value && "bg-muted"
                        )}
                      >
                        <span className="font-medium">{ratio.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {ratio.category}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-border" />

                {/* Quality / Image Size */}
                <div
                  role="radiogroup"
                  aria-label="Image quality"
                  className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5"
                >
                  {imageSizeOptions.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => updateSettings({ imageSize: size.value })}
                      role="radio"
                      aria-checked={settings.imageSize === size.value}
                      aria-label={`${size.label} quality`}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-mono transition-colors",
                        settings.imageSize === size.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-border" />

                {/* Output Count */}
                <div
                  role="radiogroup"
                  aria-label="Number of images to generate"
                  className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => updateSettings({ outputCount: count })}
                      role="radio"
                      aria-checked={settings.outputCount === count}
                      aria-label={`Generate ${count} image${count > 1 ? "s" : ""}`}
                      className={cn(
                        "w-6 h-6 rounded-md text-xs font-mono transition-colors flex items-center justify-center",
                        settings.outputCount === count
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-border" />

                {/* Generation Speed */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="radiogroup"
                      aria-label="Generation speed"
                      className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5"
                    >
                      <button
                        onClick={() => updateSettings({ generationSpeed: "fast" })}
                        role="radio"
                        aria-checked={settings.generationSpeed === "fast"}
                        aria-label="Fast generation"
                        className={cn(
                          "h-6 px-2 rounded-md text-xs font-mono transition-colors flex items-center gap-1",
                          settings.generationSpeed === "fast"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Zap className="size-3" aria-hidden="true" />
                        <span className="hidden sm:inline">Fast</span>
                      </button>
                      <button
                        onClick={() => updateSettings({ generationSpeed: "relaxed" })}
                        role="radio"
                        aria-checked={settings.generationSpeed === "relaxed"}
                        aria-label="Relaxed generation"
                        className={cn(
                          "h-6 px-2 rounded-md text-xs font-mono transition-colors flex items-center gap-1",
                          settings.generationSpeed === "relaxed"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Clock className="size-3" aria-hidden="true" />
                        <span className="hidden sm:inline">Relaxed</span>
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium">Generation Speed</p>
                    <p className="text-xs text-muted-foreground">
                      Relaxed uses batch API for lower cost
                    </p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex-1" />

                {/* Negative Prompt Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNegative(!showNegative)}
                      className={cn(
                        "size-8 rounded-lg",
                        showNegative && "bg-muted"
                      )}
                    >
                      <Ban className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Negative prompt</TooltipContent>
                </Tooltip>
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
                    <div className="px-3 py-2 bg-muted/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Ban className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">
                          Negative (elements to avoid)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={settings.negativePrompt}
                        onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                        placeholder="blurry, low quality, distorted, watermark..."
                        className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Input Area */}
              <div className="flex items-end gap-2 p-2">
                {/* Image Upload Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FileUploadTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-xl flex-shrink-0",
                            hasReferences
                              ? "text-foreground bg-muted"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          disabled={isGenerating || referenceImages.length >= 14}
                        >
                          <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
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
                        ? "Describe how to transform or style your images..."
                        : "Describe the image you want to create..."
                    }
                    disabled={isGenerating}
                    rows={isPromptExpanded ? 6 : 1}
                    className={cn(
                      "w-full bg-transparent text-sm resize-none focus:outline-none",
                      "placeholder:text-muted-foreground",
                      isPromptExpanded ? "min-h-[144px]" : "min-h-[40px] py-2.5"
                    )}
                    style={{
                      height: isPromptExpanded ? "auto" : undefined,
                    }}
                  />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Character Count */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={`Prompt length: ${promptLength} characters`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {promptLength}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Prompt length: {promptLength} characters</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Expand/Collapse */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
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

                  {/* Generate Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isGenerating || (!prompt.trim() && referenceImages.length === 0)}
                    className={cn(
                      "h-10 px-4 rounded-xl font-medium",
                      "bg-foreground text-background hover:bg-foreground/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? (
                      <Loader variant="circular" size="sm" className="border-background" />
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-2" strokeWidth={1.5} />
                        Generate
                      </>
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
