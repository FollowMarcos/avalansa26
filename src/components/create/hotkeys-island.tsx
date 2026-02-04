"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Keyboard } from "lucide-react";

const HOTKEYS_COLLAPSED_KEY = "canvas-hotkeys-collapsed";

interface HotkeyItem {
  keys: string[];
  description: string;
}

interface HotkeySection {
  title: string;
  items: HotkeyItem[];
}

const HOTKEY_SECTIONS: HotkeySection[] = [
  {
    title: "Tools",
    items: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["H"], description: "Hand tool" },
      { keys: ["Space"], description: "Temporary pan (hold)" },
    ],
  },
  {
    title: "Zoom",
    items: [
      { keys: ["Ctrl", "+"], description: "Zoom in" },
      { keys: ["Ctrl", "-"], description: "Zoom out" },
      { keys: ["Ctrl", "0"], description: "Zoom to 100%" },
      { keys: ["Ctrl", "1"], description: "Fit all" },
      { keys: ["Ctrl", "2"], description: "Zoom to selection" },
      { keys: ["Ctrl", "Scroll"], description: "Zoom" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["↑ ↓ ← →"], description: "Pan canvas" },
      { keys: ["Shift", "Arrows"], description: "Pan faster" },
      { keys: ["Scroll"], description: "Vertical pan" },
      { keys: ["Shift", "Ctrl", "Scroll"], description: "Horizontal pan" },
    ],
  },
  {
    title: "Groups",
    items: [
      { keys: ["Ctrl", "G"], description: "Create group" },
      { keys: ["Delete"], description: "Delete group" },
      { keys: ["Double-click"], description: "Edit title" },
      { keys: ["F2"], description: "Rename group" },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[20px] h-5 px-1.5",
        "text-[10px] font-medium",
        "bg-muted border border-border rounded",
        "text-muted-foreground"
      )}
    >
      {children}
    </kbd>
  );
}

export function HotkeysIsland() {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(HOTKEYS_COLLAPSED_KEY);
    return saved !== "false"; // Default to collapsed
  });

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(HOTKEYS_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-[100] pointer-events-auto">
      <div
        className={cn(
          "bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2",
            "hover:bg-muted/50 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand hotkeys" : "Collapse hotkeys"}
        >
          <Keyboard className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Hotkeys</span>
          {isCollapsed ? (
            <ChevronDown className="size-4 text-muted-foreground ml-auto" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground ml-auto" aria-hidden="true" />
          )}
        </button>

        {/* Content */}
        <div
          className={cn(
            "transition-[max-height,opacity] duration-200 ease-out",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100"
          )}
        >
          <div className="px-3 pb-3 space-y-3">
            {HOTKEY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs text-foreground">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            <KeyBadge>{key}</KeyBadge>
                            {keyIdx < item.keys.length - 1 && (
                              <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
