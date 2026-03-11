"use client";

import * as React from "react";
import { useCreate, type GeneratedImage } from "./create-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { Sparkles, ImageIcon, ArrowUp, ChevronDown } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BulkActionBar } from "./bulk-action-bar";
import { ImageDetailModal } from "./image-detail-modal";
import { GalleryItem, PendingCard, FailedCard } from "./gallery-item";
import { ImageCompareModal } from "./image-compare-modal";
import { CollectionSidebar } from "./gallery-collection-sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

function getDateGroupKey(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This Week";
  if (date >= startOfMonth) return "This Month";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupByDate(
  images: GeneratedImage[],
): Array<[string, GeneratedImage[]]> {
  const groups = new Map<string, GeneratedImage[]>();
  for (const image of images) {
    const key = getDateGroupKey(image.timestamp);
    const list = groups.get(key) ?? [];
    list.push(image);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

// ---------------------------------------------------------------------------
// Prompt grouping helpers
// ---------------------------------------------------------------------------

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function groupByPrompt(
  images: GeneratedImage[],
): Array<[string, GeneratedImage[]]> {
  const groups = new Map<string, GeneratedImage[]>();
  for (const image of images) {
    const key = normalizePrompt(image.prompt || "No prompt");
    const list = groups.get(key) ?? [];
    list.push(image);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

// ---------------------------------------------------------------------------
// Format helper
// ---------------------------------------------------------------------------

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const rtf = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
    style: "narrow",
  });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GenerationGallery() {
  const {
    selectedImage,
    addReferenceImageFromUrl,
    reuseImageSetup,
    retryFailedImage,
    setPrompt,
    galleryFilterState,
    toggleImageSelection,
    getFilteredHistory,
    toggleFavorite,
    bulkDeleteImages,
    dismissFailedImage,
    history,
    loadMoreHistory,
    hasMoreHistory,
    isLoadingMoreHistory,
    galleryColumnCount: columnCount,
    gallerySidebarOpen: sidebarOpen,
    setGallerySidebarOpen,
    dockCollapsed,
  } = useCreate();

  // Local UI state
  const [detailImage, setDetailImage] = React.useState<GeneratedImage | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [comparisonA, setComparisonA] = React.useState<GeneratedImage | null>(null);
  const [comparisonPair, setComparisonPair] = React.useState<[GeneratedImage, GeneratedImage] | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const filteredHistory = getFilteredHistory();
  const completedImages = filteredHistory.filter((img) => img.status !== "pending" && img.status !== "failed");

  // Keep detailImage in sync with latest history (e.g. after toggling favorite)
  React.useEffect(() => {
    if (!detailImage) return;
    const latest = history.find((img) => img.id === detailImage.id);
    if (latest && latest !== detailImage) {
      setDetailImage(latest);
    }
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLElement>>(new Map());
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  const pendingCount = history.filter((img) => img.status === "pending").length;

  // Infinite scroll
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMoreHistory) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreHistory) {
          loadMoreHistory();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreHistory, isLoadingMoreHistory, loadMoreHistory]);

  // Scroll-to-top visibility
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = React.useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const total = completedImages.length;
      if (total === 0) return;

      let newIndex = focusedIndex;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = Math.min(focusedIndex + 1, total - 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = Math.max(focusedIndex - 1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = Math.min(focusedIndex + columnCount, total - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = Math.max(focusedIndex - columnCount, 0);
      } else {
        return;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        itemRefs.current.get(newIndex)?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedIndex, completedImages.length, columnCount]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `generation-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Image URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleUseAsReference = async (url: string) => {
    await addReferenceImageFromUrl(url);
    toast.success("Added as reference");
  };

  const handleReuseSetup = async (image: GeneratedImage) => {
    await reuseImageSetup(image);
    toast.success("Setup restored");
  };

  const handlePasteToComposer = (prompt: string) => {
    setPrompt(prompt);
    toast.success("Prompt loaded into composer");
  };

  const handleSplitDownload = async (url: string, id: string) => {
    toast.info("Splitting image…");
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });

      const sliceCount = 4;
      const sliceHeight = img.height / sliceCount;

      const blobs = await Promise.all(
        Array.from({ length: sliceCount }, (_, i) => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = sliceHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(
            img,
            0,
            i * sliceHeight,
            img.width,
            sliceHeight,
            0,
            0,
            img.width,
            sliceHeight,
          );
          return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create slice"));
            }, "image/png");
          });
        }),
      );

      for (let i = 0; i < blobs.length; i++) {
        const blobUrl = URL.createObjectURL(blobs[i]);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${id}-slice-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
      toast.success(`Downloaded ${blobs.length} slices`);
    } catch {
      toast.error("Failed to split image");
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await bulkDeleteImages([id]);
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleImageClick = (image: GeneratedImage, e: React.MouseEvent) => {
    if (galleryFilterState.bulkSelection.enabled) {
      // Shift+click for range selection
      if (e.shiftKey && lastSelectedIndex !== null) {
        const currentIndex = filteredHistory.findIndex(
          (img) => img.id === image.id,
        );
        if (currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            const img = filteredHistory[i];
            if (
              img.status !== "pending" &&
              img.status !== "failed" &&
              !galleryFilterState.bulkSelection.selectedIds.has(img.id)
            ) {
              toggleImageSelection(img.id);
            }
          }
          return;
        }
      }
      const idx = filteredHistory.findIndex((img) => img.id === image.id);
      setLastSelectedIndex(idx);
      toggleImageSelection(image.id);
    } else {
      setDetailImage(image);
    }
  };

  const handleToggleFavorite = async (imageId: string) => {
    await toggleFavorite(imageId);
  };

  const handleCompare = (image: GeneratedImage) => {
    if (!comparisonA) {
      setComparisonA(image);
      toast.info("Select another image to compare");
    } else {
      setComparisonPair([comparisonA, image]);
      setComparisonA(null);
    }
  };

  // Navigation for detail modal
  const handleDetailNavigate = (direction: "prev" | "next") => {
    if (!detailImage) return;
    const currentIndex = filteredHistory.findIndex(
      (img) => img.id === detailImage.id,
    );
    if (currentIndex === -1) return;
    const newIndex =
      direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredHistory.length) {
      setDetailImage(filteredHistory[newIndex]);
    }
  };

  const detailImageIndex = detailImage
    ? filteredHistory.findIndex((img) => img.id === detailImage.id)
    : -1;

  const isSelected = (id: string) =>
    galleryFilterState.bulkSelection.selectedIds.has(id);

  // Date-grouped images (only for time-based sorts)
  const shouldGroupByDate =
    galleryFilterState.sortBy === "newest" ||
    galleryFilterState.sortBy === "oldest";

  const shouldGroupByPrompt = galleryFilterState.sortBy === "prompt-group";

  const dateGroups = React.useMemo(() => {
    if (!shouldGroupByDate) return null;
    return groupByDate(filteredHistory);
  }, [filteredHistory, shouldGroupByDate]);

  const promptGroups = React.useMemo(() => {
    if (!shouldGroupByPrompt) return null;
    return groupByPrompt(filteredHistory);
  }, [filteredHistory, shouldGroupByPrompt]);

  const [collapsedPromptGroups, setCollapsedPromptGroups] = React.useState<Set<string>>(new Set());

  const togglePromptGroup = React.useCallback((key: string) => {
    setCollapsedPromptGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Track item refs for keyboard nav
  let globalIndex = 0;
  const setItemRef = (idx: number) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(idx, el);
    else itemRefs.current.delete(idx);
  };

  // Grid style
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider delayDuration={400}>
      <div className={cn("flex-1 flex flex-col min-h-0 bg-[var(--void)] transition-[padding] duration-200", dockCollapsed ? "pl-4" : "pl-20")}>
        {/* Main content area with optional sidebar */}
        <div className="flex-1 flex min-h-0">
          {/* Collection sidebar */}
          <CollectionSidebar
            open={sidebarOpen}
            onClose={() => setGallerySidebarOpen(false)}
          />

          {/* Gallery grid */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-3 pt-3 pb-4">
            {filteredHistory.length === 0 && pendingCount === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-sm mx-auto nerv-grid-overlay">
                <div className="size-16 border border-[var(--nerv-orange-dim)]/40 bg-[var(--void-panel)] flex items-center justify-center mb-4 nerv-corner-bracket">
                  <ImageIcon
                    className="size-8 text-[var(--nerv-orange-dim)]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[var(--nerv-orange)] font-[family-name:var(--font-bebas-neue)] tracking-[0.15em] uppercase text-xl glow-orange text-balance nerv-compressed">
                  {galleryFilterState.searchQuery ||
                  galleryFilterState.filters.aspectRatio.length > 0 ||
                  galleryFilterState.filters.imageSize.length > 0 ||
                  galleryFilterState.filters.modelIds.length > 0 ||
                  galleryFilterState.filters.dateRange.preset
                    ? "NO MATCH FOUND"
                    : "NO GENERATIONS"}
                </p>
                <p className="text-[8px] text-[var(--steel-dim)] mt-0.5 font-[family-name:var(--font-noto-sans-jp)]">
                  {galleryFilterState.searchQuery ||
                  galleryFilterState.filters.aspectRatio.length > 0 ||
                  galleryFilterState.filters.imageSize.length > 0 ||
                  galleryFilterState.filters.modelIds.length > 0 ||
                  galleryFilterState.filters.dateRange.preset
                    ? "一致なし"
                    : "生成なし"}
                </p>
                <p className="text-sm text-[var(--steel-dim)] mt-1 uppercase tracking-[0.08em] font-[family-name:var(--font-ibm-plex-mono)] text-pretty">
                  {galleryFilterState.searchQuery ||
                  galleryFilterState.filters.aspectRatio.length > 0 ||
                  galleryFilterState.filters.imageSize.length > 0 ||
                  galleryFilterState.filters.modelIds.length > 0 ||
                  galleryFilterState.filters.dateRange.preset
                    ? "Try adjusting your search or filters"
                    : "Enter a prompt below to start creating"}
                </p>
                {!(
                  galleryFilterState.searchQuery ||
                  galleryFilterState.filters.aspectRatio.length > 0 ||
                  galleryFilterState.filters.imageSize.length > 0 ||
                  galleryFilterState.filters.modelIds.length > 0 ||
                  galleryFilterState.filters.dateRange.preset
                ) && (
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-[var(--nerv-orange)] text-[var(--void)] text-xs font-medium uppercase tracking-[0.1em] hover:bg-[var(--nerv-orange-hot)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)]"
                    onClick={() => {
                      const input = document.querySelector<HTMLTextAreaElement>(
                        'textarea[name="prompt"]',
                      );
                      input?.focus();
                    }}
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    START CREATING
                  </button>
                )}
              </div>
            ) : dateGroups ? (
              /* Date-grouped layout */
              <div className="space-y-6">
                {dateGroups.map(([dateLabel, images]) => {
                  const startIdx = globalIndex;
                  return (
                    <section key={dateLabel} aria-label={dateLabel}>
                      <h2 className="sticky top-0 z-10 text-xs font-[family-name:var(--font-ibm-plex-mono)] font-medium text-[var(--nerv-orange)] uppercase tracking-[0.12em] py-2 px-1 bg-[var(--void)]/95 backdrop-blur-sm border-b border-[var(--nerv-orange-dim)]/20 mb-3 glow-orange">
                        <span className="nerv-compressed">{dateLabel}</span>
                        <span className="ml-2 tabular-nums text-[var(--data-green)] glow-green">
                          ({images.length})
                        </span>
                      </h2>
                      <div className="grid gap-[2px]" style={gridStyle}>
                        {images.map((image) => {
                          const idx = globalIndex++;
                          return image.status === "pending" ? (
                            <PendingCard key={image.id} image={image} />
                          ) : image.status === "failed" ? (
                            <FailedCard key={image.id} image={image} onRetry={retryFailedImage} onDelete={dismissFailedImage} />
                          ) : (
                            <GalleryItem
                              key={image.id}
                              image={image}
                              isSelected={isSelected(image.id)}
                              isBulkMode={
                                galleryFilterState.bulkSelection.enabled
                              }
                              isCurrentSelected={
                                selectedImage?.id === image.id
                              }
                              isFocused={focusedIndex === idx}
                              onImageClick={handleImageClick}
                              onDownload={handleDownload}
                              onCopyPrompt={handleCopyPrompt}
                              onCopyUrl={handleCopyUrl}
                              onUseAsReference={handleUseAsReference}
                              onReuseSetup={handleReuseSetup}
                              onSplitDownload={handleSplitDownload}
                              onToggleSelection={toggleImageSelection}
                              onToggleFavorite={handleToggleFavorite}
                              onDelete={handleDelete}
                              onPasteToComposer={handlePasteToComposer}
                              onCompare={handleCompare}
                              onViewDetails={setDetailImage}
                              formatTime={formatTime}
                              itemRef={setItemRef(idx)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : promptGroups ? (
              /* Prompt-grouped layout */
              <div className="space-y-6">
                {promptGroups.map(([promptKey, images]) => {
                  const isCollapsed = collapsedPromptGroups.has(promptKey);
                  const displayPrompt = images[0]?.prompt || "No prompt";
                  return (
                    <section key={promptKey} aria-label={`Prompt: ${displayPrompt}`}>
                      <button
                        type="button"
                        className="sticky top-0 z-10 w-full flex items-center gap-2 text-left text-xs font-[family-name:var(--font-ibm-plex-mono)] font-medium text-[var(--nerv-orange)] uppercase tracking-[0.08em] py-2 px-1 bg-[var(--void)]/95 backdrop-blur-sm border-b border-[var(--nerv-orange-dim)]/20 mb-3 hover:text-[var(--nerv-orange-hot)] transition-colors glow-orange"
                        onClick={() => togglePromptGroup(promptKey)}
                        aria-expanded={!isCollapsed}
                      >
                        <ChevronDown
                          className={cn(
                            "size-3.5 shrink-0 transition-transform",
                            isCollapsed && "-rotate-90",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate max-w-[500px] nerv-compressed">{displayPrompt}</span>
                        <span className="ml-2 tabular-nums text-[var(--data-green)] glow-green shrink-0">
                          ({images.length})
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="grid gap-[2px]" style={gridStyle}>
                          {images.map((image) => {
                            const idx = globalIndex++;
                            return image.status === "pending" ? (
                              <PendingCard key={image.id} image={image} />
                            ) : image.status === "failed" ? (
                              <FailedCard key={image.id} image={image} onRetry={retryFailedImage} onDelete={dismissFailedImage} />
                            ) : (
                              <GalleryItem
                                key={image.id}
                                image={image}
                                isSelected={isSelected(image.id)}
                                isBulkMode={galleryFilterState.bulkSelection.enabled}
                                isCurrentSelected={selectedImage?.id === image.id}
                                isFocused={focusedIndex === idx}
                                onImageClick={handleImageClick}
                                onDownload={handleDownload}
                                onCopyPrompt={handleCopyPrompt}
                                onCopyUrl={handleCopyUrl}
                                onUseAsReference={handleUseAsReference}
                                onReuseSetup={handleReuseSetup}
                                onSplitDownload={handleSplitDownload}
                                onToggleSelection={toggleImageSelection}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                onPasteToComposer={handlePasteToComposer}
                                onCompare={handleCompare}
                                onViewDetails={setDetailImage}
                                formatTime={formatTime}
                                itemRef={setItemRef(idx)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              /* Flat layout (prompt sort) */
              <div className="grid gap-[2px]" style={gridStyle}>
                {filteredHistory.map((image) => {
                  const idx = globalIndex++;
                  return image.status === "pending" ? (
                    <PendingCard key={image.id} image={image} />
                  ) : image.status === "failed" ? (
                    <FailedCard key={image.id} image={image} onRetry={retryFailedImage} onDelete={dismissFailedImage} />
                  ) : (
                    <GalleryItem
                      key={image.id}
                      image={image}
                      isSelected={isSelected(image.id)}
                      isBulkMode={galleryFilterState.bulkSelection.enabled}
                      isCurrentSelected={selectedImage?.id === image.id}
                      isFocused={focusedIndex === idx}
                      onImageClick={handleImageClick}
                      onDownload={handleDownload}
                      onCopyPrompt={handleCopyPrompt}
                      onCopyUrl={handleCopyUrl}
                      onUseAsReference={handleUseAsReference}
                      onReuseSetup={handleReuseSetup}
                      onSplitDownload={handleSplitDownload}
                      onToggleSelection={toggleImageSelection}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                      onPasteToComposer={handlePasteToComposer}
                      onCompare={handleCompare}
                      onViewDetails={setDetailImage}
                      formatTime={formatTime}
                      itemRef={setItemRef(idx)}
                    />
                  );
                })}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMoreHistory && filteredHistory.length > 0 && (
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-8"
              >
                {isLoadingMoreHistory && <Loader size="sm" />}
              </div>
            )}
          </div>
        </div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className={cn(
              "fixed bottom-24 z-40 size-10",
              "bg-[#010101]/90 backdrop-blur-xl",
              "border border-[var(--nerv-orange-dim)]/40",
              "flex items-center justify-center",
              "text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]",
              "transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)]",
              dockCollapsed ? "left-6" : "left-24",
            )}
          >
            <ArrowUp className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}

        {/* Comparison hint */}
        {comparisonA && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-[#010101] border border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)] text-[var(--steel)] text-xs font-[family-name:var(--font-ibm-plex-mono)] uppercase tracking-[0.08em] flex items-center gap-2">
            <span>Click another image to compare</span>
            <button
              type="button"
              className="ml-1 text-[var(--nerv-orange)] hover:text-[var(--nerv-orange-hot)] underline hover:no-underline focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)]"
              onClick={() => setComparisonA(null)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar />

        {/* Image Detail Modal */}
        <ImageDetailModal
          image={detailImage}
          isOpen={!!detailImage}
          onClose={() => setDetailImage(null)}
          onNavigate={handleDetailNavigate}
          hasPrev={detailImageIndex > 0}
          hasNext={detailImageIndex < filteredHistory.length - 1}
        />

        {/* Comparison Modal */}
        <ImageCompareModal
          images={comparisonPair}
          isOpen={!!comparisonPair}
          onClose={() => setComparisonPair(null)}
          history={history}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
          <AlertDialogContent className="rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[var(--alert-red)] uppercase tracking-[0.1em] text-sm font-[family-name:var(--font-ibm-plex-mono)]">Delete Image</AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--steel-dim)] text-xs font-[family-name:var(--font-ibm-plex-mono)]">
                This will permanently delete this image. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none border-[var(--steel-dim)]/40 text-[var(--steel-dim)] hover:bg-[var(--steel-faint)] hover:text-[var(--steel)] bg-transparent">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-none bg-[var(--alert-red)] text-[var(--void)] hover:bg-[var(--alert-red-hot)] border-none">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
