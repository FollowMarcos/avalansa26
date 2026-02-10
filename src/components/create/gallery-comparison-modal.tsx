"use client";

import * as React from "react";
import Image from "next/image";
import { X, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { GeneratedImage } from "./create-context";

interface ComparisonModalProps {
  images: [GeneratedImage, GeneratedImage] | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComparisonModal({ images, isOpen, onClose }: ComparisonModalProps) {
  const [swapped, setSwapped] = React.useState(false);

  if (!images) return null;

  const [a, b] = swapped ? [images[1], images[0]] : images;

  const settingsA = a.settings;
  const settingsB = b.settings;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Compare Images</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-medium">Compare Images</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setSwapped((s) => !s)}
            >
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
              Swap
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onClose}
              aria-label="Close comparison"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Side-by-side view */}
        <div className="flex-1 flex min-h-0">
          <ComparisonPane image={a} label="A" />
          <div className="w-px bg-border shrink-0" />
          <ComparisonPane image={b} label="B" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Single pane
// ---------------------------------------------------------------------------

function ComparisonPane({
  image,
  label,
}: {
  image: GeneratedImage;
  label: string;
}) {
  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Label */}
      <div className="px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          Image {label}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Image */}
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
            <Image
              src={image.url}
              alt={image.prompt || "Generated image"}
              width={800}
              height={800}
              className="w-full h-auto object-contain"
              quality={90}
            />
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Prompt
            </h4>
            <p className="text-xs font-mono leading-relaxed text-pretty">
              {image.prompt || "No prompt"}
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Settings
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
              <SettingRow label="Size" value={image.settings.imageSize} />
              <SettingRow label="Ratio" value={image.settings.aspectRatio} />
              <SettingRow
                label="Model"
                value={image.settings.model || "Default"}
              />
              <SettingRow
                label="Speed"
                value={image.settings.generationSpeed || "fast"}
              />
              <SettingRow label="Date" value={formatDate(image.timestamp)} />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums truncate ml-2">{value}</span>
    </div>
  );
}
