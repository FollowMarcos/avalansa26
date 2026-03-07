"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagChipsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  presetTags: string[];
  customText: string;
  onCustomTextChange: (text: string) => void;
  placeholder?: string;
  accentColor?: string;
}

const ACCENT_STYLES: Record<string, { chip: string; chipActive: string; input: string }> = {
  amber: {
    chip: "border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10",
    chipActive: "bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-200",
    input: "focus:ring-amber-500/30",
  },
  emerald: {
    chip: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10",
    chipActive: "bg-emerald-500/20 border-emerald-500/50 text-emerald-800 dark:text-emerald-200",
    input: "focus:ring-emerald-500/30",
  },
  cyan: {
    chip: "border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10",
    chipActive: "bg-cyan-500/20 border-cyan-500/50 text-cyan-800 dark:text-cyan-200",
    input: "focus:ring-cyan-500/30",
  },
};

export function TagChipsInput({
  tags,
  onTagsChange,
  presetTags,
  customText,
  onCustomTextChange,
  placeholder = "Add custom tag...",
  accentColor = "amber",
}: TagChipsInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber;

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  // Custom tags = tags not in presets
  const customTags = tags.filter((t) => !presetTags.includes(t));

  return (
    <div className="space-y-2">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {presetTags.map((tag) => {
          const isActive = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95",
                isActive ? styles.chipActive : styles.chip
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border flex items-center gap-1",
                styles.chipActive
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
                className="hover:opacity-70"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom text input */}
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-7 px-2 text-xs rounded-md border border-border bg-background",
            "focus:outline-none focus:ring-1",
            styles.input
          )}
        />
        {customText !== undefined && (
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder="Custom description..."
            className={cn(
              "w-full h-7 px-2 text-xs rounded-md border border-border bg-background",
              "focus:outline-none focus:ring-1",
              styles.input
            )}
          />
        )}
      </div>
    </div>
  );
}
