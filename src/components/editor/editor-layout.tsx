"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EditorSettingsPanel } from "./editor-settings-panel";
import { EditorHistoryFeed } from "./editor-history-feed";
import { EditorPromptComposer } from "./editor-prompt-composer";
import { InpaintModal } from "./inpaint-modal";
import { Settings2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function EditorLayout() {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden">
      {/* Grain texture (matches create page) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: "url(/grain.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Main content: two columns */}
      <div className="flex-1 flex min-h-0 relative z-10">
        {/* Left column: settings panel (desktop) */}
        <aside className="hidden md:flex flex-col w-[352px] border-r border-border bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-3 py-2 border-b border-border/50">
            <h2 className="text-xs font-semibold text-foreground tracking-wide">
              Settings
            </h2>
          </div>
          <EditorSettingsPanel />
        </aside>

        {/* Mobile: settings as sheet */}
        <div className="md:hidden fixed bottom-20 left-3 z-30">
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                aria-label="Open settings"
              >
                <Settings2 className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[352px] p-0">
              <div className="px-3 py-2 border-b border-border/50">
                <h2 className="text-xs font-semibold text-foreground tracking-wide">
                  Settings
                </h2>
              </div>
              <EditorSettingsPanel />
            </SheetContent>
          </Sheet>
        </div>

        {/* Right column: history feed */}
        <main className="flex-1 min-w-0">
          <EditorHistoryFeed />
        </main>
      </div>

      {/* Bottom: full-width prompt composer */}
      <EditorPromptComposer />

      {/* Inpaint modal */}
      <InpaintModal />
    </div>
  );
}
