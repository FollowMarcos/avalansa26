"use client";

import * as React from "react";
import { CharProvider } from "./char-context";
import { CharacterSheet } from "./character-sheet";
import { CharToolbar } from "./char-toolbar";
import { CharPromptBar } from "./char-prompt-bar";
import { ViewPanel } from "./view-panel";
import { OutfitPanel } from "./outfit-panel";
import { ExpressionPanel } from "./expression-panel";
import { ColorPalettePanel } from "./color-palette-panel";
import { DesignNotesPanel } from "./design-notes-panel";
import { motion, useReducedMotion } from "motion/react";

export function CharStudioLayout() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <CharProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="relative h-dvh flex flex-col bg-background text-foreground overflow-hidden"
      >
        {/* Grain texture overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-noise opacity-[0.03]" />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center - Sheet workspace */}
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <CharToolbar />

            {/* Character Sheet (main workspace) */}
            <CharacterSheet />

            {/* Bottom Prompt Bar */}
            <CharPromptBar />

            {/* Left floating panels */}
            <ViewPanel />
            <OutfitPanel />
            <ColorPalettePanel />

            {/* Right floating panels */}
            <ExpressionPanel />
            <DesignNotesPanel />
          </div>
        </div>
      </motion.div>
    </CharProvider>
  );
}
