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
  BookMarked,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
import { useReactFlow } from "@xyflow/react";

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const sortOptions: { value: GallerySortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "prompt-asc", label: "Prompt A\u2013Z" },
  { value: "prompt-desc", label: "Prompt Z\u2013A" },
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
    viewMode,
    setViewMode,
    interactionMode,
    setInteractionMode,
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
    (galleryFilterState.filters.collectionId ? 1 : 0);

  const showFavoritesOnly = galleryFilterState.filters.showFavoritesOnly;
  const filteredCount = getFilteredHistory().length;

  const isGallery = viewMode === "gallery";
  const isWorkflow = viewMode === "workflow";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-10rem)]">
        <div className="flex flex-col gap-2">
          {/* Main island */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-lg px-2 py-1.5">
            {/* --- Always visible: Sidebar + Vault toggles --- */}
            {isGallery && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg"
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
                        className="size-8 rounded-lg"
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

                <div className="w-px h-5 bg-border mx-0.5" aria-hidden="true" />
              </>
            )}

            {/* --- View Mode Switcher --- */}
            <div
              className="flex items-center border border-border rounded-lg p-0.5"
              role="group"
              aria-label="View mode"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("gallery")}
                    aria-label="Gallery view"
                    aria-pressed={isGallery}
                    className={cn(
                      "size-7 rounded-md",
                      isGallery && "bg-muted",
                    )}
                  >
                    <LayoutGrid
                      className="size-3.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
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
                    aria-pressed={isWorkflow}
                    className={cn(
                      "size-7 rounded-md",
                      isWorkflow && "bg-muted",
                    )}
                  >
                    <GitBranch
                      className="size-3.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Workflow View</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-5 bg-border mx-0.5" aria-hidden="true" />

            {/* --- Gallery-specific tools --- */}
            {isGallery && (
              <>
                {/* Search */}
                <div className="relative min-w-[160px] max-w-[220px]">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    name="gallery-search"
                    autoComplete="off"
                    placeholder="Search…"
                    aria-label="Search prompts"
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 h-7 font-mono text-xs rounded-lg"
                  />
                  {localSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 size-5"
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
                  <SelectTrigger className="w-[130px] h-7 font-mono text-xs rounded-lg">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-mono text-xs"
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
                      variant={showFavoritesOnly ? "secondary" : "ghost"}
                      size="icon"
                      className="size-8 rounded-lg"
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
                            ? "size-4 fill-red-500 text-red-500"
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
                      variant={activeFilterCount > 0 ? "secondary" : "ghost"}
                      size="icon"
                      className="size-8 rounded-lg relative"
                      aria-label="Filters"
                    >
                      <SlidersHorizontal
                        className="size-4"
                        aria-hidden="true"
                      />
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-mono">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <GalleryFilters />
                  </PopoverContent>
                </Popover>

                {/* Bulk Select */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        galleryFilterState.bulkSelection.enabled
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="size-8 rounded-lg"
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

                <div
                  className="w-px h-5 bg-border mx-0.5"
                  aria-hidden="true"
                />

                {/* Column count */}
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
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
                        className="size-6"
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
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-3 text-center">
                    {galleryColumnCount}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono tabular-nums ml-1">
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
              </>
            )}

            {/* --- Workflow-specific tools --- */}
            {isWorkflow && <WorkflowTools />}
          </div>

          {/* Active filters row (gallery only) */}
          {isGallery && (activeFilterCount > 0 || showFavoritesOnly || galleryFilterState.searchQuery) && (
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
// Workflow tools sub-component (uses ReactFlow hooks)
// ---------------------------------------------------------------------------

function WorkflowTools() {
  const { interactionMode, setInteractionMode } = useCreate();
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const [currentZoom, setCurrentZoom] = React.useState(100);

  React.useEffect(() => {
    const interval = setInterval(() => {
      try {
        setCurrentZoom(Math.round(getZoom() * 100));
      } catch {
        // ReactFlow may not be ready
      }
    }, 200);
    return () => clearInterval(interval);
  }, [getZoom]);

  return (
    <>
      {/* Tool Switcher */}
      <div
        className="flex items-center"
        role="group"
        aria-label="Interaction tools"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInteractionMode("select")}
              aria-label="Select tool (V)"
              aria-pressed={interactionMode === "select"}
              className={cn(
                "size-8 rounded-lg",
                interactionMode === "select" && "bg-muted",
              )}
            >
              <MousePointer2
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select Tool (V)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInteractionMode("hand")}
              aria-label="Hand tool (H)"
              aria-pressed={interactionMode === "hand"}
              className={cn(
                "size-8 rounded-lg",
                interactionMode === "hand" && "bg-muted",
              )}
            >
              <Hand className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hand Tool (H)</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-px h-5 bg-border mx-0.5" aria-hidden="true" />

      {/* Zoom Controls */}
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => zoomOut({ duration: 200 })}
              aria-label="Zoom out"
              className="size-8 rounded-lg"
            >
              <ZoomOut
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <button
          onClick={() => fitView({ padding: 0.2, duration: 300 })}
          aria-label={`Current zoom ${currentZoom}%, click to fit view`}
          className="px-2 py-1 min-h-[32px] text-xs font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center rounded focus-visible:ring-2 focus-visible:ring-ring"
        >
          {currentZoom}%
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => zoomIn({ duration: 200 })}
              aria-label="Zoom in"
              className="size-8 rounded-lg"
            >
              <ZoomIn
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
              aria-label="Fit view"
              className="size-8 rounded-lg"
            >
              <Maximize2
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit View</TooltipContent>
        </Tooltip>
      </div>
    </>
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
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      {showFavoritesOnly && (
        <Badge variant="outline" className="gap-1 font-mono text-[10px] h-5 px-1.5">
          <Heart
            className="size-2.5 fill-red-500 text-red-500"
            aria-hidden="true"
          />
          Favorites
          <button
            type="button"
            onClick={() => setGalleryFilters({ showFavoritesOnly: false })}
            className="ml-0.5 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            aria-label="Clear favorites filter"
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      )}

      {galleryFilterState.searchQuery && (
        <Badge variant="outline" className="gap-1 font-mono text-[10px] h-5 px-1.5">
          &ldquo;{galleryFilterState.searchQuery}&rdquo;
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              setSearchQuery("");
            }}
            className="ml-0.5 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
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
          className="gap-1 font-mono text-[10px] h-5 px-1.5"
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
            className="ml-0.5 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
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
          className="gap-1 font-mono text-[10px] h-5 px-1.5"
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
            className="ml-0.5 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            aria-label={`Remove ${size} filter`}
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        </Badge>
      ))}

      {(activeFilterCount > 0 || showFavoritesOnly) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={clearGalleryFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
