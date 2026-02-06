"use client";

import * as React from "react";

// =============================================================================
// TYPES
// =============================================================================

type TemplateType = "turnaround" | "expression" | "outfit" | "action";
type ViewType = "front" | "side" | "back" | "three-quarter" | "top-down" | "dynamic" | "custom";
type NoteCategory = "anatomy" | "color" | "costume" | "lore";

interface ViewSlot {
  id: string;
  label: string;
  type: ViewType;
  status: "empty" | "generating" | "complete";
  imageColor: string;
  prompt?: string;
}

interface Outfit {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

interface Expression {
  id: string;
  name: string;
  emoji: string;
  imageColor: string;
  status: "empty" | "complete";
}

interface DesignNote {
  id: string;
  text: string;
  category: NoteCategory;
  createdAt: string;
}

interface CharacterProject {
  name: string;
  description: string;
  basePrompt: string;
  activeTemplate: TemplateType;
  views: ViewSlot[];
  outfits: Outfit[];
  expressions: Expression[];
  colorPalette: string[];
  designNotes: DesignNote[];
  activeViewId: string | null;
  activeNoteCategory: NoteCategory | "all";
  paletteLocked: boolean;
  settings: {
    aspectRatio: string;
    quality: "draft" | "final";
    style: string;
  };
}

interface CharContextValue extends CharacterProject {
  setActiveTemplate: (template: TemplateType) => void;
  setActiveView: (viewId: string | null) => void;
  setActiveNoteCategory: (category: NoteCategory | "all") => void;
  toggleOutfit: (outfitId: string) => void;
  togglePaletteLock: () => void;
  addNote: (text: string, category: NoteCategory) => void;
  setQuality: (quality: "draft" | "final") => void;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_VIEWS: ViewSlot[] = [
  { id: "v1", label: "Front", type: "front", status: "complete", imageColor: "#6366f1", prompt: "front view, standing pose, arms at sides" },
  { id: "v2", label: "Right Side", type: "side", status: "complete", imageColor: "#8b5cf6", prompt: "right side profile view, standing" },
  { id: "v3", label: "Back", type: "back", status: "complete", imageColor: "#a78bfa", prompt: "back view, showing hair and cloak details" },
  { id: "v4", label: "3/4 Front", type: "three-quarter", status: "complete", imageColor: "#c4b5fd", prompt: "three-quarter front view, slight turn" },
  { id: "v5", label: "Top-Down", type: "top-down", status: "empty", imageColor: "#e0e7ff" },
  { id: "v6", label: "Dynamic Pose", type: "dynamic", status: "empty", imageColor: "#e0e7ff" },
];

const MOCK_OUTFITS: Outfit[] = [
  { id: "o1", name: "Forest Armor", description: "Leather and living wood plate armor with moss accents", color: "#2d5016", isActive: true },
  { id: "o2", name: "Court Dress", description: "Elegant silver-threaded gown for diplomatic events", color: "#7c3aed", isActive: false },
  { id: "o3", name: "Travel Cloak", description: "Weathered hooded cloak with hidden pockets", color: "#92400e", isActive: false },
  { id: "o4", name: "Battle Gear", description: "Full combat armor with enchanted gauntlets", color: "#991b1b", isActive: false },
];

const MOCK_EXPRESSIONS: Expression[] = [
  { id: "e1", name: "Neutral", emoji: "\u{1F610}", imageColor: "#6366f1", status: "complete" },
  { id: "e2", name: "Determined", emoji: "\u{1F624}", imageColor: "#8b5cf6", status: "complete" },
  { id: "e3", name: "Amused", emoji: "\u{1F60F}", imageColor: "#a78bfa", status: "complete" },
  { id: "e4", name: "Furious", emoji: "\u{1F621}", imageColor: "#ef4444", status: "complete" },
  { id: "e5", name: "Sorrowful", emoji: "\u{1F622}", imageColor: "#e0e7ff", status: "empty" },
  { id: "e6", name: "Scheming", emoji: "\u{1F608}", imageColor: "#e0e7ff", status: "empty" },
];

const MOCK_PALETTE = ["#F5E6D3", "#E8D5C0", "#C0C0C8", "#F0F0F5", "#2D5016", "#1A3A0A", "#D4A574", "#F5C542"];

const MOCK_NOTES: DesignNote[] = [
  { id: "n1", text: "Height: 6'2\" (188cm). Lean athletic build, broader shoulders than typical elven frame. Long limbs, graceful proportions.", category: "anatomy", createdAt: "2026-02-06T08:00:00Z" },
  { id: "n2", text: "Skin tone stays warm (#F5E6D3) across all lighting. Hair reflects cool blue highlights in moonlight scenes.", category: "color", createdAt: "2026-02-06T08:15:00Z" },
  { id: "n3", text: "Forest armor uses living wood that shifts with seasons. Spring = green buds, winter = bare bark texture.", category: "costume", createdAt: "2026-02-06T09:00:00Z" },
  { id: "n4", text: "Born in the Shadowveil Forest. Last of the Nightwhisper bloodline. Carries ancestral bow 'Duskstring'.", category: "lore", createdAt: "2026-02-06T09:30:00Z" },
  { id: "n5", text: "Amber eyes glow faintly when using nature magic. Scar across left forearm from a wyvern encounter.", category: "anatomy", createdAt: "2026-02-06T10:00:00Z" },
];

const INITIAL_STATE: CharacterProject = {
  name: "Aria Nightwhisper",
  description: "Elven ranger from the Shadowveil Forest. Tall, athletic build with silver-white hair and amber eyes.",
  basePrompt: "tall elven female ranger, silver-white long hair, amber eyes, pointed ears, athletic build, fantasy character concept art",
  activeTemplate: "turnaround",
  views: MOCK_VIEWS,
  outfits: MOCK_OUTFITS,
  expressions: MOCK_EXPRESSIONS,
  colorPalette: MOCK_PALETTE,
  designNotes: MOCK_NOTES,
  activeViewId: null,
  activeNoteCategory: "all",
  paletteLocked: false,
  settings: { aspectRatio: "3:4", quality: "final", style: "concept-art" },
};

// =============================================================================
// CONTEXT
// =============================================================================

const CharContext = React.createContext<CharContextValue | null>(null);

export function CharProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CharacterProject>(INITIAL_STATE);

