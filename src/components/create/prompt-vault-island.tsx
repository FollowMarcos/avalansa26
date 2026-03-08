"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/validations/color";
import type { PromptWithOrganization, PromptFolder, PromptTag } from "@/types/prompt";
import type { Ava, AvaFolder } from "@/types/ava";
import {
  BookMarked,
  Search,
  X,
  Folder,
  Heart,
  Clock,
  Sparkles,
  Bot,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PromptCard } from "./prompt-card";
import { AvaCard } from "./ava-card";

type VaultSection = "all" | "favorites" | "recent" | "avas" | string; // string for folder IDs
type VaultSort = "recent" | "name" | "usage";

interface PromptVaultIslandProps {
  open: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  prompts: PromptWithOrganization[];
  folders: PromptFolder[];
  tags: PromptTag[];
  folderItemCounts?: Record<string, number>;
  folderMapping?: Record<string, string[]>;
  onSelectPrompt: (prompt: PromptWithOrganization) => void;
  onToggleFavorite: (promptId: string, isFavorite: boolean) => void;
  onSharePrompt: (prompt: PromptWithOrganization) => void;
  onDeletePrompt: (promptId: string) => void;
  // Ava props
  avas?: Ava[];
  avaFolders?: AvaFolder[];
  onRunAva?: (ava: Ava) => void;
  onEditAva?: (ava: Ava) => void;
  onCreateAva?: () => void;
  onToggleAvaFavorite?: (avaId: string, isFavorite: boolean) => void;
  onShareAva?: (ava: Ava) => void;
  onDeleteAva?: (avaId: string) => void;
}

