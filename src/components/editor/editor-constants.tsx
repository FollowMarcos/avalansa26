import type {
  AspectRatio,
  ImageSize,
  TaggedReference,
} from "@/components/create/create-context";
import { cn } from "@/lib/utils";

// ── Aspect ratio options ────────────────────────────────────────────────

export const baseAspectRatioOptions: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "Standard" },
  { value: "3:4", label: "Portrait" },
  { value: "16:9", label: "Wide" },
  { value: "9:16", label: "Tall" },
  { value: "3:2", label: "Photo" },
  { value: "2:3", label: "Portrait" },
  { value: "4:5", label: "Social" },
  { value: "21:9", label: "Ultra" },
];

// ── Image size / quality options ────────────────────────────────────────

export const baseImageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

// ── Preset tags ─────────────────────────────────────────────────────────

export const EXPRESSION_PRESETS = [
  "Happy", "Sad", "Surprised", "Confident", "Serious",
  "Playful", "Angry", "Peaceful", "Mysterious", "Excited",
];

export const CLOTHING_PRESETS = [
  "Formal suit", "Casual wear", "Streetwear", "Vintage", "Athletic",
  "Business casual", "Evening gown", "Military", "Futuristic", "Traditional",
];

export const LOCATION_PRESETS = [
  "Beach", "City street", "Forest", "Studio", "Mountain",
  "Office", "Café", "Desert", "Space", "Underwater",
];

// ── Helper to update a tagged reference ─────────────────────────────────

export function makeTaggedRef(
  current: TaggedReference | undefined,
  patch: Partial<TaggedReference>
): TaggedReference | undefined {
  const result: TaggedReference = {
    image: "image" in patch ? patch.image : current?.image,
    tags: "tags" in patch ? (patch.tags ?? []) : current?.tags || [],
    customText: "customText" in patch ? (patch.customText ?? "") : current?.customText || "",
  };
  // If everything is cleared, return undefined to fully remove the ref
  if (!result.image && result.tags.length === 0 && !result.customText) {
    return undefined;
  }
  return result;
}

// ── Visual aspect ratio shape ───────────────────────────────────────────

export function AspectRatioShape({
  ratio,
  className,
  maxSize = 14,
}: {
  ratio: AspectRatio;
  className?: string;
  maxSize?: number;
}) {
  const [w, h] = ratio.split(":").map(Number);
  const width = w > h ? maxSize : Math.round((w / h) * maxSize);
  const height = h > w ? maxSize : Math.round((h / w) * maxSize);
  return (
    <div
      className={cn("border-2 border-current", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
