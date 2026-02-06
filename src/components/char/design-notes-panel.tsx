"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChar } from "./char-context";
import type { NoteCategory } from "./char-context";
import { StickyNote, ChevronDown, Plus, Send } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES: { value: NoteCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "anatomy", label: "Anatomy" },
  { value: "color", label: "Color" },
  { value: "costume", label: "Costume" },
  { value: "lore", label: "Lore" },
];

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  anatomy: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  costume: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  lore: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DesignNotesPanel() {
  const { designNotes, activeNoteCategory, setActiveNoteCategory, addNote } = useChar();
  const [open, setOpen] = React.useState(true);
  const [newNote, setNewNote] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<NoteCategory>("anatomy");
  const prefersReducedMotion = useReducedMotion();

  const filteredNotes =
    activeNoteCategory === "all"
      ? designNotes
      : designNotes.filter((n) => n.category === activeNoteCategory);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(newNote.trim(), newCategory);
    setNewNote("");
  };

  return (
    <div className="absolute top-[340px] right-4 z-20">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="w-72 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <StickyNote className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-mono font-medium">Design Notes</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {designNotes.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOpen(false)}
                aria-label="Collapse design notes panel"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/30 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveNoteCategory(cat.value)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    activeNoteCategory === cat.value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-pressed={activeNoteCategory === cat.value}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notes list */}
            <ScrollArea className="max-h-[220px]">
              <div className="p-2 space-y-1.5">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-6">
                    <StickyNote className="size-6 text-muted-foreground/30 mx-auto mb-1" aria-hidden="true" />
                    <p className="text-[10px] text-muted-foreground font-mono">No notes yet</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="px-2.5 py-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] px-1.5 py-0 font-mono capitalize",
                            CATEGORY_COLORS[note.category]
                          )}
                        >
                          {note.category}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                          {timeAgo(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Add note input */}
            <div className="p-2 border-t border-border/50">
              {/* Category for new note */}
              <div className="flex items-center gap-1 mb-1.5">
                {(["anatomy", "color", "costume", "lore"] as NoteCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-mono capitalize transition-colors",
                      newCategory === cat
                        ? CATEGORY_COLORS[cat]
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={newCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a design note..."
                  className="min-h-[32px] h-8 text-xs resize-none border-border/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  aria-label="New design note"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  aria-label="Add note"
                >
                  <Send className="size-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-8 text-xs font-mono gap-1.5 bg-background/95 backdrop-blur-xl shadow-md"
              aria-label="Open design notes panel"
            >
              <StickyNote className="size-3.5" />
              Notes
              <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                {designNotes.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
