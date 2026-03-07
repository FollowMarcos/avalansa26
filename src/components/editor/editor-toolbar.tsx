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
  dotColor: string;
  activeRing: string;
  iconColor: string;
  accentColor: "violet" | "blue" | "amber" | "emerald" | "cyan";
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    id: "style",
    icon: Palette,
    label: "Art Style Reference",
    dotColor: "bg-violet-500",
    activeRing: "ring-1 ring-violet-500/30 bg-violet-500/10",
    iconColor: "text-violet-500",
    accentColor: "violet",
  },
  {
    id: "pose",
    icon: PersonStanding,
    label: "Pose Reference",
    dotColor: "bg-blue-500",
    activeRing: "ring-1 ring-blue-500/30 bg-blue-500/10",
    iconColor: "text-blue-500",
    accentColor: "blue",
  },
  {
    id: "expression",
    icon: Smile,
    label: "Expression",
    dotColor: "bg-amber-500",
    activeRing: "ring-1 ring-amber-500/30 bg-amber-500/10",
    iconColor: "text-amber-500",
    accentColor: "amber",
  },
  {
    id: "clothing",
    icon: Shirt,
    label: "Clothing",
    dotColor: "bg-emerald-500",
    activeRing: "ring-1 ring-emerald-500/30 bg-emerald-500/10",
    iconColor: "text-emerald-500",
    accentColor: "emerald",
  },
  {
    id: "location",
    icon: MapPin,
    label: "Location",
    dotColor: "bg-cyan-500",
    activeRing: "ring-1 ring-cyan-500/30 bg-cyan-500/10",
    iconColor: "text-cyan-500",
    accentColor: "cyan",
  },
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
            accentColor="violet"
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
            accentColor="blue"
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
            accentColor="amber"
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
              accentColor="amber"
              placeholder="Add expression..."
            />
          </ReferenceSection>
        );
      case "clothing":
        return (
          <ReferenceSection
            label="Clothing"
            description="Set clothing style via image and/or descriptive tags."
            accentColor="emerald"
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
              accentColor="emerald"
              placeholder="Add clothing..."
            />
          </ReferenceSection>
        );
      case "location":
        return (
          <ReferenceSection
            label="Location"
            description="Set background/location via image and/or descriptive tags."
            accentColor="cyan"
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
              accentColor="cyan"
              placeholder="Add location..."
            />
          </ReferenceSection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center py-3 gap-1.5">
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
                      "relative size-10 rounded-xl flex items-center justify-center transition-all duration-150",
                      "hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active && item.activeRing
                    )}
                    aria-label={item.label}
                  >
                    <Icon
                      className={cn(
                        "size-[18px]",
                        active ? item.iconColor : "text-muted-foreground"
                      )}
                    />
                    {active && (
                      <span
                        className={cn(
                          "absolute top-1 right-1 size-2 rounded-full animate-pulse",
                          item.dotColor
                        )}
                      />
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-72 p-3 max-h-[60vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={cn("size-3.5", item.iconColor)} />
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
              {renderContent(item.id)}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
