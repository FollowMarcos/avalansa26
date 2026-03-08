"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  ArrowLeftRight,
  GripVertical,
  Upload,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GeneratedImage } from "./create-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompareImage {
  url: string;
  prompt?: string;
  timestamp?: number;
  settings?: GeneratedImage["settings"];
  isUpload?: boolean;
}

interface ImageCompareModalProps {
  /** Pre-selected pair from gallery context menu flow */
  images: [GeneratedImage, GeneratedImage] | null;
  isOpen: boolean;
  onClose: () => void;
  /** Full history for image picker */
  history: GeneratedImage[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageCompareModal({
  images,
  isOpen,
  onClose,
  history,
}: ImageCompareModalProps) {
  const [beforeImage, setBeforeImage] = React.useState<CompareImage | null>(null);
  const [afterImage, setAfterImage] = React.useState<CompareImage | null>(null);
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const completedImages = React.useMemo(
    () => history.filter((g) => g.status === "completed" && g.url).slice(0, 60),
    [history],
  );

  // Sync pre-selected pair when modal opens
  React.useEffect(() => {
    if (images && isOpen) {
      setBeforeImage(images[0]);
      setAfterImage(images[1]);
      setSliderPosition(50);
    }
  }, [images, isOpen]);

  // Reset state when modal closes
  const handleClose = () => {
    onClose();
    setBeforeImage(null);
    setAfterImage(null);
    setSliderPosition(50);
  };

  // Swap before/after
  const handleSwap = () => {
    setBeforeImage(afterImage);
    setAfterImage(beforeImage);
  };

  // Upload handler
  const handleUpload = (side: "before" | "after") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const uploaded: CompareImage = {
          url,
          prompt: file.name,
          isUpload: true,
        };
        if (side === "before") setBeforeImage(uploaded);
        else setAfterImage(uploaded);
      }
    };
    input.click();
  };

  // Slider drag logic
  const updateSlider = React.useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      updateSlider(e.clientX);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, updateSlider]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const hasImages = beforeImage?.url && afterImage?.url;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-none bg-[var(--void)] border border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)] font-[family-name:var(--font-ibm-plex-mono)] [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Image Comparison</DialogTitle>

        {/* NERV institutional header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--nerv-orange-dim)]/20 shrink-0 select-none">
          <span className="text-base tracking-[0.15em] text-[var(--nerv-orange)] font-[family-name:var(--font-bebas-neue)] glow-orange">
            IMAGE COMPARISON
          </span>
          <span className="text-[8px] tracking-[0.1em] text-[var(--steel-dim)] font-[family-name:var(--font-noto-sans-jp)]">
            画像比較
          </span>
          <div className="flex-1 h-px bg-[var(--nerv-orange-dim)]/20" />

          {hasImages && (
            <button
              onClick={handleSwap}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[10px] uppercase tracking-[0.08em] text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10 transition-colors"
            >
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
              SWAP
            </button>
          )}

          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10 transition-colors"
            aria-label="Close comparison"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {hasImages ? (
            <>
              {/* Slider viewport */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div
                  ref={containerRef}
                  className="relative w-full h-full overflow-hidden border border-[var(--steel-faint)] select-none"
                  style={{ cursor: isDragging ? "col-resize" : undefined }}
                >
                  {/* Before image (full layer) */}
                  <Image
                    src={beforeImage.url}
                    alt={beforeImage.prompt || "Before image"}
                    fill
                    className="object-contain"
                    quality={90}
                    unoptimized={beforeImage.isUpload}
                  />

                  {/* After image (clipped from left) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                  >
                    <Image
                      src={afterImage.url}
                      alt={afterImage.prompt || "After image"}
                      fill
                      className="object-contain"
                      quality={90}
                      unoptimized={afterImage.isUpload}
                    />
                  </div>

                  {/* Divider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[var(--nerv-orange)] pointer-events-none z-10"
                    style={{
                      left: `${sliderPosition}%`,
                      transform: "translateX(-50%)",
                      boxShadow: "0 0 8px rgba(255, 152, 48, 0.4)",
                    }}
                  />

                  {/* Drag handle */}
                  <div
                    onPointerDown={handlePointerDown}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                        e.preventDefault();
                        setSliderPosition((prev) => Math.max(2, prev - 2));
                      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                        e.preventDefault();
                        setSliderPosition((prev) => Math.min(98, prev + 2));
                      } else if (e.key === "Home") {
                        e.preventDefault();
                        setSliderPosition(2);
                      } else if (e.key === "End") {
                        e.preventDefault();
                        setSliderPosition(98);
                      }
                    }}
                    className="absolute top-1/2 size-8 bg-[var(--void)] border border-[var(--nerv-orange)] flex items-center justify-center cursor-col-resize z-20 hover:bg-[var(--nerv-orange)]/20 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] outline-none"
                    style={{
                      left: `${sliderPosition}%`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 12px rgba(0, 0, 0, 0.8)",
                    }}
                    role="slider"
                    aria-label="Comparison slider"
                    aria-valuenow={Math.round(sliderPosition)}
                    aria-valuemin={2}
                    aria-valuemax={98}
                    tabIndex={0}
                  >
                    <GripVertical className="size-4 text-[var(--nerv-orange)]" aria-hidden="true" />
                  </div>

                  {/* Labels */}
                  <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-[0.1em] text-[var(--nerv-orange)] bg-[var(--void)]/80 px-2 py-0.5 pointer-events-none z-10 font-[family-name:var(--font-ibm-plex-mono)]">
                    BEFORE
                  </span>
                  <span className="absolute bottom-2 right-2 text-[9px] uppercase tracking-[0.1em] text-[var(--data-green)] bg-[var(--void)]/80 px-2 py-0.5 pointer-events-none z-10 font-[family-name:var(--font-ibm-plex-mono)]">
                    AFTER
                  </span>

                  {/* Position readout */}
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] tabular-nums text-[var(--steel-dim)] bg-[var(--void)]/80 px-1.5 py-0.5 pointer-events-none z-10">
                    {Math.round(sliderPosition)}%
                  </span>
                </div>
              </div>

              {/* Bottom bar: pickers + prompt info */}
              <div className="shrink-0 border-t border-[var(--nerv-orange-dim)]/20 px-4 py-2.5">
                <div className="flex gap-4">
                  {/* Before info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--nerv-orange)]">BEFORE</span>
                      <ImagePicker
                        label="Change"
                        images={completedImages}
                        onSelect={(img) => setBeforeImage(img)}
                        onUpload={() => handleUpload("before")}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--steel-dim)] truncate">
                      {beforeImage.prompt || "No prompt"}
                    </p>
                  </div>

                  <div className="w-px bg-[var(--steel-faint)] shrink-0" />

                  {/* After info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--data-green)]">AFTER</span>
                      <ImagePicker
                        label="Change"
                        images={completedImages}
                        onSelect={(img) => setAfterImage(img)}
                        onUpload={() => handleUpload("after")}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--steel-dim)] truncate">
                      {afterImage.prompt || "No prompt"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — pick images */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--nerv-orange)]">
                    SELECT IMAGES TO COMPARE
                  </span>
                  <p className="text-[9px] text-[var(--steel-dim)] uppercase tracking-[0.06em]">
                    Pick from your generations or upload external images
                  </p>
                </div>

                <div className="flex gap-6 justify-center">
                  {/* Before slot */}
                  <ImageSlot
                    label="BEFORE"
                    labelColor="text-[var(--nerv-orange)]"
                    image={beforeImage}
                    completedImages={completedImages}
                    onSelect={(img) => setBeforeImage(img)}
                    onUpload={() => handleUpload("before")}
                    onClear={() => setBeforeImage(null)}
                  />

                  {/* Divider */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-px h-16 bg-[var(--steel-faint)]" />
                    <span className="text-[8px] text-[var(--steel-dim)] uppercase tracking-[0.1em]">VS</span>
                    <div className="w-px h-16 bg-[var(--steel-faint)]" />
                  </div>

                  {/* After slot */}
                  <ImageSlot
                    label="AFTER"
                    labelColor="text-[var(--data-green)]"
                    image={afterImage}
                    completedImages={completedImages}
                    onSelect={(img) => setAfterImage(img)}
                    onUpload={() => handleUpload("after")}
                    onClear={() => setAfterImage(null)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Image Slot (empty state picker)
// ---------------------------------------------------------------------------

function ImageSlot({
  label,
  labelColor,
  image,
  completedImages,
  onSelect,
  onUpload,
  onClear,
}: {
  label: string;
  labelColor: string;
  image: CompareImage | null;
  completedImages: GeneratedImage[];
  onSelect: (img: CompareImage) => void;
  onUpload: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={cn("text-[9px] uppercase tracking-[0.12em]", labelColor)}>
        {label}
      </span>

      {image ? (
        <div className="relative group">
          <div className="size-32 border border-[var(--steel-faint)] overflow-hidden">
            <Image
              src={image.url}
              alt={image.prompt || label}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized={image.isUpload}
            />
          </div>
          <button
            onClick={onClear}
            className="absolute -top-1.5 -right-1.5 size-5 bg-[var(--void)] border border-[var(--steel-faint)] flex items-center justify-center text-[var(--steel-dim)] hover:text-[var(--alert-red)] hover:border-[var(--alert-red)] transition-colors opacity-0 group-hover:opacity-100"
            aria-label={`Remove ${label.toLowerCase()} image`}
          >
            <X className="size-3" />
          </button>
          <p className="text-[8px] text-[var(--steel-dim)] truncate max-w-[128px] mt-1 text-center">
            {image.prompt || "Uploaded"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <ImagePicker
            label="Pick from gallery"
            images={completedImages}
            onSelect={onSelect}
            onUpload={onUpload}
            variant="slot"
          />
          <button
            onClick={onUpload}
            className="flex items-center justify-center gap-1.5 h-8 w-36 border border-dashed border-[var(--steel-faint)] text-[9px] uppercase tracking-[0.06em] text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:border-[var(--nerv-orange-dim)]/40 transition-colors"
          >
            <Upload className="size-3" aria-hidden="true" />
            Upload image
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Picker Popover
// ---------------------------------------------------------------------------

function ImagePicker({
  label,
  images,
  onSelect,
  onUpload,
  variant = "inline",
}: {
  label: string;
  images: GeneratedImage[];
  onSelect: (img: CompareImage) => void;
  onUpload: () => void;
  variant?: "inline" | "slot";
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (img: GeneratedImage) => {
    onSelect({
      url: img.url,
      prompt: img.prompt,
      timestamp: img.timestamp,
      settings: img.settings,
    });
    setOpen(false);
  };

  if (variant === "slot") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center gap-1.5 h-8 w-36 border border-[var(--steel-faint)] text-[9px] uppercase tracking-[0.06em] text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:border-[var(--nerv-orange-dim)]/40 transition-colors">
            <ImageIcon className="size-3" aria-hidden="true" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="bottom"
          className="w-72 p-0 rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]"
        >
          <PickerGrid images={images} onSelect={handleSelect} onUpload={onUpload} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-[8px] uppercase tracking-[0.06em] text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] transition-colors">
          <ChevronDown className="size-2.5" aria-hidden="true" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-72 p-0 rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]"
      >
        <PickerGrid images={images} onSelect={handleSelect} onUpload={onUpload} />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Picker Grid (shared thumbnail grid)
// ---------------------------------------------------------------------------

function PickerGrid({
  images,
  onSelect,
  onUpload,
}: {
  images: GeneratedImage[];
  onSelect: (img: GeneratedImage) => void;
  onUpload: () => void;
}) {
  return (
    <div className="p-2 space-y-2 font-[family-name:var(--font-ibm-plex-mono)]">
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--nerv-orange)]">
          SELECT IMAGE
        </span>
        <button
          onClick={onUpload}
          className="flex items-center gap-1 text-[8px] uppercase tracking-[0.06em] text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] transition-colors"
        >
          <Upload className="size-2.5" aria-hidden="true" />
          Upload
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(img)}
              className="aspect-square overflow-hidden border border-[var(--steel-faint)] hover:border-[var(--nerv-orange)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]"
              title={img.prompt?.slice(0, 60)}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-[9px] text-[var(--steel-dim)] uppercase">
          No generated images yet
        </div>
      )}
    </div>
  );
}
