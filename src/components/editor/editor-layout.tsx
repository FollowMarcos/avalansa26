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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative h-[100dvh] flex flex-col overflow-hidden"
      >
        {/* Grain texture (matches create page) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: "url(/grain.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Main content: toolbar + feed */}
        <div className="flex-1 flex min-h-0 relative z-10">
          {/* Left: narrow icon toolbar (desktop only) */}
          <motion.aside
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="hidden md:flex flex-col w-14 border-r border-border bg-background/80 backdrop-blur-sm shrink-0"
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <EditorPromptComposer />
        </motion.div>

        {/* Inpaint modal */}
        <InpaintModal />
      </motion.div>
    </TooltipProvider>
  );
}
