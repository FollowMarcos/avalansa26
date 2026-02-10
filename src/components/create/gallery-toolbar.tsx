"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  CheckSquare,
  X,
  Heart,
  LayoutGrid,
  GitBranch,
  PanelLeft,
  Minus,
  Plus,
  ImageIcon,
} from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreate, type GallerySortOption } from "./create-context";
import { GalleryFilters } from "./gallery-filters";

interface GalleryToolbarProps {
  columnCount: number;
  onColumnCountChange: (count: number) => void;
  totalCount: number;
  favCount: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function GalleryToolbar({
  columnCount,
  onColumnCountChange,
  totalCount,
  favCount,
  sidebarOpen,
  onToggleSidebar,
}: GalleryToolbarProps) {
  const {
    viewMode,
    setViewMode,
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
    galleryFilterState.filters.tagIds.length +
    (galleryFilterState.filters.collectionId ? 1 : 0);

  const showFavoritesOnly = galleryFilterState.filters.showFavoritesOnly;

  const filteredCount = getFilteredHistory().length;

  const sortOptions: { value: GallerySortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "prompt-asc", label: "Prompt A\u2013Z" },
    { value: "prompt-desc", label: "Prompt Z\u2013A" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? "Close collections sidebar" : "Open collections sidebar"}
              aria-pressed={sidebarOpen}
            >
              <PanelLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Collections</TooltipContent>
        </Tooltip>

        {/* View Mode Switcher */}
        <div className="flex items-center border border-border rounded-lg p-0.5" role="group" aria-label="View mode">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("gallery")}
                aria-label="Gallery view"
                aria-pressed={viewMode === "gallery"}
                className={cn(
                  "size-8 rounded-md",
                  viewMode === "gallery" && "bg-muted"
                )}
              >
                <LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gallery View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("workflow")}
                aria-label="Workflow view"
                aria-pressed={viewMode === "workflow"}
                className={cn(
                  "size-8 rounded-md",
                  viewMode === "workflow" && "bg-muted"
                )}
              >
                <GitBranch className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Workflow View</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border" aria-hidden="true" />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            name="gallery-search"
            autoComplete="off"
            placeholder="Search prompts\u2026"
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

        {/* Favorites Filter */}
        <Button
          variant={showFavoritesOnly ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-2 font-mono text-sm"
          onClick={() => setGalleryFilters({ showFavoritesOnly: !showFavoritesOnly })}
          aria-pressed={showFavoritesOnly}
        >
          <Heart
            className={showFavoritesOnly ? "size-4 fill-red-500 text-red-500" : "size-4"}
            aria-hidden="true"
          />
          Favorites
        </Button>

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
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs tabular-nums">
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

        {/* Column count slider */}
        <div className="w-px h-6 bg-border ml-auto" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={columnCount <= 2}
                onClick={() => onColumnCountChange(Math.max(2, columnCount - 1))}
                aria-label="Fewer columns"
              >
                <Minus className="size-3" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fewer Columns</TooltipContent>
          </Tooltip>
          <Slider
            min={2}
            max={8}
            step={1}
            value={[columnCount]}
            onValueChange={([v]) => onColumnCountChange(v)}
            className="w-20"
            aria-label="Column count"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={columnCount >= 8}
                onClick={() => onColumnCountChange(Math.min(8, columnCount + 1))}
                aria-label="More columns"
              >
                <Plus className="size-3" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More Columns</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground font-mono tabular-nums w-4 text-center">
            {columnCount}
          </span>
        </div>
      </div>

      {/* Active filters + stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        {showFavoritesOnly && (
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            <Heart className="size-3 fill-red-500 text-red-500" aria-hidden="true" />
            Favorites only
            <button
              type="button"
              onClick={() => setGalleryFilters({ showFavoritesOnly: false })}
              className="ml-1 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              aria-label="Clear favorites filter"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        )}

        {galleryFilterState.searchQuery && (
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            Search: &ldquo;{galleryFilterState.searchQuery}&rdquo;
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                setSearchQuery("");
              }}
              className="ml-1 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
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
              type="button"
              onClick={() => {
                const newRatios = galleryFilterState.filters.aspectRatio.filter(r => r !== ratio);
                setGalleryFilters({ aspectRatio: newRatios });
              }}
              className="ml-1 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
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
              type="button"
              onClick={() => {
                const newSizes = galleryFilterState.filters.imageSize.filter(s => s !== size);
                setGalleryFilters({ imageSize: newSizes });
              }}
              className="ml-1 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              aria-label={`Remove ${size} filter`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        ))}

        {(activeFilterCount > 0 || showFavoritesOnly) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearGalleryFilters}
          >
            Clear all
          </Button>
        )}

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="size-3" aria-hidden="true" />
            {totalCount}
          </span>
          {favCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3" aria-hidden="true" />
              {favCount}
            </span>
          )}
          {filteredCount !== totalCount && (
            <span>{filteredCount} shown</span>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
