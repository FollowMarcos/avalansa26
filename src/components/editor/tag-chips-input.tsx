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

export function TagChipsInput({
  tags,
  onTagsChange,
  presetTags,
  customText,
  onCustomTextChange,
  placeholder = "Add custom tag...",
}: TagChipsInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

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
      <div className="flex flex-wrap gap-1">
        {presetTags.map((tag) => {
          const isActive = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-2 py-0.5 text-[10px] border transition-all duration-100 cursor-pointer uppercase tracking-[0.05em]",
                isActive
                  ? "bg-[var(--nerv-orange)]/15 border-[var(--nerv-orange)] text-[var(--nerv-orange)]"
                  : "border-[var(--steel-faint)] text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:border-[var(--nerv-orange-dim)]/40 hover:text-[var(--nerv-orange-dim)]"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] border border-[var(--data-green-dim)] text-[var(--data-green)] flex items-center gap-1 uppercase tracking-[0.05em]"
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
          className="w-full h-7 px-2 text-xs bg-[var(--void)] border border-[var(--nerv-orange-dim)]/40 text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)] placeholder:text-[var(--steel-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nerv-orange)]/50"
        />
        {customText !== undefined && (
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder={"Custom description..."}
            className="w-full h-7 px-2 text-xs bg-[var(--void)] border border-[var(--nerv-orange-dim)]/40 text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)] placeholder:text-[var(--steel-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nerv-orange)]/50"
          />
        )}
      </div>
    </div>
  );
}
