"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, Resolution, AspectRatio, Quality } from "./create-context";
import { VerticalSlider } from "./vertical-slider";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers,
  Image as ImageIcon,
  X,
  Trash2,
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

export function SettingsPanel() {
  const { rightSidebarOpen, toggleRightSidebar } = useCreate();

  return (
    <AnimatePresence initial={false}>
      {rightSidebarOpen ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col bg-zinc-900 border-l border-zinc-800 overflow-hidden"
        >
          <Tabs defaultValue="settings" className="flex flex-col h-full">
            <TabsList className="grid grid-cols-3 m-2 bg-zinc-800/50">
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3.5 h-3.5 mr-1" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="reference" className="text-xs">
                <ImageIcon className="w-3.5 h-3.5 mr-1" />
                Reference
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
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
            onClick={toggleRightSidebar}
            aria-label={rightSidebarOpen ? "Collapse settings" : "Expand settings"}
            aria-expanded={rightSidebarOpen}
            className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 h-12 rounded-l-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="size-4 text-zinc-400" />
          </button>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleRightSidebar}
          aria-label="Expand settings"
          aria-expanded={false}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 size-6 h-12 rounded-l-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="size-4 text-zinc-400" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function SettingsTab() {
  const { settings, updateSettings } = useCreate();

  const resolutions: { value: Resolution; label: string }[] = [
    { value: "1024", label: "1024px (Standard)" },
    { value: "2048", label: "2048px (HD)" },
    { value: "4096", label: "4096px (4K)" },
  ];

  const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: "1:1", label: "1:1 (Square)" },
    { value: "16:9", label: "16:9 (Landscape)" },
    { value: "9:16", label: "9:16 (Portrait)" },
    { value: "21:9", label: "21:9 (Ultrawide)" },
    { value: "4:5", label: "4:5 (Instagram)" },
  ];

  const qualities: { value: Quality; label: string }[] = [
    { value: "draft", label: "Draft (Fast)" },
    { value: "standard", label: "Standard" },
    { value: "high", label: "High Quality" },
    { value: "4k", label: "4K Ultra" },
  ];

  return (
    <ScrollArea className="h-full pr-4 -mr-4">
      <div className="space-y-6">
        {/* Resolution */}
        <div className="space-y-2">
          <label htmlFor="settings-resolution" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Resolution
          </label>
          <Select
            value={settings.resolution}
            onValueChange={(value: Resolution) => updateSettings({ resolution: value })}
          >
            <SelectTrigger id="settings-resolution" className="bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resolutions.map((res) => (
                <SelectItem key={res.value} value={res.value}>
                  {res.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label htmlFor="settings-aspect-ratio" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Aspect Ratio
          </label>
          <Select
            value={settings.aspectRatio}
            onValueChange={(value: AspectRatio) => updateSettings({ aspectRatio: value })}
          >
            <SelectTrigger id="settings-aspect-ratio" className="bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aspectRatios.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality */}
        <div className="space-y-2">
          <label htmlFor="settings-quality" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Quality
          </label>
          <Select
            value={settings.quality}
            onValueChange={(value: Quality) => updateSettings({ quality: value })}
          >
            <SelectTrigger id="settings-quality" className="bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {qualities.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output Count */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Output Count
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => updateSettings({ outputCount: count })}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                  settings.outputCount === count
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Thinking Mode */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Visual Reasoning
          </label>
          <button
            onClick={() => updateSettings({ thinking: !settings.thinking })}
            className={cn(
              "w-full py-2 rounded-lg text-sm font-medium transition-colors",
              settings.thinking
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            )}
          >
            {settings.thinking ? "Enabled" : "Disabled"}
          </button>
          <p className="text-xs text-zinc-500">
            Shows AI thinking process during generation
          </p>
        </div>

        {/* Seed */}
        <div className="space-y-2">
          <input
            id="settings-seed"
            type="text"
            value={settings.seed}
            onChange={(e) => updateSettings({ seed: e.target.value })}
            placeholder="Random"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>
    </ScrollArea>
  );
}

function ReferenceTab() {
  const { styleReference, setStyleReference, settings, updateSettings, mode } = useCreate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setStyleReference(file);
  };

  return (
    <ScrollArea className="h-full pr-4 -mr-4">
      <div className="space-y-6">
        {/* Style Reference */}
        <div className="space-y-2">
          <label htmlFor="style-ref-upload" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Style Reference
          </label>

          <input
            id="style-ref-upload"
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {styleReference ? (
            <div className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={styleReference.preview}
                  alt="Style reference"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => setStyleReference(null)}
                aria-label="Remove style reference"
                className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-600 flex flex-col items-center justify-center transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500">Upload reference</span>
            </button>
          )}
        </div>

        {/* Style Strength */}
        {(mode === "style-transfer" || styleReference) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Style Strength
              </label>
              <span className="text-xs text-zinc-500 tabular-nums">
                {settings.styleStrength}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.styleStrength}
              onChange={(e) => updateSettings({ styleStrength: parseInt(e.target.value) })}
              className="w-full accent-zinc-400"
            />
          </div>
        )}

        {/* Negative Prompt */}
        <div className="space-y-2">
          <label htmlFor="settings-negative-prompt" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Negative Prompt
          </label>
          <textarea
            id="settings-negative-prompt"
            value={settings.negativePrompt}
            onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
            placeholder="Elements to avoid…"
            rows={3}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
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
          <span className="text-xs text-zinc-500">{history.length} images</span>
          <button
            onClick={clearHistory}
            className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      <ScrollArea className="flex-1 pr-4 -mr-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Layers className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600">No generations yet</p>
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
                  selectedImage?.id === image.id && "ring-1 ring-zinc-400"
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
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
