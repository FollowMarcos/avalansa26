"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/character";
import {
  Users,
  Search,
  X,
  Check,
  Loader2,
  ChevronDown,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CharacterMiniCard } from "./character-card";

interface CharacterSelectorProps {
  /** All available characters to select from */
  characters: Character[];
  /** Currently linked character IDs */
  linkedCharacterIds: string[];
  /** Loading state for linked characters */
  isLoading?: boolean;
  /** Called when linking a character */
  onLink: (characterId: string) => Promise<boolean>;
  /** Called when unlinking a character */
  onUnlink: (characterId: string) => Promise<boolean>;
}

export function CharacterSelector({
  characters,
  linkedCharacterIds,
  isLoading = false,
  onLink,
  onUnlink,
}: CharacterSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  // Filter characters based on search
  const filteredCharacters = React.useMemo(() => {
    if (!searchQuery) return characters;

    const query = searchQuery.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [characters, searchQuery]);

  // Get linked characters for display
  const linkedCharacters = React.useMemo(
    () => characters.filter((c) => linkedCharacterIds.includes(c.id)),
    [characters, linkedCharacterIds]
  );

  const handleToggleLink = async (character: Character) => {
    const isCurrentlyLinked = linkedCharacterIds.includes(character.id);
    setPendingAction(character.id);

    try {
      if (isCurrentlyLinked) {
        const success = await onUnlink(character.id);
        if (success) {
          toast.success(`Unlinked from ${character.name}`);
        }
      } else {
        const success = await onLink(character.id);
        if (success) {
          toast.success(`Linked to ${character.name}`);
        }
      }
    } catch (error) {
      console.error("Failed to toggle character link:", error);
      toast.error("Failed to update character link");
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Linked characters display */}
      {linkedCharacters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedCharacters.map((character) => {
            const avatarImage =
              character.primary_image?.url ||
              (character.images && character.images.length > 0
                ? character.images[0].url
                : null);

            return (
              <Badge
                key={character.id}
                variant="secondary"
                className="gap-1.5 pr-1 pl-1"
              >
                <Avatar className="size-4 rounded border">
                  {avatarImage ? (
                    <AvatarImage src={avatarImage} alt="" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="rounded text-[8px]">
                    <User className="size-2" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{character.name}</span>
                <button
                  onClick={() => handleToggleLink(character)}
                  disabled={pendingAction === character.id}
                  className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center disabled:opacity-50"
                >
                  {pendingAction === character.id ? (
                    <Loader2 className="size-2.5 animate-spin" />
                  ) : (
                    <X className="size-2.5" />
                  )}
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8"
          >
            {linkedCharacters.length === 0 ? (
              <span className="text-muted-foreground text-xs">
                Link to character...
              </span>
            ) : (
              <span className="text-xs">
                {linkedCharacters.length} character
                {linkedCharacters.length !== 1 ? "s" : ""} linked
              </span>
            )}
            <ChevronDown className="size-3.5 ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>

          {/* Character list */}
          <ScrollArea className="max-h-[200px]">
            {characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users
                  className="size-6 text-muted-foreground/30 mb-1"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">No characters yet</p>
              </div>
            ) : filteredCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No matching characters
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredCharacters.map((character) => {
                  const isLinked = linkedCharacterIds.includes(character.id);
                  const isPending = pendingAction === character.id;

                  return (
                    <CharacterMiniCard
                      key={character.id}
                      character={character}
                      isLinked={isLinked}
                      onToggleLink={() => handleToggleLink(character)}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ============================================
// Inline Character Selector (simpler variant)
// ============================================

interface InlineCharacterSelectorProps {
  characters: Character[];
  linkedCharacterIds: string[];
  onLink: (characterId: string) => Promise<boolean>;
  onUnlink: (characterId: string) => Promise<boolean>;
}

export function InlineCharacterSelector({
  characters,
  linkedCharacterIds,
  onLink,
  onUnlink,
}: InlineCharacterSelectorProps) {
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const handleToggle = async (character: Character) => {
    const isLinked = linkedCharacterIds.includes(character.id);
    setPendingAction(character.id);

    try {
      if (isLinked) {
        await onUnlink(character.id);
      } else {
        await onLink(character.id);
      }
    } finally {
      setPendingAction(null);
    }
  };

  if (characters.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No characters available. Create one first.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {characters.slice(0, 6).map((character) => {
        const isLinked = linkedCharacterIds.includes(character.id);
        const isPending = pendingAction === character.id;
        const avatarImage =
          character.primary_image?.url ||
          (character.images?.[0]?.url ?? null);

        return (
          <button
            key={character.id}
            onClick={() => handleToggle(character)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all",
              "border hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus:outline-none",
              isLinked
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border",
              isPending && "opacity-50"
            )}
          >
            <Avatar className="size-4 rounded">
              {avatarImage ? (
                <AvatarImage src={avatarImage} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded text-[8px]">
                <User className="size-2" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[60px]">{character.name}</span>
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : isLinked ? (
              <Check className="size-3" />
            ) : null}
          </button>
        );
      })}
      {characters.length > 6 && (
        <span className="text-xs text-muted-foreground self-center px-1">
          +{characters.length - 6} more
        </span>
      )}
    </div>
  );
}
