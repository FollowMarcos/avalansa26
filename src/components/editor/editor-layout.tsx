"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useCreate } from "@/components/create/create-context";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHistoryFeed } from "./editor-history-feed";
import { EditorPromptComposer } from "./editor-prompt-composer";
import { InpaintModal } from "./inpaint-modal";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

function SystemClock() {
  const [time, setTime] = React.useState("");
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time || "--:--:--"}</span>;
}

export function EditorLayout() {
  const { activeGenerations, history } = useCreate();
  const completedCount = React.useMemo(
    () => history.filter((g) => g.status === "completed").length,
    [history]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="nerv nerv-crt nerv-flicker relative h-[100dvh] flex flex-col overflow-hidden bg-[var(--void)] font-[family-name:var(--font-ibm-plex-mono)]">

        {/* ── AVA Institutional Header ── */}
        <header className="flex items-center h-8 px-3 bg-[var(--void)] border-b border-[var(--nerv-orange-dim)]/30 shrink-0 gap-3 select-none">
          {/* Org mark */}
          <span className="text-sm tracking-[0.2em] uppercase text-[var(--nerv-orange)] font-[family-name:var(--font-bebas-neue)] glow-orange">
            AVA
          </span>
          <span className="text-[8px] tracking-[0.1em] text-[var(--steel-dim)] font-[family-name:var(--font-noto-sans-jp)]">
            画像生成システム
          </span>
          <div className="w-px h-4 bg-[var(--nerv-orange-dim)]/30" />

          {/* System status LEDs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span
                className={`size-1.5 rounded-full ${activeGenerations > 0 ? "bg-[var(--nerv-orange)] nerv-led-pulse" : "bg-[var(--data-green)]"}`}
                style={{ boxShadow: activeGenerations > 0 ? "0 0 6px var(--nerv-orange)" : "0 0 4px var(--data-green)" }}
              />
              <span className="text-[8px] tracking-[0.1em] uppercase text-[var(--steel-dim)]">
                {activeGenerations > 0 ? "ACTIVE" : "IDLE"}
              </span>
            </div>
            <span className="text-[8px] text-[var(--data-green-dim)] tabular-nums">
              GEN:{String(completedCount).padStart(4, "0")}
            </span>
            <span className="text-[8px] text-[var(--nerv-orange-dim)] tabular-nums">
              Q:{activeGenerations}/4
            </span>
          </div>

          {/* Ticker tape */}
          <div className="flex-1 min-w-0 overflow-hidden mx-2">
            <div className="nerv-ticker-scroll text-[8px] tracking-[0.06em] uppercase text-[var(--nerv-orange-dim)]">
              AVA IMAGE GENERATION CONSOLE — SYSTEM NOMINAL — ALL SUBSYSTEMS OPERATIONAL — 画像生成コンソール — PATTERN ANALYSIS ENABLED — NEURAL LINK STABLE
            </div>
          </div>

          {/* Clock */}
          <span className="text-[9px] text-[var(--data-green)] glow-green shrink-0">
            <SystemClock />
          </span>
        </header>

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