  const value: CharContextValue = React.useMemo(
    () => ({
      ...state,
      setActiveTemplate: (template) =>
        setState((s) => ({ ...s, activeTemplate: template })),
      setActiveView: (viewId) =>
        setState((s) => ({ ...s, activeViewId: viewId })),
      setActiveNoteCategory: (category) =>
        setState((s) => ({ ...s, activeNoteCategory: category })),
      toggleOutfit: (outfitId) =>
        setState((s) => ({
          ...s,
          outfits: s.outfits.map((o) => ({
            ...o,
            isActive: o.id === outfitId,
          })),
        })),
      togglePaletteLock: () =>
        setState((s) => ({ ...s, paletteLocked: !s.paletteLocked })),
      addNote: (text, category) =>
        setState((s) => ({
          ...s,
          designNotes: [
            { id: `n${Date.now()}`, text, category, createdAt: new Date().toISOString() },
            ...s.designNotes,
          ],
        })),
      setQuality: (quality) =>
        setState((s) => ({ ...s, settings: { ...s.settings, quality } })),
    }),
    [state]
  );

  return <CharContext.Provider value={value}>{children}</CharContext.Provider>;
}

export function useChar(): CharContextValue {
  const ctx = React.useContext(CharContext);
  if (!ctx) throw new Error("useChar must be used within CharProvider");
  return ctx;
}

export type { TemplateType, ViewType, ViewSlot, Outfit, Expression, DesignNote, NoteCategory, CharacterProject };
