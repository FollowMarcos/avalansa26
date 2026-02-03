"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreate, type AspectRatio, type ImageSize } from "./create-context";

const ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "2:3", "3:2",
  "3:4", "4:3",
  "4:5", "5:4",
  "9:16", "16:9",
  "21:9",
];

const IMAGE_SIZES: ImageSize[] = ["1K", "2K", "4K"];

export function GalleryFilters() {
  const {
    galleryFilterState,
    setGalleryFilters,
    clearGalleryFilters,
    sessions,
  } = useCreate();

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

  const handleSessionChange = (value: string) => {
    setGalleryFilters({ sessionId: value === "all" ? null : value });
  };

  const activeFilterCount =
    galleryFilterState.filters.aspectRatio.length +
    galleryFilterState.filters.imageSize.length +
    (galleryFilterState.filters.sessionId ? 1 : 0);

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

          {/* Session Filter */}
          {sessions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Session
              </Label>
              <Select
                value={galleryFilterState.filters.sessionId || "all"}
                onValueChange={handleSessionChange}
              >
                <SelectTrigger className="w-full h-9 font-mono text-sm">
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-mono text-sm">
                    All sessions
                  </SelectItem>
                  {sessions.map((session) => (
                    <SelectItem
                      key={session.id}
                      value={session.id}
                      className="font-mono text-sm"
                    >
                      {session.name || `Session ${session.id.slice(0, 8)}`}
                      <span className="text-muted-foreground ml-2">
                        ({session.generation_count})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
