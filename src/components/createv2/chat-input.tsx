"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp, ImagePlus, X, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string, images?: string[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const [text, setText] = React.useState("");
  const [attachedImages, setAttachedImages] = React.useState<string[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canSend = (text.trim() || attachedImages.length > 0) && !isStreaming && !disabled;

  const handleSend = React.useCallback(() => {
    if (!canSend) return;
    onSend(text.trim(), attachedImages.length > 0 ? attachedImages : undefined);
    setText("");
    setAttachedImages([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, text, attachedImages, onSend]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (isStreaming) return;
        handleSend();
      }
    },
    [handleSend, isStreaming]
  );

  const handleInput = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }, []);

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = "";
  }, []);

  const removeImage = React.useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="border-t border-border bg-background">
      {/* Attached images strip */}
      {attachedImages.length > 0 && (
        <div className="flex gap-2 px-3 pt-3 overflow-x-auto">
          {attachedImages.map((img, i) => (
            <div key={i} className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden group">
              <Image src={img} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
        >
          <ImagePlus className="w-4 h-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to create..."
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm leading-relaxed",
            "placeholder:text-muted-foreground/50 focus:outline-none",
            "max-h-40 py-1.5"
          )}
          disabled={disabled}
        />

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 flex-shrink-0 rounded-full"
            onClick={onStop}
          >
            <Square className="w-3 h-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full transition-opacity",
              canSend ? "opacity-100" : "opacity-40"
            )}
            onClick={handleSend}
            disabled={!canSend}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