export function PromptVaultIsland({
  open,
  onToggle,
  prompts,
  folders,
  tags,
  folderItemCounts = {},
  folderMapping = {},
  onSelectPrompt,
  onToggleFavorite,
  onSharePrompt,
  onDeletePrompt,
  showToggle = true,
  avas = [],
  avaFolders = [],
  onRunAva,
  onEditAva,
  onCreateAva,
  onToggleAvaFavorite,
  onShareAva,
  onDeleteAva,
}: PromptVaultIslandProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = React.useState<VaultSection>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<VaultSort>("recent");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Filter and sort prompts
  const filteredPrompts = React.useMemo(() => {
    let filtered = prompts;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.prompt_text.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Apply section filter
    if (activeSection === "favorites") {
      filtered = filtered.filter((p) => p.is_favorite);
    } else if (activeSection === "recent") {
      filtered = [...filtered]
        .filter((p) => p.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 10);
    } else if (activeSection !== "all" && activeSection !== "avas") {
      // Filter by folder ID
      const folderPromptIds = folderMapping[activeSection] ?? [];
      if (folderPromptIds.length > 0) {
        const idSet = new Set(folderPromptIds);
        filtered = filtered.filter((p) => idSet.has(p.id));
      } else {
        filtered = [];
      }
    }

    // Apply sort (skip for "recent" section which has its own sorting)
    if (activeSection !== "recent") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "usage":
            return b.use_count - a.use_count;
          case "recent":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
    }

    return filtered;
  }, [prompts, searchQuery, activeSection, sortBy, folderMapping]);

  // Filter avas based on search
  const filteredAvas = React.useMemo(() => {
    if (!searchQuery) return avas;
    const query = searchQuery.toLowerCase();
    return avas.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.instructions.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
    );
  }, [avas, searchQuery]);

  const favoriteCount = prompts.filter((p) => p.is_favorite).length;

  // Reset focus when filters change
  React.useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, activeSection, sortBy]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (activeSection === "avas") return; // Skip keyboard nav for avas

      const items = filteredPrompts;
      if (items.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setFocusedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
          break;
        }
        case "Enter": {
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            e.preventDefault();
            onSelectPrompt(items[focusedIndex]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          onToggle();
          break;
        }
        case "/": {
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, activeSection, filteredPrompts, focusedIndex, onSelectPrompt, onToggle]);

  // Global keyboard shortcut to toggle vault
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        onToggle();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onToggle]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-[4.25rem] left-[5.25rem] z-20">
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div
              key="panel"
              ref={panelRef}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.95, x: -20 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, x: 0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.95, x: -20 }
              }
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-[640px] bg-[#010101]/95 backdrop-blur-xl border border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)] rounded-none overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--nerv-orange-dim)]/20">
                <div className="flex items-center gap-2">
                  <BookMarked
                    className="size-4 text-[var(--nerv-orange)]"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-[family-name:var(--font-ibm-plex-mono)] font-medium text-[var(--nerv-orange)] uppercase tracking-[0.1em] glow-orange">
                    Prompt Vault
                  </span>
                  {prompts.length > 0 && (
                    <span className="text-xs text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)] glow-green">
                      ({prompts.length})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sort dropdown */}
                  {activeSection !== "avas" && (
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as VaultSort)}>
                      <SelectTrigger className="h-6 w-[100px] text-[10px] border-none bg-transparent text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)]">
                        <ArrowUpDown className="size-3 mr-1 text-[var(--steel-dim)]" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
                        <SelectItem value="recent" className="text-xs text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)] rounded-none">Recent</SelectItem>
                        <SelectItem value="name" className="text-xs text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)] rounded-none">Name</SelectItem>
                        <SelectItem value="usage" className="text-xs text-[var(--steel)] focus:bg-[var(--nerv-orange)]/15 focus:text-[var(--nerv-orange)] rounded-none">Most Used</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Keyboard hint */}
                  <span className="text-[9px] text-[var(--steel-dim)]/50 font-[family-name:var(--font-ibm-plex-mono)] hidden sm:inline">
                    Ctrl+Shift+P
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    aria-label="Close prompt vault"
                    className="size-7 rounded-none text-[var(--steel-dim)] hover:text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-[var(--nerv-orange-dim)]/20">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--steel-dim)]" aria-hidden="true" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeSection === "avas" ? "Search Avas\u2026" : "Search prompts\u2026  (press / to focus)"}
                    aria-label={activeSection === "avas" ? "Search Avas" : "Search prompts"}
                    className="h-8 pl-8 text-sm bg-[var(--void)] border-[var(--steel-faint)] text-[var(--steel)] placeholder:text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)] rounded-none focus-visible:ring-[var(--nerv-orange)]/50"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-6 text-[var(--steel-dim)] hover:text-[var(--nerv-orange)]"
                      aria-label="Clear search"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-36 border-r border-[var(--nerv-orange-dim)]/20">
                  <ScrollArea className="h-[400px]">
                    <div className="p-1.5 space-y-0.5">
                      {/* All */}
                      <button
                        onClick={() => setActiveSection("all")}
                        aria-current={activeSection === "all" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]",
                          "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] focus-visible:outline-none",
                          activeSection === "all"
                            ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                            : "text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                        )}
                      >
                        <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">All</span>
                        <span className="text-[var(--data-green)] ml-auto text-[10px] tabular-nums">
                          {prompts.length}
                        </span>
                      </button>

                      {/* Favorites */}
                      <button
                        onClick={() => setActiveSection("favorites")}
                        aria-current={activeSection === "favorites" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]",
                          "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] focus-visible:outline-none",
                          activeSection === "favorites"
                            ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                            : "text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                        )}
                      >
                        <Heart className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Favorites</span>
                        {favoriteCount > 0 && (
                          <span className="text-[var(--data-green)] ml-auto text-[10px] tabular-nums">
                            {favoriteCount}
                          </span>
                        )}
                      </button>

                      {/* Recent */}
                      <button
                        onClick={() => setActiveSection("recent")}
                        aria-current={activeSection === "recent" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]",
                          "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] focus-visible:outline-none",
                          activeSection === "recent"
                            ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                            : "text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                        )}
                      >
                        <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Recent</span>
                      </button>

                      {/* Avas */}
                      <button
                        onClick={() => setActiveSection("avas")}
                        aria-current={activeSection === "avas" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]",
                          "focus-visible:ring-2 focus-visible:ring-[var(--nerv-orange)] focus-visible:outline-none",
                          activeSection === "avas"
                            ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                            : "text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                        )}
                      >
                        <Bot className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Avas</span>
                        {avas.length > 0 && (
                          <span className="text-[var(--data-green)] ml-auto text-[10px] tabular-nums">
                            {avas.length}
                          </span>
                        )}
                      </button>

                      {/* Folders */}
                      {folders.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-[var(--steel-faint)]">
                          <span className="px-2.5 text-[10px] font-medium text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em] font-[family-name:var(--font-ibm-plex-mono)]">
                            Folders
                          </span>
                          <div className="mt-1.5 space-y-0.5">
                            {folders.map((folder) => {
                              const fColor = safeColor(folder.color);
                              const count = folderItemCounts[folder.id] ?? 0;
                              return (
                                <button
                                  key={folder.id}
                                  onClick={() => setActiveSection(folder.id)}
                                  className={cn(
                                    "w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)]",
                                    activeSection === folder.id
                                      ? "bg-[var(--nerv-orange)]/15 text-[var(--nerv-orange)]"
                                      : "text-[var(--steel-dim)] hover:bg-[var(--nerv-orange)]/10 hover:text-[var(--nerv-orange)]"
                                  )}
                                  style={{
                                    borderLeft: activeSection === folder.id && fColor
                                      ? `2px solid ${fColor}`
                                      : undefined,
                                  }}
                                >
                                  {fColor && (
                                    <div
                                      className="size-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: fColor }}
                                    />
                                  )}
                                  <Folder
                                    className="size-3.5 shrink-0"
                                    style={{ color: fColor }}
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{folder.name}</span>
                                  {count > 0 && (
                                    <span className="text-[var(--data-green)] ml-auto text-[10px] tabular-nums">
                                      {count}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Content List */}
                <ScrollArea className="flex-1 h-[400px]">
                  {activeSection === "avas" ? (
                    /* Avas content */
                    <>
                      {onCreateAva && (
                        <div className="p-2 pb-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onCreateAva}
                            className="w-full h-8 text-xs rounded-none border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10 bg-transparent font-[family-name:var(--font-ibm-plex-mono)] uppercase tracking-[0.05em]"
                          >
                            <Plus className="size-3 mr-1.5" />
                            Create Ava
                          </Button>
                        </div>
                      )}
                      {filteredAvas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <Bot
                            className="size-8 text-[var(--steel-dim)]/30 mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-xs text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)]">
                            {searchQuery
                              ? "No matching Avas"
                              : "No Avas yet"}
                          </p>
                          {!searchQuery && (
                            <p className="text-[10px] text-[var(--steel-dim)] mt-1 font-[family-name:var(--font-ibm-plex-mono)]">
                              Create an Ava to generate prompts with AI
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {filteredAvas.map((ava) => (
                            <AvaCard
                              key={ava.id}
                              ava={ava}
                              onSelect={onRunAva}
                              onEdit={onEditAva}
                              onToggleFavorite={onToggleAvaFavorite}
                              onShare={onShareAva}
                              onDelete={onDeleteAva}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Prompts content */
                    <>
                      {filteredPrompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <BookMarked
                            className="size-8 text-[var(--steel-dim)]/30 mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-xs text-[var(--steel-dim)] font-[family-name:var(--font-ibm-plex-mono)]">
                            {searchQuery
                              ? "No matching prompts"
                              : activeSection === "favorites"
                                ? "No favorites yet"
                                : activeSection === "recent"
                                  ? "No recently used"
                                  : "No saved prompts"}
                          </p>
                          {!searchQuery && activeSection === "all" && (
                            <p className="text-[10px] text-[var(--steel-dim)] mt-1 font-[family-name:var(--font-ibm-plex-mono)]">
                              Save prompts using the bookmark button
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {filteredPrompts.map((prompt, i) => (
                            <PromptCard
                              key={prompt.id}
                              prompt={prompt}
                              tags={prompt.tags}
                              primaryFolder={prompt.folders?.[0]}
                              variant="compact"
                              onSelect={onSelectPrompt}
                              onToggleFavorite={onToggleFavorite}
                              onShare={onSharePrompt}
                              onDelete={onDeletePrompt}
                              isFocused={focusedIndex === i}
                              showActions
                              index={i}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          ) : showToggle ? (
            <motion.div
              key="button"
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
              }
              animate={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
              }
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onToggle}
                    aria-label="Open prompt vault"
                    className="size-10 rounded-none bg-[#010101]/90 backdrop-blur-xl border border-[var(--nerv-orange-dim)]/40 text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10 transition-colors"
                  >
                    <BookMarked className="size-4" aria-hidden="true" />
                    {prompts.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-[var(--nerv-orange)] text-[var(--void)] text-[10px] font-bold flex items-center justify-center">
                        {prompts.length > 99 ? "99+" : prompts.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="rounded-none bg-[#010101] border-[var(--nerv-orange-dim)]/40 text-[var(--steel)]">
                  <p>Prompt Vault</p>
                  {prompts.length > 0 && (
                    <p className="text-[var(--steel-dim)]">
                      {prompts.length} saved prompt{prompts.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  <p className="text-[var(--steel-dim)] text-[10px] mt-0.5">Ctrl+Shift+P</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
