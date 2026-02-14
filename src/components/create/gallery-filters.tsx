"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getDateRangeFromPreset } from "@/lib/date-range-presets";
import {
  useCreate,
  type AspectRatio,
  type ImageSize,
  type DateRangePreset,
} from "./create-context";

const ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "2:3", "3:2",
  "3:4", "4:3",
  "4:5", "5:4",
  "9:16", "16:9",
  "21:9",
];

const IMAGE_SIZES: ImageSize[] = ["1K", "2K", "4K"];

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "last-7-days", label: "7 days" },
  { value: "last-30-days", label: "30 days" },
  { value: "last-90-days", label: "90 days" },
];

export function GalleryFilters() {
  const {
    galleryFilterState,
    setGalleryFilters,
    clearGalleryFilters,
    history,
  } = useCreate();

  // Extract unique models from history
  const uniqueModels = React.useMemo(() => {
    const models = new Set<string>();
    for (const img of history) {
      if (img.settings.model) {
        models.add(img.settings.model);
      }
    }
    return Array.from(models).sort();
  }, [history]);

  const handleAspectRatioToggle = (ratio: AspectRatio) => {
    const current = galleryFilterState.filters.aspectRatio;
    const newRatios = current.includes(ratio)
      ? current.filter((r) => r !== ratio)
      : [...current, ratio];
    setGalleryFilters({ aspectRatio: newRatios });
  };

  const handleImageSizeToggle = (size: ImageSize) => {
    const current = galleryFilterState.filters.imageSize;
    const newSizes = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setGalleryFilters({ imageSize: newSizes });
  };

  const handleModelToggle = (model: string) => {
    const current = galleryFilterState.filters.modelIds;
    const newModels = current.includes(model)
      ? current.filter((m) => m !== model)
      : [...current, model];
    setGalleryFilters({ modelIds: newModels });
  };

  const handleDatePreset = (preset: DateRangePreset) => {
    const currentPreset = galleryFilterState.filters.dateRange.preset;
    if (currentPreset === preset) {
      // Toggle off
      setGalleryFilters({ dateRange: { preset: null, from: null, to: null } });
    } else {
      const range = getDateRangeFromPreset(preset);
      setGalleryFilters({ dateRange: { preset, from: range.from, to: range.to } });
    }
  };

  const handleCustomDateToggle = () => {
    const isCustom = galleryFilterState.filters.dateRange.preset === "custom";
    if (isCustom) {
      setGalleryFilters({ dateRange: { preset: null, from: null, to: null } });
    } else {
      setGalleryFilters({ dateRange: { preset: "custom", from: null, to: null } });
    }
  };

  const activeFilterCount =
    galleryFilterState.filters.aspectRatio.length +
    galleryFilterState.filters.imageSize.length +
    galleryFilterState.filters.modelIds.length +
    (galleryFilterState.filters.dateRange.preset ? 1 : 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono font-medium text-sm">Filters</h4>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearGalleryFilters}
          >
            Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Aspect Ratio
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <div key={ratio} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ratio-${ratio}`}
                    checked={galleryFilterState.filters.aspectRatio.includes(ratio)}
                    onCheckedChange={() => handleAspectRatioToggle(ratio)}
                  />
                  <Label
                    htmlFor={`ratio-${ratio}`}
                    className="text-sm font-mono cursor-pointer"
                  >
                    {ratio}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Image Size */}
          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Image Size
            </Label>
            <div className="flex gap-4">
              {IMAGE_SIZES.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={galleryFilterState.filters.imageSize.includes(size)}
                    onCheckedChange={() => handleImageSizeToggle(size)}
                  />
                  <Label
                    htmlFor={`size-${size}`}
                    className="text-sm font-mono cursor-pointer"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Model */}
          {uniqueModels.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Model
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {uniqueModels.map((model) => (
                  <div key={model} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model}`}
                      checked={galleryFilterState.filters.modelIds.includes(model)}
                      onCheckedChange={() => handleModelToggle(model)}
                    />
                    <Label
                      htmlFor={`model-${model}`}
                      className="text-sm font-mono cursor-pointer truncate"
                      title={model}
                    >
                      {model}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Date Range
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              {DATE_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "px-2 py-1.5 text-xs font-mono rounded-md border transition-colors",
                    galleryFilterState.filters.dateRange.preset === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                  onClick={() => handleDatePreset(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={cn(
                "w-full px-2 py-1.5 text-xs font-mono rounded-md border transition-colors text-left",
                galleryFilterState.filters.dateRange.preset === "custom"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border"
              )}
              onClick={handleCustomDateToggle}
            >
              Custom range
            </button>

            {galleryFilterState.filters.dateRange.preset === "custom" && (
              <div className="space-y-1.5 pl-2 border-l-2 border-border">
                <div>
                  <Label htmlFor="date-from" className="text-[10px] text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    className="h-7 text-xs font-mono"
                    value={
                      galleryFilterState.filters.dateRange.from
                        ? new Date(galleryFilterState.filters.dateRange.from)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const from = e.target.value
                        ? new Date(e.target.value).getTime()
                        : null;
                      setGalleryFilters({
                        dateRange: {
                          ...galleryFilterState.filters.dateRange,
                          from,
                        },
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-[10px] text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    className="h-7 text-xs font-mono"
                    value={
                      galleryFilterState.filters.dateRange.to
                        ? new Date(galleryFilterState.filters.dateRange.to)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const to = e.target.value
                        ? new Date(e.target.value + "T23:59:59").getTime()
                        : null;
                      setGalleryFilters({
                        dateRange: {
                          ...galleryFilterState.filters.dateRange,
                          to,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
