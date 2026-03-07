"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useCreate,
  type AspectRatio,
  type ImageSize,
  type TaggedReference,
  type ReferenceImageInfo,
} from "@/components/create/create-context";
import { ApiSelector } from "@/components/create/api-selector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReferenceSection } from "./reference-section";
import { TagChipsInput } from "./tag-chips-input";
import {
  Palette,
  PersonStanding,
  Smile,
  Shirt,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";

// ── Aspect ratio / image size data ──────────────────────────────────────

const baseAspectRatioOptions: { value: AspectRatio; label: string }[] = [
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

const baseImageSizeOptions: { value: ImageSize; label: string; desc: string }[] = [
  { value: "1K", label: "1K", desc: "Fast" },
  { value: "2K", label: "2K", desc: "Balanced" },
  { value: "4K", label: "4K", desc: "Detailed" },
];

// ── Visual aspect ratio shape ───────────────────────────────────────────

function AspectRatioShape({ ratio, className }: { ratio: AspectRatio; className?: string }) {
  const [w, h] = ratio.split(":").map(Number);
  const maxSize = 16;
  const width = w > h ? maxSize : Math.round((w / h) * maxSize);
  const height = h > w ? maxSize : Math.round((h / w) * maxSize);
  return (
    <div
      className={cn("border-2 border-current rounded-sm", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

// ── Preset tags ─────────────────────────────────────────────────────────

const EXPRESSION_PRESETS = [
  "Happy", "Sad", "Surprised", "Confident", "Serious",
  "Playful", "Angry", "Peaceful", "Mysterious", "Excited",
];

const CLOTHING_PRESETS = [
  "Formal suit", "Casual wear", "Streetwear", "Vintage", "Athletic",
  "Business casual", "Evening gown", "Military", "Futuristic", "Traditional",
];

const LOCATION_PRESETS = [
  "Beach", "City street", "Forest", "Studio", "Mountain",
  "Office", "Café", "Desert", "Space", "Underwater",
];

// ── Helper to update a tagged reference ─────────────────────────────────

function makeTaggedRef(
  current: TaggedReference | undefined,
  patch: Partial<TaggedReference>
): TaggedReference {
  return {
    image: patch.image !== undefined ? patch.image : current?.image,
    tags: patch.tags !== undefined ? patch.tags : current?.tags || [],
    customText: patch.customText !== undefined ? patch.customText : current?.customText || "",
  };
}

// ── Component ───────────────────────────────────────────────────────────

export function EditorSettingsPanel() {
  const {
    settings,
    updateSettings,
    availableApis,
    selectedApiId,
    setSelectedApiId,
    isLoadingApis,
    history,
    savedReferences,
    allowedAspectRatios,
    allowedImageSizes,
    maxOutputCount,
  } = useCreate();

  const completedGens = React.useMemo(
    () => history.filter((g) => g.status === "completed" && g.url).slice(0, 40),
    [history]
  );

  const filteredAspectRatios = React.useMemo(
    () => baseAspectRatioOptions.filter((o) => allowedAspectRatios.includes(o.value)),
    [allowedAspectRatios]
  );

  const filteredImageSizes = React.useMemo(
    () => baseImageSizeOptions.filter((o) => allowedImageSizes.includes(o.value)),
    [allowedImageSizes]
  );

  return (
    <div className="h-full overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
      <Accordion
        type="multiple"
        defaultValue={[
          "model",
          "aspect-ratio",
          "quality",
          "output-count",
          "style-ref",
          "pose-ref",
          "expression-ref",
          "clothing-ref",
          "location-ref",
        ]}
        className="space-y-0"
      >
        {/* ── Model & API ───────────────────────────── */}
        <AccordionItem value="model" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            Model & API
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ApiSelector
              apis={availableApis}
              selectedApiId={selectedApiId}
              onSelect={setSelectedApiId}
              disabled={isLoadingApis}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── Aspect Ratio ──────────────────────────── */}
        <AccordionItem value="aspect-ratio" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            Aspect Ratio
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div role="listbox" aria-label="Aspect ratio" className="grid grid-cols-3 gap-1">
              {filteredAspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  role="option"
                  aria-selected={settings.aspectRatio === ratio.value}
                  onClick={() => updateSettings({ aspectRatio: ratio.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-150",
                    settings.aspectRatio === ratio.value
                      ? "bg-primary/10 ring-1 ring-primary shadow-sm"
                      : "hover:bg-muted hover:scale-105 active:scale-95"
                  )}
                >
                  <AspectRatioShape
                    ratio={ratio.value}
                    className={settings.aspectRatio === ratio.value ? "text-primary" : "text-muted-foreground"}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      settings.aspectRatio === ratio.value ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {ratio.value}
                  </span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Image Quality ─────────────────────────── */}
        <AccordionItem value="quality" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            Image Quality
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div role="radiogroup" aria-label="Image quality" className="flex gap-1">
              {filteredImageSizes.map((size) => (
                <button
                  key={size.value}
                  role="radio"
                  aria-checked={settings.imageSize === size.value}
                  onClick={() => updateSettings({ imageSize: size.value })}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 rounded-lg text-xs transition-all duration-150",
                    settings.imageSize === size.value
                      ? "bg-primary/10 ring-1 ring-primary text-primary font-medium shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:scale-[1.03] active:scale-95"
                  )}
                >
                  <span className="font-mono">{size.label}</span>
                  <span className="text-[10px] opacity-70">{size.desc}</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Output Count ──────────────────────────── */}
        <AccordionItem value="output-count" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            Output Count
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateSettings({ outputCount: Math.max(1, settings.outputCount - 1) })}
                disabled={settings.outputCount <= 1}
                className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Decrease output count"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="text-sm font-medium tabular-nums w-6 text-center">
                {settings.outputCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ outputCount: Math.min(maxOutputCount, settings.outputCount + 1) })
                }
                disabled={settings.outputCount >= maxOutputCount}
                className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Increase output count"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Art Style Reference ───────────────────── */}
        <AccordionItem value="style-ref" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Palette className="size-3.5 text-violet-500" />
              Art Style Reference
              {settings.styleRef?.url && (
                <span className="size-2.5 rounded-full bg-violet-500 animate-pulse" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ReferenceSection
              label="Style"
              description="Pick an image to use only its art style (color palette, brushwork, technique)."
              accentColor="violet"
              icon={Palette}
              image={settings.styleRef}
              onImageChange={(ref) => updateSettings({ styleRef: ref })}
              completedGens={completedGens}
              savedReferences={savedReferences}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── Pose Reference ────────────────────────── */}
        <AccordionItem value="pose-ref" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-1.5">
              <PersonStanding className="size-3.5 text-blue-500" />
              Pose Reference
              {settings.poseRef?.url && (
                <span className="size-2.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ReferenceSection
              label="Pose"
              description="Pick an image to match only its body pose and position."
              accentColor="blue"
              icon={PersonStanding}
              image={settings.poseRef}
              onImageChange={(ref) => updateSettings({ poseRef: ref })}
              completedGens={completedGens}
              savedReferences={savedReferences}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── Expression Reference ──────────────────── */}
        <AccordionItem value="expression-ref" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Smile className="size-3.5 text-amber-500" />
              Expression
              {(settings.expressionRef?.image?.url || (settings.expressionRef?.tags?.length ?? 0) > 0) && (
                <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ReferenceSection
              label="Expression"
              description="Set a facial expression via image and/or descriptive tags."
              accentColor="amber"
              icon={Smile}
              image={settings.expressionRef?.image}
              onImageChange={(ref) =>
                updateSettings({
                  expressionRef: makeTaggedRef(settings.expressionRef, { image: ref }),
                })
              }
              completedGens={completedGens}
              savedReferences={savedReferences}
            >
              <TagChipsInput
                tags={settings.expressionRef?.tags || []}
                onTagsChange={(tags) =>
                  updateSettings({
                    expressionRef: makeTaggedRef(settings.expressionRef, { tags }),
                  })
                }
                presetTags={EXPRESSION_PRESETS}
                customText={settings.expressionRef?.customText || ""}
                onCustomTextChange={(customText) =>
                  updateSettings({
                    expressionRef: makeTaggedRef(settings.expressionRef, { customText }),
                  })
                }
                accentColor="amber"
                placeholder="Add expression..."
              />
            </ReferenceSection>
          </AccordionContent>
        </AccordionItem>

        {/* ── Clothing Reference ────────────────────── */}
        <AccordionItem value="clothing-ref" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Shirt className="size-3.5 text-emerald-500" />
              Clothing
              {(settings.clothingRef?.image?.url || (settings.clothingRef?.tags?.length ?? 0) > 0) && (
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ReferenceSection
              label="Clothing"
              description="Set clothing style via image and/or descriptive tags."
              accentColor="emerald"
              icon={Shirt}
              image={settings.clothingRef?.image}
              onImageChange={(ref) =>
                updateSettings({
                  clothingRef: makeTaggedRef(settings.clothingRef, { image: ref }),
                })
              }
              completedGens={completedGens}
              savedReferences={savedReferences}
            >
              <TagChipsInput
                tags={settings.clothingRef?.tags || []}
                onTagsChange={(tags) =>
                  updateSettings({
                    clothingRef: makeTaggedRef(settings.clothingRef, { tags }),
                  })
                }
                presetTags={CLOTHING_PRESETS}
                customText={settings.clothingRef?.customText || ""}
                onCustomTextChange={(customText) =>
                  updateSettings({
                    clothingRef: makeTaggedRef(settings.clothingRef, { customText }),
                  })
                }
                accentColor="emerald"
                placeholder="Add clothing..."
              />
            </ReferenceSection>
          </AccordionContent>
        </AccordionItem>

        {/* ── Location Reference ────────────────────── */}
        <AccordionItem value="location-ref" className="border-b border-border/50">
          <AccordionTrigger className="py-2.5 text-xs font-semibold hover:no-underline">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-cyan-500" />
              Location
              {(settings.locationRef?.image?.url || (settings.locationRef?.tags?.length ?? 0) > 0) && (
                <span className="size-2.5 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ReferenceSection
              label="Location"
              description="Set background/location via image and/or descriptive tags."
              accentColor="cyan"
              icon={MapPin}
              image={settings.locationRef?.image}
              onImageChange={(ref) =>
                updateSettings({
                  locationRef: makeTaggedRef(settings.locationRef, { image: ref }),
                })
              }
              completedGens={completedGens}
              savedReferences={savedReferences}
            >
              <TagChipsInput
                tags={settings.locationRef?.tags || []}
                onTagsChange={(tags) =>
                  updateSettings({
                    locationRef: makeTaggedRef(settings.locationRef, { tags }),
                  })
                }
                presetTags={LOCATION_PRESETS}
                customText={settings.locationRef?.customText || ""}
                onCustomTextChange={(customText) =>
                  updateSettings({
                    locationRef: makeTaggedRef(settings.locationRef, { customText }),
                  })
                }
                accentColor="cyan"
                placeholder="Add location..."
              />
            </ReferenceSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
