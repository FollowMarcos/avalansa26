"use client";

import * as React from "react";
import { motion } from "motion/react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHistoryFeed } from "./editor-history-feed";
import { EditorPromptComposer } from "./editor-prompt-composer";
import { InpaintModal } from "./inpaint-modal";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

export function EditorLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="nerv nerv-crt nerv-flicker relative h-[100dvh] flex flex-col overflow-hidden bg-[var(--void)] font-[family-name:var(--font-ibm-plex-mono)]">
        {/* Main content: toolbar + feed */}
        <div className="flex-1 flex min-h-0">
          {/* Left: narrow icon toolbar (desktop only) */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="hidden md:flex flex-col w-14 border-r border-[var(--nerv-orange-dim)]/30 bg-[var(--void)] shrink-0"
          >
            <EditorToolbar />
          </motion.aside>

          {/* Right: history feed */}
          <main className="flex-1 min-w-0">
            <EditorHistoryFeed />
          </main>
        </div>

        {/* Bottom: full-width prompt composer with inline settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: 0.05 }}
        >
          <EditorPromptComposer />
        </motion.div>

        {/* Inpaint modal */}
        <InpaintModal />
      </div>
    </TooltipProvider>
  );
}
