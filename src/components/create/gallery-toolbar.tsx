"use client";

import * as React from "react";
import { Search, SlidersHorizontal, CheckSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreate, type GallerySortOption } from "./create-context";
import { GalleryFilters } from "./gallery-filters";

export function GalleryToolbar() {
  const {
    galleryFilterState,
    setSearchQuery,
    setSortBy,
    setGalleryFilters,
    clearGalleryFilters,
    toggleBulkSelection,
    getFilteredHistory,
  } = useCreate();

  const [localSearch, setLocalSearch] = React.useState(galleryFilterState.searchQuery);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearchChange = React.useCallback((value: string) => {
    setLocalSearch(value);

    if (searchTimeoutRef.current !== null) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Count active filters
  const activeFilterCount =
    galleryFilterState.filters.aspectRatio.length +
    galleryFilterState.filters.imageSize.length +
    (galleryFilterState.filters.sessionId ? 1 : 0);

  const filteredCount = getFilteredHistory().length;

  const sortOptions: { value: GallerySortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "prompt-asc", label: "Prompt A-Z" },
    { value: "prompt-desc", label: "Prompt Z-A" },
  ];

  return (
    <div className="space-y-3">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            name="gallery-search"
            autoComplete="off"
            placeholder="Search prompts…"
            aria-label="Search prompts"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 font-mono text-sm"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
              aria-label="Clear search"
              onClick={() => {
                setLocalSearch("");
                setSearchQuery("");
              }}
            >
              <X className="size-3" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <Select
          value={galleryFilterState.sortBy}
          onValueChange={(value) => setSortBy(value as GallerySortOption)}
        >
          <SelectTrigger className="w-[150px] h-9 font-mono text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilterCount > 0 ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-2 font-mono text-sm"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <GalleryFilters />
          </PopoverContent>
        </Popover>

        {/* Bulk Select Toggle */}
        <Button
          variant={galleryFilterState.bulkSelection.enabled ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-2 font-mono text-sm"
          onClick={toggleBulkSelection}
        >
          <CheckSquare className="size-4" aria-hidden="true" />
          {galleryFilterState.bulkSelection.enabled ? "Cancel" : "Select"}
        </Button>
      </div>

      {/* Active filters row */}
      {(activeFilterCount > 0 || galleryFilterState.searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          {galleryFilterState.searchQuery && (
            <Badge variant="outline" className="gap-1 font-mono text-xs">
              Search: "{galleryFilterState.searchQuery}"
              <button
                onClick={() => {
                  setLocalSearch("");
                  setSearchQuery("");
                }}
                className="ml-1 hover:text-foreground"
                aria-label="Clear search filter"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}

          {galleryFilterState.filters.aspectRatio.map((ratio) => (
            <Badge key={ratio} variant="outline" className="gap-1 font-mono text-xs">
              {ratio}
              <button
                onClick={() => {
                  const newRatios = galleryFilterState.filters.aspectRatio.filter(r => r !== ratio);
                  setGalleryFilters({ aspectRatio: newRatios });
                }}
                className="ml-1 hover:text-foreground"
                aria-label={`Remove ${ratio} filter`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}

          {galleryFilterState.filters.imageSize.map((size) => (
            <Badge key={size} variant="outline" className="gap-1 font-mono text-xs">
              {size}
              <button
                onClick={() => {
                  const newSizes = galleryFilterState.filters.imageSize.filter(s => s !== size);
                  setGalleryFilters({ imageSize: newSizes });
                }}
                className="ml-1 hover:text-foreground"
                aria-label={`Remove ${size} filter`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearGalleryFilters}
            >
              Clear all
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {filteredCount} images
          </span>
        </div>
      )}
    </div>
  );
}
