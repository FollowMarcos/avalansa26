"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, ImageSize, AspectRatio } from "./create-context";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers,
  Image as ImageIcon,
  X,
  Trash2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SettingsPanel() {
  const { settingsPanelOpen, toggleSettingsPanel } = useCreate();

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence initial={false}>
        {settingsPanelOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col bg-background border-l border-border overflow-hidden"
          >
            <Tabs defaultValue="settings" className="flex flex-col h-full">
              <TabsList className="grid grid-cols-3 m-2 bg-muted">
                <TabsTrigger value="settings" className="text-xs font-mono">
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="reference" className="text-xs font-mono">
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  Reference
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-mono">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="flex-1 p-4 mt-0 overflow-hidden">
                <SettingsTab />
              </TabsContent>

              <TabsContent value="reference" className="flex-1 p-4 mt-0 overflow-hidden">
                <ReferenceTab />
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-4 mt-0 overflow-hidden">
                <HistoryTab />
              </TabsContent>
            </Tabs>

            {/* Collapse button */}
            <button
              onClick={toggleSettingsPanel}
              aria-label="Collapse settings"
              aria-expanded={true}
              className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 h-12 rounded-l-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-r-0 border-border"
            >
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSettingsPanel}
            aria-label="Expand settings"
            aria-expanded={false}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 size-6 h-12 rounded-l-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-r-0 border-border"
          >
            <ChevronLeft className="size-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

function SettingsTab() {
  const { settings, updateSettings } = useCreate();

  const imageSizes: { value: ImageSize; label: string; description: string }[] = [
    { value: "1K", label: "1K", description: "1024px - Fast" },
    { value: "2K", label: "2K", description: "2048px - Balanced" },
    { value: "4K", label: "4K", description: "4096px - Maximum" },
  ];

  const aspectRatios: { value: AspectRatio; label: string; category: string }[] = [
    { value: "1:1", label: "1:1", category: "Square" },
    { value: "4:3", label: "4:3", category: "Standard" },
    { value: "3:4", label: "3:4", category: "Portrait" },
    { value: "3:2", label: "3:2", category: "Photo" },
    { value: "2:3", label: "2:3", category: "Portrait" },
    { value: "16:9", label: "16:9", category: "Wide" },
    { value: "9:16", label: "9:16", category: "Tall" },
    { value: "5:4", label: "5:4", category: "Photo" },
    { value: "4:5", label: "4:5", category: "Social" },
    { value: "21:9", label: "21:9", category: "Ultrawide" },
  ];

  return (
    <ScrollArea className="h-full pr-4 -mr-4">
      <div className="space-y-6">
        {/* Image Size */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Image Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {imageSizes.map((size) => (
              <Tooltip key={size.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => updateSettings({ imageSize: size.value })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-mono font-medium transition-colors",
                      settings.imageSize === size.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {size.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{size.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label htmlFor="settings-aspect-ratio" className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Aspect Ratio
          </label>
          <Select
            value={settings.aspectRatio}
            onValueChange={(value: AspectRatio) => updateSettings({ aspectRatio: value })}
          >
            <SelectTrigger id="settings-aspect-ratio" className="bg-muted border-border font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aspectRatios.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value} className="font-mono">
                  <span className="flex items-center gap-2">
                    <span>{ratio.label}</span>
                    <span className="text-muted-foreground text-xs">({ratio.category})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output Count */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Output Count
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => updateSettings({ outputCount: count })}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-mono font-medium transition-colors",
                  settings.outputCount === count
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Seed */}
        <div className="space-y-2">
          <label htmlFor="settings-seed" className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Seed
          </label>
          <input
            id="settings-seed"
            type="text"
            value={settings.seed}
            onChange={(e) => updateSettings({ seed: e.target.value })}
            placeholder="Random"
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Use a seed for reproducible results
          </p>
        </div>

        {/* Model Info */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-mono font-medium">Nano Banana Pro Preview</p>
              <p>Gemini 3 Pro Image with advanced reasoning and text rendering.</p>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function ReferenceTab() {
  const { referenceImages, addReferenceImages, removeReferenceImage, settings, updateSettings } = useCreate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addReferenceImages(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasReferences = referenceImages.length > 0;

  return (
    <ScrollArea className="h-full pr-4 -mr-4">
      <div className="space-y-6">
        {/* Reference Images */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
              Reference Images
            </label>
            <span className="text-xs text-muted-foreground font-mono">
              {referenceImages.length}/14
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {hasReferences ? (
            <div className="grid grid-cols-3 gap-2">
              {referenceImages.map((img) => (
                <div key={img.id} className="relative group aspect-square">
                  <div className="w-full h-full rounded-lg overflow-hidden bg-muted border border-border">
                    <Image
                      src={img.preview}
                      alt="Reference"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeReferenceImage(img.id)}
                    aria-label="Remove reference"
                    className="absolute top-1 right-1 size-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3 text-foreground" />
                  </button>
                </div>
              ))}
              {referenceImages.length < 14 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground flex items-center justify-center transition-colors"
                >
                  <ImageIcon className="size-5 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-muted-foreground flex flex-col items-center justify-center transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Add reference images</span>
            </button>
          )}
        </div>

        {/* Style Strength - only when references present */}
        {hasReferences && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                Style Strength
              </label>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {settings.styleStrength}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.styleStrength}
              onChange={(e) => updateSettings({ styleStrength: parseInt(e.target.value) })}
              className="w-full accent-foreground"
            />
            <p className="text-xs text-muted-foreground">
              How strongly to apply the reference style
            </p>
          </div>
        )}

        {/* Reference Tips */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Reference Guidelines</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Up to 6 objects for consistency</li>
                <li>Up to 5 human faces for identity</li>
                <li>Mix styles from multiple images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="space-y-2">
          <label htmlFor="settings-negative-prompt" className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Negative Prompt
          </label>
          <textarea
            id="settings-negative-prompt"
            value={settings.negativePrompt}
            onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
            placeholder="Elements to avoid..."
            rows={3}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      </div>
    </ScrollArea>
  );
}

function HistoryTab() {
  const { history, selectedImage, selectImage, clearHistory } = useCreate();

  return (
    <div className="h-full flex flex-col">
      {history.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground font-mono">{history.length} images</span>
          <button
            onClick={clearHistory}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors font-mono"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      <ScrollArea className="flex-1 pr-4 -mr-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Layers className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No generations yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {history.map((image) => (
              <button
                key={image.id}
                onClick={() => selectImage(image)}
                aria-label={image.prompt || "Select generation from history"}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden group",
                  selectedImage?.id === image.id && "ring-2 ring-foreground"
                )}
              >
                <Image
                  src={image.url}
                  alt={image.prompt || "Generated"}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.settings.imageSize}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
