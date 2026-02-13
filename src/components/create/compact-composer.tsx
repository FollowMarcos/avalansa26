"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, type AspectRatio, type ImageSize } from "./create-context";
import { ApiSelector } from "./api-selector";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  ImagePlus,
  Sparkles,
  X,
  Trash2,
  Bookmark,
  Search,
  Star,
  Loader2,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { searchPrompts } from "@/utils/supabase/prompts.server";
import type { Prompt } from "@/types/prompt";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const imageSizeOptions: {
  value: ImageSize;
  label: string;
  desc: string;
}[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function AspectRatioShape({
  ratio,
  className,
}: {
  ratio: AspectRatio;
  className?: string;
}) {
  const [w, h] = ratio.split(":").map(Number);
  const maxSize = 14;
  const width = w >= h ? maxSize : Math.round((w / h) * maxSize);
  const height = h >= w ? maxSize : Math.round((h / w) * maxSize);
  return (
    <div
      className={cn("border-2 border-current rounded-sm", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// CompactComposer
// ---------------------------------------------------------------------------

interface CompactComposerProps {
  onSaveToVault?: () => void;
}

/**
 * Compact inline prompt composer for the gallery-mode top bar.
 * Single-line input with refs, settings popover, and generate button.
 */
export function CompactComposer({ onSaveToVault }: CompactComposerProps) {
  const {
    prompt,
    setPrompt,
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
    allowedImageSizes,
    allowedAspectRatios,
    maxOutputCount,
  } = useCreate();

  const prefersReducedMotion = useReducedMotion();

  // Prompt search state
  const [promptSearchOpen, setPromptSearchOpen] = React.useState(false);
  const [promptSearchQuery, setPromptSearchQuery] = React.useState("");
  const [promptSearchResults, setPromptSearchResults] = React.useState<
    Prompt[]
  >([]);
  const [isSearchingPrompts, setIsSearchingPrompts] = React.useState(false);
  const promptSearchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (!promptSearchOpen) {
      setPromptSearchQuery("");
      setPromptSearchResults([]);
    }
  }, [promptSearchOpen]);

  React.useEffect(() => {
    if (promptSearchTimeoutRef.current)
      clearTimeout(promptSearchTimeoutRef.current);
    const q = promptSearchQuery.trim();
    if (q.length < 2) {
      setPromptSearchResults([]);
      setIsSearchingPrompts(false);
      return;
    }
    setIsSearchingPrompts(true);
    promptSearchTimeoutRef.current = setTimeout(async () => {
      const results = await searchPrompts(q, 8);
      setPromptSearchResults(results);
      setIsSearchingPrompts(false);
    }, 300);
    return () => {
      if (promptSearchTimeoutRef.current)
        clearTimeout(promptSearchTimeoutRef.current);
    };
  }, [promptSearchQuery]);

  const handleSelectSearchResult = (result: Prompt) => {
    setPrompt(result.prompt_text);
    if (result.negative_prompt) {
      updateSettings({ negativePrompt: result.negative_prompt });
    }
    setPromptSearchOpen(false);
  };

  const handleSubmit = () => {
    if (hasAvailableSlots && (prompt.trim() || referenceImages.length > 0)) {
      generate();
    }
  };

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
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
    },
    [addReferenceImages],
  );

  const hasReferences = referenceImages.length > 0;

  const filteredAspectRatios = React.useMemo(
    () =>
      aspectRatioOptions.filter((opt) =>
        allowedAspectRatios.includes(opt.value),
      ),
    [allowedAspectRatios],
  );

  const filteredImageSizes = React.useMemo(
    () =>
      imageSizeOptions.filter((opt) => allowedImageSizes.includes(opt.value)),
    [allowedImageSizes],
  );

  return (
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      {/* References button */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center transition-colors shrink-0 relative focus-visible:ring-2 focus-visible:ring-ring",
                  hasReferences
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800",
                )}
                aria-label="Reference images"
              >
                <ImagePlus
                  className="size-5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {hasReferences && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-background dark:bg-zinc-900 border-2 border-primary text-[10px] font-mono font-medium text-primary flex items-center justify-center">
                    {referenceImages.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {hasReferences
              ? `${referenceImages.length} references`
              : "Add references"}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" side="bottom" className="w-72 p-0">
          <FileUpload
            onFilesAdded={addReferenceImages}
            multiple
            accept="image/*"
            disabled={!hasAvailableSlots}
          >
            <div className="p-3 space-y-3">
              {/* Active references */}
              {hasReferences && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground">
                    Active References
                  </div>
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
                        <button
                          onClick={() => removeReferenceImage(img.id)}
                          aria-label="Remove reference"
                          className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-background dark:bg-zinc-900 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <X className="size-2.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right font-mono tabular-nums">
                    {referenceImages.length}/14
                  </div>
                </div>
              )}

              {/* Upload button */}
              <FileUploadTrigger asChild>
                <button
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted dark:bg-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-700 text-sm transition-colors border-2 border-dashed border-border dark:border-zinc-700"
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
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Your Library
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                      {savedReferences.length} saved
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto overscroll-contain">
                    {savedReferences.map((saved) => (
                      <div key={saved.id} className="relative group">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => addSavedReferenceToActive(saved)}
                              className="aspect-square w-full rounded-lg overflow-hidden border border-border hover:border-foreground/50 transition-colors"
                              aria-label={`Add ${saved.name || "reference"}`}
                            >
                              <Image
                                src={saved.url}
                                alt={saved.name || "Reference"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {saved.name || "Reference image"}
                          </TooltipContent>
                        </Tooltip>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedReference(saved.id);
                          }}
                          aria-label="Delete from library"
                          className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Trash2 className="size-2.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">
                    Click to use &middot; Uploads are auto-saved
                  </p>
                </>
              )}

              {savedReferences.length === 0 && !hasReferences && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Upload images to use as references.
                </p>
              )}
            </div>
          </FileUpload>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Prompt input (single line) */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        onPaste={handlePaste}
        placeholder={
          hasReferences
            ? "Describe how to transform\u2026"
            : "What would you like to create?"
        }
        name="compact-prompt"
        aria-label="Image generation prompt"
        autoComplete="off"
        className="flex-1 min-w-[120px] h-10 px-4 text-base bg-muted/50 dark:bg-zinc-800/50 rounded-xl border border-transparent hover:border-border dark:hover:border-zinc-700 focus:border-border dark:focus:border-zinc-700 text-foreground dark:text-zinc-300 placeholder:text-muted-foreground dark:placeholder:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      />

      {/* Prompt search */}
      <Popover open={promptSearchOpen} onOpenChange={setPromptSearchOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Search saved prompts"
            className={cn(
              "size-10 rounded-xl flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring",
              promptSearchOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800",
            )}
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" className="w-80 p-0">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2">
              <Search
                className="size-3.5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <input
                type="text"
                value={promptSearchQuery}
                onChange={(e) => setPromptSearchQuery(e.target.value)}
                placeholder={"Search saved prompts\u2026"}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search saved prompts"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              {isSearchingPrompts && (
                <Loader2
                  className="size-3.5 text-muted-foreground animate-spin shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {promptSearchQuery.trim().length < 2 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Type to search your saved prompts
              </p>
            ) : promptSearchResults.length === 0 && !isSearchingPrompts ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No prompts found
              </p>
            ) : (
              <div className="p-1">
                {promptSearchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {result.is_favorite && (
                        <Star
                          className="size-3 text-amber-500 fill-amber-500 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-sm font-medium truncate">
                        {result.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.prompt_text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Settings — shows current values, opens popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Generation settings"
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-muted/50 dark:bg-zinc-800/50 hover:bg-muted dark:hover:bg-zinc-800 border border-transparent hover:border-border dark:hover:border-zinc-700 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AspectRatioShape
              ratio={settings.aspectRatio}
              className="text-muted-foreground"
            />
            <span className="text-sm text-foreground dark:text-zinc-300 tabular-nums">
              {settings.aspectRatio}
            </span>
            <span className="text-sm text-muted-foreground">&middot;</span>
            <span className="text-sm text-foreground dark:text-zinc-300">
              {settings.imageSize}
            </span>
            <span className="text-sm text-muted-foreground">&middot;</span>
            <span className="text-sm text-foreground dark:text-zinc-300 tabular-nums">
              &times;{Math.min(settings.outputCount, maxOutputCount)}
            </span>
            <ChevronDown
              className="size-3.5 text-muted-foreground ml-0.5"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" className="w-80 p-3">
          <div className="space-y-4">
            {/* API */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                API
              </span>
              <ApiSelector
                apis={availableApis}
                selectedApiId={selectedApiId}
                onSelect={setSelectedApiId}
                disabled={!hasAvailableSlots || isLoadingApis}
              />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Aspect Ratio
              </span>
              <div
                role="listbox"
                aria-label="Aspect ratio options"
                className="grid grid-cols-3 gap-1"
              >
                {filteredAspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    role="option"
                    aria-selected={settings.aspectRatio === ratio.value}
                    onClick={() =>
                      updateSettings({ aspectRatio: ratio.value })
                    }
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                      settings.aspectRatio === ratio.value
                        ? "bg-primary/10 dark:bg-primary/20 ring-1 ring-primary"
                        : "hover:bg-muted dark:hover:bg-zinc-800",
                    )}
                  >
                    <AspectRatioShape
                      ratio={ratio.value}
                      className={
                        settings.aspectRatio === ratio.value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    />
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        settings.aspectRatio === ratio.value
                          ? "text-primary font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {ratio.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Quality
              </span>
              <div
                role="radiogroup"
                aria-label="Image quality"
                className="flex items-center h-8 p-0.5 rounded-lg bg-muted/50 dark:bg-zinc-800/50"
              >
                {filteredImageSizes.map((size) => (
                  <Tooltip key={size.value}>
                    <TooltipTrigger asChild>
                      <button
                        role="radio"
                        aria-checked={settings.imageSize === size.value}
                        onClick={() =>
                          updateSettings({ imageSize: size.value })
                        }
                        className={cn(
                          "h-7 px-4 rounded-md text-xs font-medium transition-colors flex-1",
                          settings.imageSize === size.value
                            ? "bg-background dark:bg-zinc-700 text-foreground dark:text-zinc-100 shadow-sm"
                            : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-300",
                        )}
                      >
                        {size.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {size.desc}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Count
              </span>
              <div
                role="spinbutton"
                aria-label="Number of images"
                aria-valuenow={Math.min(settings.outputCount, maxOutputCount)}
                aria-valuemin={1}
                aria-valuemax={maxOutputCount}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    updateSettings({
                      outputCount: Math.min(
                        maxOutputCount,
                        settings.outputCount + 1,
                      ),
                    });
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    updateSettings({
                      outputCount: Math.max(1, settings.outputCount - 1),
                    });
                  }
                }}
                className="flex items-center h-8 rounded-lg bg-muted/50 dark:bg-zinc-800/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <button
                  onClick={() =>
                    updateSettings({
                      outputCount: Math.max(1, settings.outputCount - 1),
                    })
                  }
                  disabled={settings.outputCount <= 1}
                  className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors touch-manipulation"
                  aria-label="Decrease"
                  tabIndex={-1}
                >
                  <Minus className="size-3.5" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {Math.min(settings.outputCount, maxOutputCount)}
                </span>
                <button
                  onClick={() =>
                    updateSettings({
                      outputCount: Math.min(
                        maxOutputCount,
                        settings.outputCount + 1,
                      ),
                    })
                  }
                  disabled={settings.outputCount >= maxOutputCount}
                  className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors touch-manipulation"
                  aria-label="Increase"
                  tabIndex={-1}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Negative prompt */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Negative Prompt
              </span>
              <input
                type="text"
                value={settings.negativePrompt}
                onChange={(e) =>
                  updateSettings({ negativePrompt: e.target.value })
                }
                placeholder={"blurry, watermark\u2026"}
                aria-label="Negative prompt"
                autoComplete="off"
                className="w-full h-8 px-3 text-sm bg-muted/50 dark:bg-zinc-800/50 rounded-lg border border-transparent focus:border-border dark:focus:border-zinc-700 text-foreground dark:text-zinc-300 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Save to vault */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onSaveToVault}
            disabled={!prompt.trim()}
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl shrink-0"
            aria-label="Save to vault"
          >
            <Bookmark
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save to Vault</TooltipContent>
      </Tooltip>

      {/* Generate */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSubmit}
            disabled={
              !hasAvailableSlots ||
              (!prompt.trim() && referenceImages.length === 0)
            }
            className="h-10 rounded-xl gap-2 px-4 bg-foreground dark:bg-white text-background dark:text-zinc-900 hover:bg-foreground/90 dark:hover:bg-zinc-100 disabled:opacity-50 shrink-0"
            aria-label="Generate image"
          >
            {isGenerating && !hasAvailableSlots ? (
              <Loader
                variant="circular"
                size="sm"
                className="border-background dark:border-zinc-900"
              />
            ) : (
              <Sparkles
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-medium">Generate</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Generate (Enter)</TooltipContent>
      </Tooltip>

      {/* Active generation indicator */}
      {activeGenerations > 0 && (
        <span className="text-[10px] text-muted-foreground font-mono shrink-0 flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75",
                !prefersReducedMotion && "animate-ping",
              )}
            />
            <span className="relative inline-flex rounded-full size-1.5 bg-amber-500" />
          </span>
          <span className="tabular-nums">{activeGenerations}</span>
        </span>
      )}
    </div>
  );
}
