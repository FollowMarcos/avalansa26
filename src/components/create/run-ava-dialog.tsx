"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Ava, RunAvaResponse } from "@/types/ava";
import {
  Bot,
  Play,
  Loader2,
  Copy,
  Bookmark,
  RotateCcw,
  ImagePlus,
  X,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DialogPhase = "input" | "running" | "result";

interface RunAvaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ava: Ava | null;
  onRun: (
    avaId: string,
    apiId: string,
    inputText?: string,
    inputImages?: string[]
  ) => Promise<RunAvaResponse>;
  onUseResult: (prompt: string, negativePrompt?: string) => void;
  onSaveResult: (prompt: string, negativePrompt?: string) => void;
  selectedApiId: string | null;
}

export function RunAvaDialog({
  open,
  onOpenChange,
  ava,
  onRun,
  onUseResult,
  onSaveResult,
  selectedApiId,
}: RunAvaDialogProps) {
  const [phase, setPhase] = React.useState<DialogPhase>("input");
  const [inputText, setInputText] = React.useState("");
  const [inputImages, setInputImages] = React.useState<
    Array<{ dataUrl: string; name: string }>
  >([]);
  const [result, setResult] = React.useState<RunAvaResponse | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setPhase("input");
      setInputText("");
      setInputImages([]);
      setResult(null);
    }
  }, [open]);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 4 images total
    const remaining = 4 - inputImages.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      const reader = new FileReader();
      reader.onload = () => {
        setInputImages((prev) => [
          ...prev,
          { dataUrl: reader.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setInputImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!ava || !selectedApiId) {
      if (!selectedApiId) {
        toast.error("No API configured. Select a Google API in the toolbar.");
      }
      return;
    }

    if (!inputText.trim() && inputImages.length === 0) {
      toast.error("Provide text, images, or both");
      return;
    }

    setPhase("running");

    const response = await onRun(
      ava.id,
      selectedApiId,
      inputText.trim() || undefined,
      inputImages.length > 0
        ? inputImages.map((img) => img.dataUrl)
        : undefined
    );

    setResult(response);
    setPhase(response.success ? "result" : "input");

    if (!response.success) {
      toast.error(response.error || "Failed to generate prompt");
    }
  };

  const handleCopyResult = async () => {
    if (!result?.prompt) return;
    try {
      let text = result.prompt;
      if (result.negativePrompt) {
        text += `\n\nNegative: ${result.negativePrompt}`;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleUseResult = () => {
    if (result?.prompt) {
      onUseResult(result.prompt, result.negativePrompt);
      onOpenChange(false);
    }
  };

  const handleSaveResult = () => {
    if (result?.prompt) {
      onSaveResult(result.prompt, result.negativePrompt);
    }
  };

  const handleRunAgain = () => {
    setPhase("input");
    setResult(null);
  };

  if (!ava) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" aria-hidden="true" />
            Run {ava.name}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {ava.description || "Provide input and generate a prompt"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input phase */}
          {phase === "input" && (
            <>
              {/* Text input */}
              <div className="space-y-2">
                <Label htmlFor="ava-input">Your Input</Label>
                <Textarea
                  id="ava-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe what you want to generate\u2026"
                  rows={4}
                  className="resize-none"
                  autoFocus
                />
              </div>

              {/* Image input */}
              <div className="space-y-2">
                <Label>
                  Reference Images{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional, max 4)
                  </span>
                </Label>

                {/* Image thumbnails */}
                {inputImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {inputImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative size-16 rounded-lg overflow-hidden border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.dataUrl}
                          alt={`Input ${index + 1}`}
                          className="size-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="size-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {inputImages.length < 4 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddImages}
                      className="sr-only"
                      id="ava-image-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <ImagePlus className="size-4 mr-2" />
                      Add Images
                    </Button>
                  </>
                )}
              </div>

              {/* Instructions preview */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Ava Instructions
                </Label>
                <p className="text-[11px] text-muted-foreground font-mono bg-muted/50 rounded-lg px-2.5 py-1.5 line-clamp-3">
                  {ava.instructions}
                </p>
              </div>
            </>
          )}

          {/* Running phase */}
          {phase === "running" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4" role="status" aria-live="polite">
              <div className="relative">
                <Bot className="size-10 text-muted-foreground" />
                <Loader2 className="absolute -bottom-1 -right-1 size-5 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Generating prompt\u2026</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ava.name} is working on your request
                </p>
              </div>
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && result?.prompt && (
            <div role="status" aria-live="polite">
              {/* Generated prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Generated Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="size-3 mr-1.5" aria-hidden="true" />
                    Copy
                  </Button>
                </div>
                <div
                  className="text-sm font-mono bg-muted/50 rounded-lg px-3 py-2.5 max-h-40 overflow-y-auto whitespace-pre-wrap break-words"
                  tabIndex={0}
                  role="region"
                  aria-label="Generated prompt"
                >
                  {result.prompt}
                </div>
              </div>

              {/* Negative prompt */}
              {result.negativePrompt && (
                <div className="space-y-2">
                  <Label className="text-red-500">Negative Prompt</Label>
                  <div className="text-sm font-mono bg-red-500/10 rounded-lg px-3 py-2.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-words">
                    {result.negativePrompt}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === "input" && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRun}
                disabled={
                  (!inputText.trim() && inputImages.length === 0) ||
                  !selectedApiId
                }
              >
                <Play className="size-4 mr-2" />
                Run
              </Button>
            </>
          )}

          {phase === "running" && (
            <Button
              variant="outline"
              onClick={() => {
                setPhase("input");
              }}
            >
              Cancel
            </Button>
          )}

          {phase === "result" && (
            <>
              <Button variant="outline" onClick={handleRunAgain}>
                <RotateCcw className="size-4 mr-2" />
                Run Again
              </Button>
              <Button variant="outline" onClick={handleSaveResult}>
                <Bookmark className="size-4 mr-2" />
                Save to Vault
              </Button>
              <Button onClick={handleUseResult}>
                <Wand2 className="size-4 mr-2" />
                Use Prompt
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
