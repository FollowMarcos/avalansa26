"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/validations/color";
import type { Prompt, PromptFolder, PromptTag } from "@/types/prompt";
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
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PromptCard } from "./prompt-card";
import { AvaCard } from "./ava-card";

type VaultSection = "all" | "favorites" | "recent" | "avas" | string; // string for folder IDs

interface PromptVaultIslandProps {
  open: boolean;
  onToggle: () => void;
  prompts: Prompt[];
  folders: PromptFolder[];
  tags: PromptTag[];
  onSelectPrompt: (prompt: Prompt) => void;
  onToggleFavorite: (promptId: string, isFavorite: boolean) => void;
  onSharePrompt: (prompt: Prompt) => void;
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
  onSelectPrompt,
  onToggleFavorite,
  onSharePrompt,
  onDeletePrompt,
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

  // Filter prompts based on search and section
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
      // Sort by use_count and updated_at
      filtered = [...filtered]
        .filter((p) => p.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 10);
    } else if (activeSection !== "all") {
      // Filter by folder (activeSection is folder ID)
      // This would require folder item data from context
      // For now, show all in folder view
    }

    return filtered;
  }, [prompts, searchQuery, activeSection]);

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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-24 z-20">
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div
              key="panel"
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
              className="w-80 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookMarked
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-mono font-medium">
                    Prompt Vault
                  </span>
                  {prompts.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ({prompts.length})
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  aria-label="Close prompt vault"
                  className="size-7 rounded-lg"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden="true" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeSection === "avas" ? "Search your Avas\u2026" : "Search your prompts\u2026"}
                    aria-label={activeSection === "avas" ? "Search Avas" : "Search prompts"}
                    className="h-8 pl-8 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
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
                <div className="w-24 border-r border-border">
                  <ScrollArea className="h-[320px]">
                    <div className="p-1 space-y-0.5">
                      {/* All */}
                      <button
                        onClick={() => setActiveSection("all")}
                        aria-current={activeSection === "all" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          activeSection === "all"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Sparkles className="size-3 inline mr-1.5" aria-hidden="true" />
                        All
                        <span className="text-muted-foreground ml-1">
                          ({prompts.length})
                        </span>
                      </button>

                      {/* Favorites */}
                      <button
                        onClick={() => setActiveSection("favorites")}
                        aria-current={activeSection === "favorites" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          activeSection === "favorites"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Heart className="size-3 inline mr-1.5" aria-hidden="true" />
                        Favorites
                        {favoriteCount > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({favoriteCount})
                          </span>
                        )}
                      </button>

                      {/* Recent */}
                      <button
                        onClick={() => setActiveSection("recent")}
                        aria-current={activeSection === "recent" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          activeSection === "recent"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Clock className="size-3 inline mr-1.5" aria-hidden="true" />
                        Recent
                      </button>

                      {/* Avas */}
                      <button
                        onClick={() => setActiveSection("avas")}
                        aria-current={activeSection === "avas" ? "true" : undefined}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          activeSection === "avas"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Bot className="size-3 inline mr-1.5" aria-hidden="true" />
                        Avas
                        {avas.length > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({avas.length})
                          </span>
                        )}
                      </button>

                      {/* Folders */}
                      {folders.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-border">
                          <span className="px-2 text-[10px] font-medium text-muted-foreground uppercase">
                            Folders
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => setActiveSection(folder.id)}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors truncate",
                                  activeSection === folder.id
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-muted"
                                )}
                              >
                                <Folder
                                  className="size-3 inline mr-1.5"
                                  style={{ color: safeColor(folder.color) }}
                                />
                                {folder.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Content List */}
                <ScrollArea className="flex-1 h-[320px]">
                  {activeSection === "avas" ? (
                    /* Avas content */
                    <>
                      {/* Create Ava button */}
                      {onCreateAva && (
                        <div className="p-2 pb-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onCreateAva}
                            className="w-full h-8 text-xs"
                          >
                            <Plus className="size-3 mr-1.5" />
                            Create Ava
                          </Button>
                        </div>
                      )}
                      {filteredAvas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <Bot
                            className="size-8 text-muted-foreground/30 mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            {searchQuery
                              ? "No matching Avas"
                              : "No Avas yet"}
                          </p>
                          {!searchQuery && (
                            <p className="text-[10px] text-muted-foreground mt-1">
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
                            className="size-8 text-muted-foreground/30 mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            {searchQuery
                              ? "No matching prompts"
                              : activeSection === "favorites"
                                ? "No favorites yet"
                                : activeSection === "recent"
                                  ? "No recently used"
                                  : "No saved prompts"}
                          </p>
                          {!searchQuery && activeSection === "all" && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Save prompts using the bookmark button
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {filteredPrompts.map((prompt) => (
                            <PromptCard
                              key={prompt.id}
                              prompt={prompt}
                              onSelect={onSelectPrompt}
                              onToggleFavorite={onToggleFavorite}
                              onShare={onSharePrompt}
                              onDelete={onDeletePrompt}
                              showActions
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          ) : (
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
                    className="size-10 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <BookMarked className="size-4" aria-hidden="true" />
                    {prompts.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {prompts.length > 99 ? "99+" : prompts.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Prompt Vault</p>
                  {prompts.length > 0 && (
                    <p className="text-muted-foreground">
                      {prompts.length} saved prompt{prompts.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
