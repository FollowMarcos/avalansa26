"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, ImageIcon } from "lucide-react";
import { CreateV2Provider, useCreateV2 } from "./createv2-context";
import { ChatColumn } from "./chat-column";
import { GalleryColumn } from "./gallery-column";
import { SettingsColumn } from "./settings-column";

function LayoutInner() {
  const { settingsPanelOpen, setSettingsPanelOpen, mobileTab, setMobileTab } =
    useCreateV2();

  return (
    <div className="relative h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Column 1: Chat */}
        <div className="flex flex-col w-[400px] min-w-[340px] border-r border-border">
          <ChatColumn />
        </div>

        {/* Column 2: Gallery */}
        <div className="flex-1 flex flex-col min-w-[280px]">
          <GalleryColumn />
        </div>

        {/* Column 3: Settings (collapsible) */}
        <AnimatePresence initial={false}>
          {settingsPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col border-l border-border overflow-hidden"
            >
              <SettingsColumn />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings toggle (when collapsed) */}
        {!settingsPanelOpen && (
          <div className="flex flex-col items-center py-3 px-1.5 border-l border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsPanelOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "chat" && <ChatColumn />}
          {mobileTab === "gallery" && <GalleryColumn />}
          {mobileTab === "settings" && (
            <div className="h-full">
              <SettingsColumn />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="flex items-center border-t border-border bg-background">
          {(
            [
              { key: "chat", icon: MessageSquare, label: "Chat" },
              { key: "gallery", icon: ImageIcon, label: "Gallery" },
              { key: "settings", icon: Settings, label: "Settings" },
            ] as const
          ).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMobileTab(key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
                mobileTab === key
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreateV2Layout() {
  return (
    <CreateV2Provider>
      <LayoutInner />
    </CreateV2Provider>
  );
}
