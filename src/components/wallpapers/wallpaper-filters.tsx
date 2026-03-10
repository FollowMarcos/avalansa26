'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WallpaperSortOption, ResolutionFilter, WallpaperCollection } from '@/types/wallpaper';

const SORT_OPTIONS: { value: WallpaperSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'most-downloaded', label: 'Most Downloaded' },
  { value: 'most-liked', label: 'Most Liked' },
];

const RESOLUTION_OPTIONS: { value: ResolutionFilter; label: string }[] = [
  { value: 'hd', label: 'HD' },
  { value: 'fullhd', label: 'Full HD' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
  { value: '5k', label: '5K+' },
];

interface WallpaperFiltersProps {
  collections?: WallpaperCollection[];
  onSearchChange?: (search: string) => void;
  onSortChange?: (sort: WallpaperSortOption) => void;
  onResolutionChange?: (resolution: ResolutionFilter | undefined) => void;
  onCollectionChange?: (collectionId: string | undefined) => void;
  currentSort?: WallpaperSortOption;
  currentResolution?: ResolutionFilter;
  currentCollection?: string;
  currentSearch?: string;
}

export function WallpaperFilters({
  collections,
  onSearchChange,
  onSortChange,
  onResolutionChange,
  onCollectionChange,
  currentSort = 'newest',
  currentResolution,
  currentCollection,
  currentSearch = '',
}: WallpaperFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search wallpapers..."
          value={currentSearch}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 rounded-xl bg-primary/[0.02] border-primary/10 font-lato"
        />
      </div>

      {/* Sort & Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground mr-1" />

        {/* Sort */}
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange?.(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
              currentSort === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Resolution */}
        {RESOLUTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onResolutionChange?.(
                currentResolution === option.value ? undefined : option.value
              )
            }
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
              currentResolution === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Collections Filter (if provided) */}
      {collections && collections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-vt323 text-xs text-muted-foreground uppercase tracking-wider mr-1">
            Collections:
          </span>
          <button
            onClick={() => onCollectionChange?.(undefined)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
              !currentCollection
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-muted-foreground hover:bg-primary/10'
            )}
          >
            All
          </button>
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() =>
                onCollectionChange?.(
                  currentCollection === col.id ? undefined : col.id
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all',
                currentCollection === col.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/5 text-muted-foreground hover:bg-primary/10'
              )}
            >
              {col.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
