"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import type { ReferenceImageInfo, GeneratedImage, SavedReferenceImage } from "@/components/create/create-context";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

interface ReferenceSectionProps {
  label: string;
  description: string;
  accentColor: "violet" | "blue" | "amber" | "emerald" | "cyan";
  icon: LucideIcon;
  image?: ReferenceImageInfo;
  onImageChange: (ref: ReferenceImageInfo | undefined) => void;
  completedGens: GeneratedImage[];
  savedReferences: SavedReferenceImage[];
  children?: React.ReactNode;
}

const RING_COLORS: Record<string, string> = {
  violet: "ring-violet-500",
  blue: "ring-blue-500",
  amber: "ring-amber-500",
  emerald: "ring-emerald-500",
  cyan: "ring-cyan-500",
};

const RING_HOVER: Record<string, string> = {
  violet: "hover:ring-violet-500/50",
  blue: "hover:ring-blue-500/50",
  amber: "hover:ring-amber-500/50",
  emerald: "hover:ring-emerald-500/50",
  cyan: "hover:ring-cyan-500/50",
};

const BORDER_ACTIVE: Record<string, string> = {
  violet: "border-violet-500/30",
  blue: "border-blue-500/30",
  amber: "border-amber-500/30",
  emerald: "border-emerald-500/30",
  cyan: "border-cyan-500/30",
};

export function ReferenceSection({
  label,
  description,
  accentColor,
  icon: Icon,
  image,
  onImageChange,
  completedGens,
  savedReferences,
  children,
}: ReferenceSectionProps) {
  const ringColor = RING_COLORS[accentColor];
  const ringHover = RING_HOVER[accentColor];
  const borderActive = BORDER_ACTIVE[accentColor];

  const handleUpload = async (files: File[]) => {
    if (!files[0]) return;
    try {
      const { uploadReferenceImage } = await import("@/utils/supabase/storage");
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const result = await uploadReferenceImage(files[0], userData.user.id);
      if (result.path) {
        onImageChange({ url: result.url, storagePath: result.path });
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>

      {/* Current image preview */}
      {image?.url && (
        <div className={cn("relative rounded-lg overflow-hidden border", borderActive)}>
          <img
            src={image.url}
            alt={`${label} reference`}
            className="w-full h-24 object-contain bg-muted/30"
            draggable={false}
          />
          <button
            type="button"
            onClick={() => onImageChange(undefined)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label={`Remove ${label.toLowerCase()} reference`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <FileUpload onFilesAdded={handleUpload} accept="image/*">
        <FileUploadTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs transition-colors border border-dashed border-border">
            <ImagePlus className="size-3.5" aria-hidden="true" />
            Upload
          </button>
        </FileUploadTrigger>
      </FileUpload>

      {/* Pick from generated images */}
      {completedGens.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Generated Images
          </div>
          <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto">
            {completedGens.slice(0, 20).map((gen) => (
              <button
                key={gen.id}
                type="button"
                onClick={() => onImageChange({ url: gen.url })}
                className={cn(
                  "aspect-square rounded-md overflow-hidden border transition-all focus-visible:ring-2 focus-visible:ring-ring",
                  image?.url === gen.url
                    ? `ring-1 ${ringColor}`
                    : `border-border hover:ring-1 ${ringHover}`
                )}
                title={gen.prompt?.slice(0, 40)}
              >
                <img
                  src={gen.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Pick from saved references */}
      {savedReferences.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Your Library
          </div>
          <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto">
            {savedReferences.map((ref) => (
              <button
                key={ref.id}
                type="button"
                onClick={() =>
                  onImageChange({ url: ref.url, storagePath: ref.storage_path })
                }
                className={cn(
                  "aspect-square rounded-md overflow-hidden border transition-all focus-visible:ring-2 focus-visible:ring-ring",
                  image?.storagePath === ref.storage_path
                    ? `ring-1 ${ringColor}`
                    : `border-border hover:ring-1 ${ringHover}`
                )}
                title={ref.name || "Reference"}
              >
                <Image
                  src={ref.url}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Optional children (e.g. TagChipsInput) */}
      {children}
    </div>
  );
}
