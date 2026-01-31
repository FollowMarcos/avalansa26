"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
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
  Images,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function PromptComposer() {
  const {
    prompt,
    setPrompt,
    referenceImages,
    addReferenceImages,
    removeReferenceImage,
    isGenerating,
    generate,
    settings,
  } = useCreate();

  const handleSubmit = () => {
    if (!isGenerating && (prompt.trim() || referenceImages.length > 0)) {
      generate();
    }
  };

  const hasReferences = referenceImages.length > 0;

  return (
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
          <PromptInput
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isGenerating}
            disabled={isGenerating}
            className={cn(
              "bg-background border-border",
              "rounded-2xl transition-all shadow-sm",
              hasReferences && "rounded-t-none"
            )}
          >
            {/* Attached Reference Images */}
            <AnimatePresence>
              {hasReferences && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border overflow-x-auto bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2 flex-shrink-0">
                      <Images className="size-3.5" />
                      <span>Style Transfer</span>
                    </div>
                    {referenceImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative flex-shrink-0 group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border">
                          <Image
                            src={img.preview}
                            alt="Reference"
                            width={48}
                            height={48}
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
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
                      {referenceImages.length}/14
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Area */}
            <div className="flex items-end gap-2 p-2">
              {/* Image Upload Button */}
              <FileUploadTrigger asChild>
                <PromptInputAction tooltip="Add reference images (up to 14)">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl",
                      hasReferences
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isGenerating || referenceImages.length >= 14}
                  >
                    <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                  </Button>
                </PromptInputAction>
              </FileUploadTrigger>

              {/* Textarea */}
              <div className="flex-1">
                <PromptInputTextarea
                  placeholder={
                    hasReferences
                      ? "Describe how to transform or style your images..."
                      : "Describe the image you want to create..."
                  }
                  className="text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>

              {/* Generate Button */}
              <PromptInputActions className="flex-shrink-0">
                <PromptInputAction tooltip="Generate (Enter)">
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
                </PromptInputAction>
              </PromptInputActions>
            </div>
          </PromptInput>
        </FileUpload>

        {/* Quick info */}
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
          <span>{settings.imageSize}</span>
          <span className="opacity-50">|</span>
          <span>{settings.aspectRatio}</span>
          <span className="opacity-50">|</span>
          <span>{settings.outputCount} {settings.outputCount === 1 ? "image" : "images"}</span>
        </div>
      </div>
    </motion.div>
  );
}
