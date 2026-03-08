"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useCreate } from "@/components/create/create-context";
import { ApiSelector } from "@/components/create/api-selector";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
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
    addReferenceImageFromUrl,
    removeReferenceImage,
    addSavedReferenceToActive,
    removeSavedReference,
  } = useCreate();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showNegative, setShowNegative] = React.useState(false);
  const [refModalOpen, setRefModalOpen] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dragCounterRef = React.useRef(0);

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
      if ((prompt.trim() || referenceImages.length > 0) && activeGenerations < 4 && selectedApiId) {
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

  // Drag-and-drop from history feed
  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("application/x-editor-image") || e.dataTransfer.types.includes("text/uri-list")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const editorData = e.dataTransfer.getData("application/x-editor-image");
    if (editorData) {
      try {
        const { url } = JSON.parse(editorData);
        if (url) addReferenceImageFromUrl(url);
        return;
      } catch { /* fall through */ }
    }

    const uri = e.dataTransfer.getData("text/uri-list");
    if (uri && uri.startsWith("http")) {
      addReferenceImageFromUrl(uri);
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) addReferenceImages(files);
  }, [addReferenceImageFromUrl, addReferenceImages]);

  const canGenerate = (prompt.trim().length > 0 || referenceImages.length > 0) && activeGenerations < 4 && !!selectedApiId;

  const disabledReason = !selectedApiId
    ? "Select a model first"
    : !prompt.trim()
    ? "Enter a prompt"
    : activeGenerations >= 4
    ? "Max 4 concurrent jobs"
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <FileUpload onFilesAdded={addReferenceImages} multiple accept="image/*" disabled={!hasAvailableSlots}>
      <div
        className={cn(
          "relative border border-[var(--steel-faint)] border-t-2 border-t-[var(--nerv-orange)] bg-[var(--void)] px-3 py-2 space-y-2 mx-3 mb-3 transition-all duration-100",
          isDragOver && "border-[var(--wire-cyan)] bg-[var(--wire-cyan-glow)]"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--wire-cyan-glow)] pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 border border-[var(--wire-cyan)] bg-[var(--void)]">
                <ImagePlus className="size-4 text-[var(--wire-cyan)]" />
                <span className="text-xs font-medium text-[var(--wire-cyan)] uppercase tracking-[0.1em]">DROP TO ADD REFERENCE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Institutional header with stamp label */}
        <div className="flex items-center gap-2">
          <span className="text-base tracking-[0.15em] text-[var(--nerv-orange)] font-[family-name:var(--font-bebas-neue)] glow-orange">
            GENERATION SYSTEM
          </span>
          <span className="text-[8px] tracking-[0.1em] text-[var(--steel-dim)] font-[family-name:var(--font-noto-sans-jp)]">
            指令入力
          </span>
          <div className="flex-1 h-px bg-[var(--nerv-orange-dim)]/20" />
          {/* Active generation LEDs */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i < activeGenerations
                    ? "bg-[var(--nerv-orange)] nerv-led-pulse"
                    : "bg-[var(--steel-faint)]"
                )}
                style={i < activeGenerations ? { boxShadow: "0 0 4px var(--nerv-orange)" } : undefined}
              />
            ))}
            <span className="text-[7px] text-[var(--steel-dim)] uppercase tracking-[0.08em] ml-0.5">
              SLOTS
            </span>
          </div>
        </div>

        {/* Inline reference image thumbnails */}
        <AnimatePresence>
          {hasReferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                {referenceImages.slice(0, 6).map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="size-8 overflow-hidden bg-[var(--void-panel)] border border-[var(--wire-cyan-dim)]/40">
                      <Image src={img.preview} alt="Reference" width={36} height={36} className="w-full h-full object-cover" />
                      {img.isUploading && (
                        <div className="absolute inset-0 bg-[var(--void)]/70 flex items-center justify-center">
                          <Loader className="size-3 text-[var(--nerv-orange)]" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(img.id)}
                      aria-label="Remove reference"
                      className="absolute -top-1.5 -right-1.5 size-4 bg-[var(--void)] border border-[var(--alert-red-dim)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--alert-red)] hover:text-[var(--void)]"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
                {referenceImages.length > 6 && (
                  <span className="text-[10px] text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)]">+{referenceImages.length - 6}</span>
                )}
                <span className="text-[10px] text-[var(--data-green-dim)] font-[family-name:var(--font-ibm-plex-mono)] ml-auto tabular-nums">{referenceImages.length}/14</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main prompt row */}
        <div className="flex items-end gap-2">
          {/* Reference images button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setRefModalOpen(true)}
                className={cn(
                  "size-10 flex items-center justify-center transition-colors shrink-0 relative",
                  "border border-[var(--nerv-orange-dim)]/40",
                  "focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]",
                  hasReferences
                    ? "bg-[var(--nerv-orange)]/10 text-[var(--nerv-orange)]"
                    : "bg-[var(--void)] text-[var(--nerv-orange-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                )}
                aria-label="Add reference images"
              >
                <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden="true" />
                {hasReferences && (
                  <span className="absolute -top-1 -right-1 size-4 bg-[var(--void)] border border-[var(--nerv-orange)] text-[9px] font-[family-name:var(--font-ibm-plex-mono)] font-medium text-[var(--nerv-orange)] flex items-center justify-center">
                    {referenceImages.length}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] bg-[var(--void-panel)] border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)]">
              {hasReferences ? `${referenceImages.length} REFERENCES` : "ADD REFERENCES"}
            </TooltipContent>
          </Tooltip>

          {/* Reference images modal */}
          <Dialog open={refModalOpen} onOpenChange={setRefModalOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm text-[var(--nerv-orange)] uppercase tracking-[0.1em]">
                  <ImagePlus className="size-4" />
                  REFERENCE IMAGES
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Active References */}
                {hasReferences && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--nerv-orange)]">ACTIVE REFERENCES</div>
                      <div className="text-[10px] text-[var(--data-green-dim)] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums">{referenceImages.length}/14</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {referenceImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <div className="aspect-square overflow-hidden bg-[var(--void-panel)] border border-[var(--wire-cyan-dim)]/40">
                            <Image src={img.preview} alt="Reference" width={72} height={72} className="w-full h-full object-cover" />
                            {img.isUploading && (
                              <div className="absolute inset-0 bg-[var(--void)]/70 flex items-center justify-center">
                                <Loader className="size-3 text-[var(--nerv-orange)]" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReferenceImage(img.id)}
                            aria-label="Remove from active"
                            className="absolute -top-1.5 -right-1.5 size-5 bg-[var(--void)] border border-[var(--alert-red-dim)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--alert-red)] hover:text-[var(--void)] focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--alert-red)]"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <FileUploadTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-[var(--void)] hover:bg-[var(--nerv-orange)]/10 text-[11px] uppercase tracking-[0.08em] text-[var(--nerv-orange)] transition-colors border border-dashed border-[var(--nerv-orange-dim)]/40"
                    disabled={!hasAvailableSlots || referenceImages.length >= 14}
                  >
                    <ImagePlus className="size-4" aria-hidden="true" />
                    <span>UPLOAD IMAGES</span>
                  </button>
                </FileUploadTrigger>

                {/* Saved library */}
                {savedReferences.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em]">YOUR LIBRARY</div>
                      <div className="text-[10px] text-[var(--data-green-dim)] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums">{savedReferences.length} SAVED</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                      {savedReferences.map((saved) => (
                        <div key={saved.id} className="relative group">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => addSavedReferenceToActive(saved)}
                                className="aspect-square w-full overflow-hidden border border-[var(--steel-faint)] hover:border-[var(--nerv-orange-dim)] transition-colors"
                                aria-label={`Add ${saved.name || "reference"}`}
                              >
                                <Image src={saved.url} alt={saved.name || "Reference"} width={72} height={72} className="w-full h-full object-cover" unoptimized />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] bg-[var(--void-panel)] border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)]">{saved.name || "Reference image"}</TooltipContent>
                          </Tooltip>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSavedReference(saved.id); }}
                            aria-label="Delete from library"
                            className="absolute -top-1.5 -right-1.5 size-5 bg-[var(--alert-red)] text-[var(--void)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--alert-red)]"
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--steel-dim)] uppercase tracking-[0.05em]">Click to use &middot; Uploads are auto-saved</p>
                  </>
                )}

                {savedReferences.length === 0 && !hasReferences && (
                  <p className="text-[10px] text-[var(--steel-dim)] text-center py-4 uppercase tracking-[0.05em]">
                    Upload images to use as references.<br />They will be saved to your library automatically.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={hasReferences ? "Describe transformation parameters..." : "Enter generation prompt..."}
              rows={2}
              className={cn(
                "w-full resize-none border border-[var(--nerv-orange-dim)]/40 bg-[var(--void)] px-3 py-2 pr-14 text-sm",
                "text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)]",
                "placeholder:text-[var(--steel-dim)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--nerv-orange)]/50 focus:border-[var(--nerv-orange-dim)]",
                "transition-shadow scrollbar-thin"
              )}
            />
            {/* Character count readout */}
            <span className="absolute bottom-1.5 right-2 text-[8px] tabular-nums text-[var(--steel-dim)] pointer-events-none">
              {prompt.length > 0 ? prompt.length : ""}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <button
                  onClick={() => generate()}
                  disabled={!canGenerate}
                  className={cn(
                    "h-10 px-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-100",
                    "font-[family-name:var(--font-ibm-plex-mono)]",
                    "border border-[var(--nerv-orange)]",
                    canGenerate
                      ? "bg-[var(--nerv-orange)] text-[var(--void)] hover:bg-[var(--nerv-orange-hot)]"
                      : "bg-[var(--void)] text-[var(--nerv-orange-dim)] opacity-40 cursor-not-allowed"
                  )}
                >
                  {activeGenerations > 0 ? `GENERATE (${activeGenerations})` : "GENERATE"}
                </button>
              </span>
            </TooltipTrigger>
            {disabledReason && !canGenerate && (
              <TooltipContent side="top" className="text-[10px] bg-[var(--void-panel)] border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)]">
                {disabledReason}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Inline settings row */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
          {/* Section label */}
          <span className="text-[7px] tracking-[0.1em] uppercase text-[var(--nerv-orange-dim)] shrink-0">SYS</span>
          <div className="w-px h-4 bg-[var(--nerv-orange-dim)]/20 shrink-0" />
          {/* API / Model selector */}
          <ApiSelector
            apis={availableApis}
            selectedApiId={selectedApiId}
            onSelect={setSelectedApiId}
            disabled={isLoadingApis}
          />

          <div className="w-px h-5 bg-[var(--nerv-orange-dim)]/30 shrink-0" />

          {/* Aspect Ratio popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Aspect ratio: ${settings.aspectRatio}`}
                className="flex items-center gap-1.5 h-8 px-2.5 bg-[var(--void-panel)] hover:bg-[var(--nerv-orange)]/10 transition-colors shrink-0 border border-[var(--steel-faint)]"
              >
                <AspectRatioShape ratio={settings.aspectRatio} className="text-[var(--nerv-orange)]" />
                <span className="text-xs font-medium text-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)]">{settings.aspectRatio}</span>
                <ChevronDown className="size-3 text-[var(--nerv-orange-dim)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-auto p-2 rounded-none bg-[var(--void)] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
              <div role="listbox" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1">
                {filteredAspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    role="option"
                    aria-selected={settings.aspectRatio === ratio.value}
                    onClick={() => updateSettings({ aspectRatio: ratio.value })}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 transition-all duration-100",
                      settings.aspectRatio === ratio.value
                        ? "bg-[var(--nerv-orange)]/15 border border-[var(--nerv-orange)]"
                        : "border border-transparent hover:bg-[var(--nerv-orange)]/10"
                    )}
                  >
                    <AspectRatioShape
                      ratio={ratio.value}
                      className={settings.aspectRatio === ratio.value ? "text-[var(--nerv-orange)]" : "text-[var(--steel-dim)]"}
                    />
                    <span className={cn(
                      "text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tabular-nums",
                      settings.aspectRatio === ratio.value ? "text-[var(--nerv-orange)] font-medium" : "text-[var(--steel-dim)]"
                    )}>
                      {ratio.value}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quality segmented control */}
          <div role="radiogroup" aria-label="Image quality" className="flex items-center h-8 p-0.5 bg-[var(--void-panel)] border border-[var(--steel-faint)] shrink-0">
            {filteredImageSizes.map((size) => (
              <Tooltip key={size.value}>
                <TooltipTrigger asChild>
                  <button
                    role="radio"
                    aria-checked={settings.imageSize === size.value}
                    onClick={() => updateSettings({ imageSize: size.value })}
                    className={cn(
                      "h-7 px-3 text-xs font-medium transition-all duration-100 font-[family-name:var(--font-ibm-plex-mono)]",
                      settings.imageSize === size.value
                        ? "bg-[var(--nerv-orange)] text-[var(--void)]"
                        : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                    )}
                  >
                    {size.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] bg-[var(--void-panel)] border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)]">{size.desc}</TooltipContent>
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
            className="flex items-center h-8 bg-[var(--void-panel)] border border-[var(--steel-faint)] shrink-0"
          >
            <button
              type="button"
              onClick={() => updateSettings({ outputCount: Math.max(1, settings.outputCount - 1) })}
              disabled={settings.outputCount <= 1}
              className="size-8 flex items-center justify-center text-[var(--nerv-orange-dim)] hover:text-[var(--nerv-orange)] disabled:opacity-30 transition-colors"
              aria-label="Decrease count"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-medium tabular-nums text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)]">
              {settings.outputCount}
            </span>
            <button
              type="button"
              onClick={() => updateSettings({ outputCount: Math.min(maxOutputCount, settings.outputCount + 1) })}
              disabled={settings.outputCount >= maxOutputCount}
              className="size-8 flex items-center justify-center text-[var(--nerv-orange-dim)] hover:text-[var(--nerv-orange)] disabled:opacity-30 transition-colors"
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
            className="flex items-center gap-1 text-[10px] text-[var(--alert-red-dim)] hover:text-[var(--alert-red)] transition-colors uppercase tracking-[0.08em]"
          >
            {showNegative ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            NEGATIVE PROMPT
          </button>
          <AnimatePresence>
            {showNegative && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.1 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={settings.negativePrompt}
                  onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
                  placeholder={"Specify exclusions..."}
                  className="mt-1 w-full h-7 px-2 text-xs border border-[var(--alert-red-dim)]/40 bg-[var(--void)] text-[var(--alert-red)] font-[family-name:var(--font-ibm-plex-mono)] placeholder:text-[var(--alert-red-dim)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--alert-red)]/50 transition-shadow"
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
