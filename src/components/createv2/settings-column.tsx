"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings, X } from "lucide-react";
import { useCreateV2 } from "./createv2-context";
import { ApiSelector } from "@/components/create/api-selector";
import type { AspectRatio, ImageSize } from "@/components/create/create-context";

const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "Standard" },
  { value: "3:4", label: "Portrait" },
  { value: "16:9", label: "Wide" },
  { value: "9:16", label: "Tall" },
  { value: "3:2", label: "Photo" },
  { value: "2:3", label: "Photo P" },
  { value: "4:5", label: "Social" },
  { value: "21:9", label: "Ultra" },
];

const imageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

function AspectRatioShape({ ratio }: { ratio: AspectRatio }) {
  const [w, h] = ratio.split(":").map(Number);
  const maxSize = 14;
  const width = w > h ? maxSize : Math.round((w / h) * maxSize);
  const height = h > w ? maxSize : Math.round((h / w) * maxSize);

  return (
    <div
      className="rounded-[2px] border border-current opacity-60"
      style={{ width, height }}
    />
  );
}

export function SettingsColumn() {
  const {
    settings,
    updateSettings,
    availableApis,
    selectedApiId,
    setSelectedApiId,
    isLoadingApis,
    settingsPanelOpen,
    setSettingsPanelOpen,
  } = useCreateV2();

  return (
    <div className="flex flex-col h-full w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Settings</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground lg:flex hidden"
          onClick={() => setSettingsPanelOpen(false)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Model
            </label>
            <ApiSelector
              apis={availableApis}
              selectedApiId={selectedApiId}
              onSelect={setSelectedApiId}
              disabled={isLoadingApis}
              className="w-full"
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {aspectRatioOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSettings({ aspectRatio: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-colors",
                    settings.aspectRatio === opt.value
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <AspectRatioShape ratio={opt.value} />
                  <span className="mt-0.5 leading-none">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Size */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Image Size
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {imageSizeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSettings({ imageSize: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs transition-colors",
                    settings.imageSize === opt.value
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Count */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Output Count
              </label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {settings.outputCount}
              </span>
            </div>
            <Slider
              value={[settings.outputCount]}
              onValueChange={([val]) => updateSettings({ outputCount: val })}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Negative Prompt
            </label>
            <textarea
              value={settings.negativePrompt}
              onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
              placeholder="What to avoid..."
              rows={3}
              className={cn(
                "w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2",
                "text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              )}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
