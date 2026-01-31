"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, GenerationMode } from "./create-context";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  ImagePlus,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const modeLabels: Record<GenerationMode, string> = {
  generate: "Generate",
  edit: "Edit",
  "style-transfer": "Style Transfer",
  "text-render": "Text",
  infographic: "Infographic",
  consistency: "Consistency",
};

export function PromptComposer() {
  const {
    prompt,
    setPrompt,
    inputImages,
    addImages,
    removeImage,
    isGenerating,
    generate,
    mode,
    settings,
  } = useCreate();

  const [showNegative, setShowNegative] = React.useState(false);

  const handleSubmit = () => {
    if (!isGenerating && (prompt.trim() || inputImages.length > 0)) {
      generate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 z-30 p-4"
    >
      <div className="max-w-3xl mx-auto">
        <FileUpload
          onFilesAdded={addImages}
          multiple
          accept="image/*"
          disabled={isGenerating}
        >
          <PromptInput
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isGenerating}
            disabled={isGenerating}
            className={cn(
              "bg-zinc-900 border-zinc-800",
              "rounded-2xl transition-all",
              inputImages.length > 0 && "rounded-t-none"
            )}
          >
            {/* Attached Images */}
            <AnimatePresence>
              {inputImages.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700/50 overflow-x-auto">
                    {inputImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative flex-shrink-0 group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
                          <Image
                            src={img.preview}
                            alt="Attached"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove image"
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-2.5 text-zinc-400" />
                        </button>
                      </div>
                    ))}
                    <span className="text-xs text-zinc-500 flex-shrink-0">
                      {inputImages.length}/14
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Area */}
            <div className="flex items-end gap-2 p-2">
              {/* Image Upload Button */}
              <FileUploadTrigger asChild>
                <PromptInputAction tooltip="Add images (up to 14)">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-200"
                    disabled={isGenerating || inputImages.length >= 14}
                  >
                    <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                  </Button>
                </PromptInputAction>
              </FileUploadTrigger>

              {/* Textarea */}
              <div className="flex-1">
                <PromptInputTextarea
                  placeholder={getPlaceholder(mode)}
                  className="text-zinc-100 placeholder:text-zinc-500 text-sm"
                />
              </div>

              {/* Actions */}
              <PromptInputActions className="flex-shrink-0">
                {/* Negative Prompt Toggle */}
                <PromptInputAction tooltip="Negative prompt">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNegative(!showNegative)}
                    aria-label={showNegative ? "Hide negative prompt" : "Show negative prompt"}
                    aria-expanded={showNegative}
                    className={cn(
                      "size-10 rounded-xl",
                      showNegative
                        ? "text-zinc-200 bg-zinc-800"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {showNegative ? (
                      <ChevronDown className="size-5" strokeWidth={1.5} />
                    ) : (
                      <ChevronUp className="size-5" strokeWidth={1.5} />
                    )}
                  </Button>
                </PromptInputAction>

                {/* Generate Button */}
                <PromptInputAction tooltip="Generate (Enter)">
                  <Button
                    onClick={handleSubmit}
                    disabled={isGenerating || (!prompt.trim() && inputImages.length === 0)}
                    className={cn(
                      "h-10 px-4 rounded-xl font-medium",
                      "bg-zinc-100 text-zinc-900 hover:bg-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? (
                      <Loader variant="circular" size="sm" className="border-zinc-900" />
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-2" strokeWidth={1.5} />
                        {modeLabels[mode]}
                      </>
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </div>

            {/* Negative Prompt Expansion */}
            <AnimatePresence>
              {showNegative && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-zinc-700/50"
                >
                  <div className="p-3">
                    <label className="text-xs text-zinc-500 mb-1 block">
                      Negative prompt (elements to avoid)
                    </label>
                    <input
                      id="negative-prompt-input"
                      type="text"
                      value={settings.negativePrompt}
                      onChange={(e) => {/* handled by context */ }}
                      placeholder="blurry, low quality, distorted…"
                      className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </PromptInput>
        </FileUpload>

        {/* Quick info */}
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-zinc-600">
          <span>{settings.resolution}px</span>
          <span>•</span>
          <span>{settings.aspectRatio}</span>
          <span>•</span>
          <span>{settings.outputCount} {settings.outputCount === 1 ? "image" : "images"}</span>
        </div>
      </div>
    </motion.div>
  );
}

function getPlaceholder(mode: GenerationMode): string {
  switch (mode) {
    case "generate":
      return "Describe what you want to create...";
    case "edit":
      return "Describe the changes you want to make...";
    case "style-transfer":
      return "Describe the style you want to apply...";
    case "text-render":
      return "Describe an image with text (e.g., 'a sign that says Hello World')...";
    case "infographic":
      return "Describe your infographic or chart...";
    case "consistency":
      return "Describe a scene with your character/subject…";
    default:
      return "Enter your prompt…";
  }
}
