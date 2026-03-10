'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WallpaperTag } from '@/types/wallpaper';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function TagSelector({
  selectedTags,
  onChange,
  maxTags = 20,
}: TagSelectorProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<WallpaperTag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/wallpapers/tags?search=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            (data.tags as WallpaperTag[]).filter(
              (t) => !selectedTags.includes(t.name)
            )
          );
        }
      } catch {
        // Aborted or failed
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedTags]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim();
    if (!normalized || selectedTags.includes(normalized) || selectedTags.length >= maxTags) return;
    onChange([...selectedTags, normalized]);
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(selectedTags.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      addTag(query);
    } else if (e.key === 'Backspace' && !query && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-primary/[0.02] border border-primary/10 min-h-[42px]">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-vt323 uppercase"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selectedTags.length < maxTags && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
            className="flex-1 min-w-[100px] bg-transparent text-sm font-lato outline-none placeholder:text-muted-foreground/50"
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || query.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl bg-popover border border-border shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag.name)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-lato hover:bg-accent transition-colors"
            >
              <span>#{tag.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {tag.usage_count} uses
              </span>
            </button>
          ))}
          {query.trim() && !suggestions.some((s) => s.name === query.toLowerCase().trim()) && (
            <button
              onClick={() => addTag(query)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-lato text-primary hover:bg-accent transition-colors"
            >
              <Plus className="w-3 h-3" />
              Create "{query.trim()}"
            </button>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground font-mono mt-1">
        {selectedTags.length}/{maxTags} tags. Press Enter to add.
      </p>
    </div>
  );
}
