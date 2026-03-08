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
  icon: LucideIcon;
  image?: ReferenceImageInfo;
  onImageChange: (ref: ReferenceImageInfo | undefined) => void;
  completedGens: GeneratedImage[];
  savedReferences: SavedReferenceImage[];
  children?: React.ReactNode;
}

export function ReferenceSection({
  label,
  description,
  icon: Icon,
  image,
  onImageChange,
  completedGens,
  savedReferences,
  children,
}: ReferenceSectionProps) {

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
      <p className="text-[10px] text-[var(--steel-dim)] leading-snug uppercase tracking-[0.05em]">{description}</p>

      {/* Current image preview */}
      {image?.url && (
        <div className="relative overflow-hidden border border-[var(--wire-cyan)]">
          <img
            src={image.url}
            alt={`${label} reference`}
            className="w-full h-24 object-contain bg-[var(--void-panel)]"
            draggable={false}
          />
          <button
            type="button"
            onClick={() => onImageChange(undefined)}
            className="absolute top-1 right-1 p-0.5 bg-[var(--void)] border border-[var(--alert-red-dim)] text-[var(--alert-red)] hover:bg-[var(--alert-red)] hover:text-[var(--void)] transition-colors"
            aria-label={`Remove ${label.toLowerCase()} reference`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <FileUpload onFilesAdded={handleUpload} accept="image/*">
        <FileUploadTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--void)] hover:bg-[var(--nerv-orange)]/10 text-xs transition-all duration-100 border border-dashed border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange-dim)] hover:text-[var(--nerv-orange)] uppercase tracking-[0.08em] active:scale-[0.98]">
            <ImagePlus className="size-3.5" aria-hidden="true" />
            UPLOAD
          </button>
        </FileUploadTrigger>
      </FileUpload>

      {/* Pick from generated images */}
      {completedGens.length > 0 && (
        <>
          <div className="text-[10px] text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em]">
            GENERATED IMAGES
          </div>
          <div className="grid grid-cols-5 gap-0.5 max-h-28 overflow-y-auto">
            {completedGens.slice(0, 20).map((gen) => (
              <button
                key={gen.id}
                type="button"
                onClick={() => onImageChange({ url: gen.url })}
                className={cn(
                  "aspect-square overflow-hidden border transition-all duration-100 focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]",
                  image?.url === gen.url
                    ? "ring-1 ring-[var(--wire-cyan)] border-[var(--wire-cyan)]"
                    : "border-[var(--steel-faint)] hover:border-[var(--nerv-orange-dim)]"
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
          <div className="text-[10px] text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em]">
            YOUR LIBRARY
          </div>
          <div className="grid grid-cols-5 gap-0.5 max-h-28 overflow-y-auto">
            {savedReferences.map((ref) => (
              <button
                key={ref.id}
                type="button"
                onClick={() =>
                  onImageChange({ url: ref.url, storagePath: ref.storage_path })
                }
                className={cn(
                  "aspect-square overflow-hidden border transition-all duration-100 focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]",
                  image?.storagePath === ref.storage_path
                    ? "ring-1 ring-[var(--wire-cyan)] border-[var(--wire-cyan)]"
                    : "border-[var(--steel-faint)] hover:border-[var(--nerv-orange-dim)]"
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
