"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  CheckSquare,
  X,
  Heart,
  PanelLeft,
  Minus,
  Plus,
  ImageIcon,
  BookMarked,
  GitCompareArrows,
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

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const sortOptions: { value: GallerySortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "prompt-asc", label: "Prompt A\u2013Z" },
  { value: "prompt-desc", label: "Prompt Z\u2013A" },
  { value: "prompt-group", label: "Group by prompt" },
];

// ---------------------------------------------------------------------------
// Toolbar props
// ---------------------------------------------------------------------------

interface UnifiedToolbarProps {
  vaultOpen?: boolean;
  onToggleVault?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnifiedToolbar({
  vaultOpen,
  onToggleVault,
}: UnifiedToolbarProps) {
  const {
    galleryColumnCount,
    setGalleryColumnCount,
    gallerySidebarOpen,
    setGallerySidebarOpen,
    galleryFilterState,
    setSearchQuery,
    setSortBy,
    setGalleryFilters,
    clearGalleryFilters,
    toggleBulkSelection,
    getFilteredHistory,
    history,
    compareToolOpen,
    setCompareToolOpen,
  } = useCreate();

  // Compute stats from context
  const totalCount = history.filter(
    (img) => img.status !== "pending" && img.status !== "failed",
  ).length;
  const favCount = history.filter((img) => img.isFavorite).length;

  // Local search for debounce
  const [localSearch, setLocalSearch] = React.useState(
    galleryFilterState.searchQuery,
  );
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = React.useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, 300);
    },
    [setSearchQuery],
  );

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const activeFilterCount =
    galleryFilterState.filters.aspectRatio.length +
    galleryFilterState.filters.imageSize.length +
    galleryFilterState.filters.tagIds.length +
    galleryFilterState.filters.modelIds.length +
    (galleryFilterState.filters.collectionId ? 1 : 0) +
    (galleryFilterState.filters.dateRange.preset ? 1 : 0);

  const showFavoritesOnly = galleryFilterState.filters.showFavoritesOnly;
  const filteredCount = getFilteredHistory().length;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="shrink-0 z-20 w-full">
        <div className="flex flex-col">
          {/* Main toolbar */}
          <div className="relative flex items-center gap-1.5 bg-[var(--void)] border-b border-[var(--nerv-orange-dim)]/20 px-3 py-1 font-[family-name:var(--font-ibm-plex-mono)]">
            {/* Sidebar toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-none hover:bg-[var(--nerv-orange)]/10 text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                  onClick={() => setGallerySidebarOpen(!gallerySidebarOpen)}
                  aria-label={
                    gallerySidebarOpen
                      ? "Close collections sidebar"
                      : "Open collections sidebar"
                  }
                  aria-pressed={gallerySidebarOpen}
                >
                  <PanelLeft
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collections</TooltipContent>
            </Tooltip>

            {onToggleVault && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 rounded-none hover:bg-[var(--nerv-orange)]/10",
                      vaultOpen ? "text-[var(--nerv-orange)]" : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                    )}
                    onClick={onToggleVault}
                    aria-label={
                      vaultOpen
                        ? "Close prompt vault"
                        : "Open prompt vault"
                    }
                    aria-pressed={vaultOpen}
                  >
                    <BookMarked
                      className="size-4"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Prompt Vault</TooltipContent>
              </Tooltip>
            )}

            <div className="w-px h-5 bg-[var(--steel-faint)] mx-0.5" aria-hidden="true" />

            {/* Search */}
            <div className="relative min-w-[160px] max-w-[220px]">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--steel-dim)]"
                aria-hidden="true"
              />
              <Input
                type="search"
                name="gallery-search"
                autoComplete="off"
                placeholder={"Search\u2026"}
                aria-label="Search prompts"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 h-7 text-xs rounded-none bg-[var(--void)] border-[var(--steel-faint)] hover:border-[var(--nerv-orange-dim)]/40 focus:border-[var(--nerv-orange)]/50 text-[var(--steel)] placeholder:text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)]"
              />
              {localSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 size-5 text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
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
              onValueChange={(value) =>
                setSortBy(value as GallerySortOption)
              }
            >
              <SelectTrigger aria-label="Sort order" className="w-[130px] h-7 text-xs rounded-none bg-[var(--void)] border-[var(--steel-faint)] hover:border-[var(--nerv-orange-dim)]/40 text-[var(--steel)] font-[family-name:var(--font-ibm-plex-mono)]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs rounded-none text-[var(--steel)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)] focus:bg-[var(--nerv-orange)]/10 focus:text-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favorites */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-none hover:bg-[var(--nerv-orange)]/10",
                    showFavoritesOnly ? "bg-[var(--alert-red)]/15 text-[var(--alert-red)]" : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                  )}
                  onClick={() =>
                    setGalleryFilters({
                      showFavoritesOnly: !showFavoritesOnly,
                    })
                  }
                  aria-pressed={showFavoritesOnly}
                  aria-label="Toggle favorites filter"
                >
                  <Heart
                    className={
                      showFavoritesOnly
                        ? "size-4 fill-[var(--alert-red)] text-[var(--alert-red)]"
                        : "size-4"
                    }
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Favorites</TooltipContent>
            </Tooltip>

            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-none relative hover:bg-[var(--nerv-orange)]/10",
                    activeFilterCount > 0 ? "text-[var(--nerv-orange)]" : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                  )}
                  aria-label="Filters"
                >
                  <SlidersHorizontal
                    className="size-4"
                    aria-hidden="true"
                  />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[var(--nerv-orange)] text-[var(--void)] text-[10px] flex items-center justify-center font-mono">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]" align="start">
                <GalleryFilters />
              </PopoverContent>
            </Popover>

            {/* Bulk Select */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-none hover:bg-[var(--nerv-orange)]/10",
                    galleryFilterState.bulkSelection.enabled
                      ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                      : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                  )}
                  onClick={toggleBulkSelection}
                  aria-label={
                    galleryFilterState.bulkSelection.enabled
                      ? "Cancel selection"
                      : "Bulk select"
                  }
                >
                  <CheckSquare className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {galleryFilterState.bulkSelection.enabled
                  ? "Cancel Selection"
                  : "Bulk Select"}
              </TooltipContent>
            </Tooltip>

            {/* Compare */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-none hover:bg-[var(--nerv-orange)]/10",
                    compareToolOpen
                      ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                      : "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                  )}
                  onClick={() => setCompareToolOpen(true)}
                  aria-label="Compare images"
                >
                  <GitCompareArrows className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compare</TooltipContent>
            </Tooltip>

            <div
              className="w-px h-5 bg-[var(--steel-faint)] mx-0.5"
              aria-hidden="true"
            />

            {/* Column count */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-none text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10"
                    disabled={galleryColumnCount <= 2}
                    onClick={() =>
                      setGalleryColumnCount(
                        Math.max(2, galleryColumnCount - 1),
                      )
                    }
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
                value={[galleryColumnCount]}
                onValueChange={([v]) => setGalleryColumnCount(v)}
                className="w-16"
                aria-label="Column count"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-none text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10"
                    disabled={galleryColumnCount >= 8}
                    onClick={() =>
                      setGalleryColumnCount(
                        Math.min(8, galleryColumnCount + 1),
                      )
                    }
                    aria-label="More columns"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>More Columns</TooltipContent>
              </Tooltip>
              <span className="text-[10px] text-[var(--data-green)] tabular-nums w-3 text-center glow-green" suppressHydrationWarning>
                {galleryColumnCount}
              </span>
            </div>

            {/* Stats — NERV metrics */}
            <div className="flex items-center gap-1.5 text-[10px] tabular-nums ml-1 font-[family-name:var(--font-ibm-plex-mono)]">
              <span>
                <span className="text-[var(--nerv-orange-dim)] tracking-[0.06em]">IMG:</span>
                <span className="text-[var(--data-green)] glow-green">{totalCount}</span>
              </span>
              {favCount > 0 && (
                <>
                  <span className="text-[var(--steel-faint)]" aria-hidden="true">|</span>
                  <span>
                    <span className="text-[var(--nerv-orange-dim)] tracking-[0.06em]">FAV:</span>
                    <span className="text-[var(--alert-red)]">{favCount}</span>
                  </span>
                </>
              )}
              {filteredCount !== totalCount && (
                <>
                  <span className="text-[var(--steel-faint)]" aria-hidden="true">|</span>
                  <span>
                    <span className="text-[var(--nerv-orange-dim)] tracking-[0.06em]">SHOWN:</span>
                    <span className="text-[var(--steel-dim)]">{filteredCount}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Active filters row */}
          {(activeFilterCount > 0 || showFavoritesOnly || galleryFilterState.searchQuery) && (
            <ActiveFiltersRow
              galleryFilterState={galleryFilterState}
              showFavoritesOnly={showFavoritesOnly}
              activeFilterCount={activeFilterCount}
              localSearch={localSearch}
              setLocalSearch={setLocalSearch}
              setSearchQuery={setSearchQuery}
              setGalleryFilters={setGalleryFilters}
              clearGalleryFilters={clearGalleryFilters}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Active filter badges row
// ---------------------------------------------------------------------------

function ActiveFiltersRow({
  galleryFilterState,
  showFavoritesOnly,
  activeFilterCount,
  localSearch,
  setLocalSearch,
  setSearchQuery,
  setGalleryFilters,
  clearGalleryFilters,
}: {
  galleryFilterState: ReturnType<typeof useCreate>["galleryFilterState"];
  showFavoritesOnly: boolean;
  activeFilterCount: number;
  localSearch: string;
  setLocalSearch: (v: string) => void;
  setSearchQuery: (v: string) => void;
  setGalleryFilters: (f: Parameters<ReturnType<typeof useCreate>["setGalleryFilters"]>[0]) => void;
  clearGalleryFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 flex-wrap font-[family-name:var(--font-ibm-plex-mono)] bg-[var(--void)] border-b border-[var(--nerv-orange-dim)]/10">
      {showFavoritesOnly && (
        <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5 rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]">
          <Heart
            className="size-2.5 fill-[var(--alert-red)] text-[var(--alert-red)]"
            aria-hidden="true"
          />
          Favorites
          <button
            type="button"
            onClick={() => setGalleryFilters({ showFavoritesOnly: false })}
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm"
            aria-label="Clear favorites filter"
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      )}

      {galleryFilterState.searchQuery && (
        <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5 rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]">
          &ldquo;{galleryFilterState.searchQuery}&rdquo;
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              setSearchQuery("");
            }}
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm"
            aria-label="Clear search filter"
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      )}

      {galleryFilterState.filters.aspectRatio.map((ratio) => (
        <Badge
          key={ratio}
          variant="outline"
          className="gap-1 text-[10px] h-5 px-1.5 rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]"
        >
          {ratio}
          <button
            type="button"
            onClick={() => {
              const newRatios =
                galleryFilterState.filters.aspectRatio.filter(
                  (r) => r !== ratio,
                );
              setGalleryFilters({ aspectRatio: newRatios });
            }}
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm"
            aria-label={`Remove ${ratio} filter`}
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {galleryFilterState.filters.imageSize.map((size) => (
        <Badge
          key={size}
          variant="outline"
          className="gap-1 text-[10px] h-5 px-1.5 rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]"
        >
          {size}
          <button
            type="button"
            onClick={() => {
              const newSizes = galleryFilterState.filters.imageSize.filter(
                (s) => s !== size,
              );
              setGalleryFilters({ imageSize: newSizes });
            }}
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm"
            aria-label={`Remove ${size} filter`}
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {galleryFilterState.filters.modelIds.map((model) => (
        <Badge
          key={model}
          variant="outline"
          className="gap-1 text-[10px] h-5 px-1.5 max-w-[120px] rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]"
        >
          <span className="truncate">{model}</span>
          <button
            type="button"
            onClick={() => {
              const newModels = galleryFilterState.filters.modelIds.filter(
                (m) => m !== model,
              );
              setGalleryFilters({ modelIds: newModels });
            }}
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm shrink-0"
            aria-label={`Remove ${model} filter`}
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {galleryFilterState.filters.dateRange.preset && (
        <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5 rounded-none border-[var(--steel-faint)] text-[var(--steel-dim)]">
          {galleryFilterState.filters.dateRange.preset === "custom"
            ? "Custom date"
            : galleryFilterState.filters.dateRange.preset === "last-7-days"
              ? "Last 7 days"
              : galleryFilterState.filters.dateRange.preset === "last-30-days"
                ? "Last 30 days"
                : "Last 90 days"}
          <button
            type="button"
            onClick={() =>
              setGalleryFilters({ dateRange: { preset: null, from: null, to: null } })
            }
            className="ml-0.5 hover:text-[var(--nerv-orange)] focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)] rounded-sm"
            aria-label="Clear date range filter"
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      )}

      {(activeFilterCount > 0 || showFavoritesOnly) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px] rounded-none text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10"
          onClick={clearGalleryFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
