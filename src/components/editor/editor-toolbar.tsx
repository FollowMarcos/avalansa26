"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useCreate,
  type GeneratedImage,
} from "@/components/create/create-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Palette,
  PersonStanding,
  Smile,
  Shirt,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { ReferenceSection } from "./reference-section";
import { TagChipsInput } from "./tag-chips-input";
import {
  makeTaggedRef,
  EXPRESSION_PRESETS,
  CLOTHING_PRESETS,
  LOCATION_PRESETS,
} from "./editor-constants";

// ── Toolbar item config ─────────────────────────────────────────────────

interface ToolbarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: "style", icon: Palette, label: "Style Reference", shortLabel: "STY" },
  { id: "pose", icon: PersonStanding, label: "Pose Reference", shortLabel: "POS" },
  { id: "expression", icon: Smile, label: "Expression Reference", shortLabel: "EXP" },
  { id: "clothing", icon: Shirt, label: "Clothing Reference", shortLabel: "CLO" },
  { id: "location", icon: MapPin, label: "Location Reference", shortLabel: "LOC" },
];

// ── Component ───────────────────────────────────────────────────────────

export function EditorToolbar() {
  const {
    settings,
    updateSettings,
    history,
    savedReferences,
  } = useCreate();

  const [openPopover, setOpenPopover] = React.useState<string | null>(null);

  const completedGens = React.useMemo(
    () => history.filter((g: GeneratedImage) => g.status === "completed" && g.url).slice(0, 40),
    [history]
  );

  const isActive = (id: string): boolean => {
    switch (id) {
      case "style":
        return !!settings.styleRef?.url;
      case "pose":
        return !!settings.poseRef?.url;
      case "expression":
        return !!(settings.expressionRef?.image?.url || (settings.expressionRef?.tags?.length ?? 0) > 0);
      case "clothing":
        return !!(settings.clothingRef?.image?.url || (settings.clothingRef?.tags?.length ?? 0) > 0);
      case "location":
        return !!(settings.locationRef?.image?.url || (settings.locationRef?.tags?.length ?? 0) > 0);
      default:
        return false;
    }
  };

  const renderContent = (id: string) => {
    switch (id) {
      case "style":
        return (
          <ReferenceSection
            label="Style"
            description="Pick an image to use only its art style (color palette, brushwork, technique)."
            icon={Palette}
            image={settings.styleRef}
            onImageChange={(ref) => updateSettings({ styleRef: ref })}
            completedGens={completedGens}
            savedReferences={savedReferences}
          />
        );
      case "pose":
        return (
          <ReferenceSection
            label="Pose"
            description="Pick an image to match only its body pose and position."
            icon={PersonStanding}
            image={settings.poseRef}
            onImageChange={(ref) => updateSettings({ poseRef: ref })}
            completedGens={completedGens}
            savedReferences={savedReferences}
          />
        );
      case "expression":
        return (
          <ReferenceSection
            label="Expression"
            description="Set a facial expression via image and/or descriptive tags."
            icon={Smile}
            image={settings.expressionRef?.image}
            onImageChange={(ref) =>
              updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { image: ref }) })
            }
            completedGens={completedGens}
            savedReferences={savedReferences}
          >
            <TagChipsInput
              tags={settings.expressionRef?.tags || []}
              onTagsChange={(tags) =>
                updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { tags }) })
              }
              presetTags={EXPRESSION_PRESETS}
              customText={settings.expressionRef?.customText || ""}
              onCustomTextChange={(customText) =>
                updateSettings({ expressionRef: makeTaggedRef(settings.expressionRef, { customText }) })
              }
              placeholder="Add expression..."
            />
          </ReferenceSection>
        );
      case "clothing":
        return (
          <ReferenceSection
            label="Clothing"
            description="Set clothing style via image and/or descriptive tags."
            icon={Shirt}
            image={settings.clothingRef?.image}
            onImageChange={(ref) =>
              updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { image: ref }) })
            }
            completedGens={completedGens}
            savedReferences={savedReferences}
          >
            <TagChipsInput
              tags={settings.clothingRef?.tags || []}
              onTagsChange={(tags) =>
                updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { tags }) })
              }
              presetTags={CLOTHING_PRESETS}
              customText={settings.clothingRef?.customText || ""}
              onCustomTextChange={(customText) =>
                updateSettings({ clothingRef: makeTaggedRef(settings.clothingRef, { customText }) })
              }
              placeholder="Add clothing..."
            />
          </ReferenceSection>
        );
      case "location":
        return (
          <ReferenceSection
            label="Location"
            description="Set background/location via image and/or descriptive tags."
            icon={MapPin}
            image={settings.locationRef?.image}
            onImageChange={(ref) =>
              updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { image: ref }) })
            }
            completedGens={completedGens}
            savedReferences={savedReferences}
          >
            <TagChipsInput
              tags={settings.locationRef?.tags || []}
              onTagsChange={(tags) =>
                updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { tags }) })
              }
              presetTags={LOCATION_PRESETS}
              customText={settings.locationRef?.customText || ""}
              onCustomTextChange={(customText) =>
                updateSettings({ locationRef: makeTaggedRef(settings.locationRef, { customText }) })
              }
              placeholder="Add location..."
            />
          </ReferenceSection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center py-2 gap-0.5">
      {/* Institutional label */}
      <span className="text-[8px] tracking-[0.15em] uppercase text-[var(--steel-dim)] mb-1 font-[family-name:var(--font-noto-sans-jp)]">
        参照制御
      </span>

      {TOOLBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.id);

        return (
          <Popover
            key={item.id}
            open={openPopover === item.id}
            onOpenChange={(open) => setOpenPopover(open ? item.id : null)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "relative size-9 flex items-center justify-center transition-all duration-100",
                      "border border-transparent",
                      "hover:bg-[var(--nerv-orange)]/10 hover:border-[var(--steel-faint)]",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--nerv-orange)]",
                      active && "bg-[var(--nerv-orange)]/10 border-[var(--nerv-orange-dim)]/40"
                    )}
                    aria-label={item.label}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        active ? "text-[var(--nerv-orange)]" : "text-[var(--nerv-orange-dim)]"
                      )}
                    />
                    {active && (
                      <span
                        className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-[var(--data-green)]"
                        style={{ boxShadow: "0 0 6px var(--data-green)" }}
                      />
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] bg-[var(--void-panel)] border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)]">
                {item.label}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={12}
              className="w-72 p-3 max-h-[60vh] overflow-y-auto scrollbar-thin rounded-none bg-[var(--void)] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="size-3.5 text-[var(--nerv-orange-dim)]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--nerv-orange)]">{item.label}</span>
              </div>
              {renderContent(item.id)}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
