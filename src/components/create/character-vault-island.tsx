"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Character, CharacterFolder, CharacterTag } from "@/types/character";
import {
  Users,
  Search,
  X,
  Folder,
  Heart,
  Clock,
  Sparkles,
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
import { CharacterCard } from "./character-card";

type VaultSection = "all" | "favorites" | "recent" | string; // string for folder IDs

interface CharacterVaultIslandProps {
  open: boolean;
  onToggle: () => void;
  characters: Character[];
  folders: CharacterFolder[];
  tags: CharacterTag[];
  selectedCharacter?: Character | null;
  onSelectCharacter: (character: Character) => void;
  onToggleFavorite: (characterId: string, isFavorite: boolean) => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (characterId: string) => void;
  onCreateNew: () => void;
}

export function CharacterVaultIsland({
  open,
  onToggle,
  characters,
  folders,
  tags,
  selectedCharacter,
  onSelectCharacter,
  onToggleFavorite,
  onEditCharacter,
  onDeleteCharacter,
  onCreateNew,
}: CharacterVaultIslandProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = React.useState<VaultSection>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter characters based on search and section
  const filteredCharacters = React.useMemo(() => {
    let filtered = characters;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.prompt_template.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    // Apply section filter
    if (activeSection === "favorites") {
      filtered = filtered.filter((c) => c.is_favorite);
    } else if (activeSection === "recent") {
      // Sort by use_count and updated_at
      filtered = [...filtered]
        .filter((c) => c.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 10);
    } else if (activeSection !== "all") {
      // Filter by folder (activeSection is folder ID)
      // Would need folder item data - for now show all
    }

    return filtered;
  }, [characters, searchQuery, activeSection]);

  const favoriteCount = characters.filter((c) => c.is_favorite).length;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Position below the prompt vault (top-4 + button height + gap = ~top-20) */}
      <div className="absolute top-20 left-4 z-20">
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
                  <Users
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-mono font-medium">
                    Characters
                  </span>
                  {characters.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ({characters.length})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCreateNew}
                        aria-label="Create new character"
                        className="size-7 rounded-lg"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>New Character</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    aria-label="Close character vault"
                    className="size-7 rounded-lg"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search characters..."
                    className="h-8 pl-8 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                    >
                      <X className="size-3" />
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
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          activeSection === "all"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Sparkles className="size-3 inline mr-1.5" />
                        All
                        <span className="text-muted-foreground ml-1">
                          ({characters.length})
                        </span>
                      </button>

                      {/* Favorites */}
                      <button
                        onClick={() => setActiveSection("favorites")}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          activeSection === "favorites"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Heart className="size-3 inline mr-1.5" />
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
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          activeSection === "recent"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Clock className="size-3 inline mr-1.5" />
                        Recent
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
                                  style={{ color: folder.color || undefined }}
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

                {/* Character List */}
                <ScrollArea className="flex-1 h-[320px]">
                  {filteredCharacters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Users
                        className="size-8 text-muted-foreground/30 mb-2"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        {searchQuery
                          ? "No matching characters"
                          : activeSection === "favorites"
                            ? "No favorites yet"
                            : activeSection === "recent"
                              ? "No recently used"
                              : "No saved characters"}
                      </p>
                      {!searchQuery && activeSection === "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onCreateNew}
                          className="mt-3"
                        >
                          <Plus className="size-3 mr-1.5" />
                          Create Character
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {filteredCharacters.map((character) => (
                        <CharacterCard
                          key={character.id}
                          character={character}
                          onSelect={onSelectCharacter}
                          onToggleFavorite={onToggleFavorite}
                          onEdit={onEditCharacter}
                          onDelete={onDeleteCharacter}
                          isSelected={selectedCharacter?.id === character.id}
                          showActions
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Active Character Indicator */}
              {selectedCharacter && (
                <div className="px-3 py-2 border-t border-border bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-medium truncate">
                        Active: {selectedCharacter.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                    aria-label="Open character vault"
                    className={cn(
                      "size-10 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-sm hover:shadow-md transition-shadow",
                      selectedCharacter && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Users className="size-4" aria-hidden="true" />
                    {characters.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {characters.length > 99 ? "99+" : characters.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Characters</p>
                  {characters.length > 0 && (
                    <p className="text-muted-foreground">
                      {characters.length} saved character{characters.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  {selectedCharacter && (
                    <p className="text-primary">Active: {selectedCharacter.name}</p>
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
