"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/character";
import {
  Heart,
  Copy,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Pencil,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ============================================
// Character Card (for user's vault)
// ============================================

interface CharacterCardProps {
  character: Character;
  onSelect?: (character: Character) => void;
  onToggleFavorite?: (characterId: string, isFavorite: boolean) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function CharacterCard({
  character,
  onSelect,
  onToggleFavorite,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
}: CharacterCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Get primary image or first image
  const avatarImage =
    character.primary_image?.url ||
    (character.images && character.images.length > 0
      ? character.images[0].url
      : null);

  // Get image count for display
  const imageCount = character.images?.length ?? 0;

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(character.prompt_template);
      toast.success("Prompt copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(character.id, !character.is_favorite);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelect?.(character)}
      className={cn(
        "group relative rounded-xl border bg-card p-3 cursor-pointer transition-colors",
        "hover:border-foreground/20 hover:bg-accent/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Header with Avatar */}
      <div className="flex items-start gap-3 mb-2">
        {/* Character Avatar */}
        <Avatar className="size-10 rounded-lg border flex-shrink-0">
          {avatarImage ? (
            <AvatarImage src={avatarImage} alt={character.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="rounded-lg bg-muted">
            <User className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* Character Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium truncate">{character.name}</h3>
            {character.is_favorite && (
              <Heart
                className="size-3 text-red-500 fill-red-500 flex-shrink-0"
                aria-label="Favorite"
              />
            )}
          </div>
          {character.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {character.description}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopyPrompt}>
                <Copy className="size-3.5 mr-2" />
                Copy prompt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Heart
                  className={cn(
                    "size-3.5 mr-2",
                    character.is_favorite && "fill-current"
                  )}
                />
                {character.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(character);
                }}
              >
                <Pencil className="size-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(character.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Prompt preview */}
      <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded-lg px-2 py-1.5">
        {character.prompt_template}
      </p>

      {/* Image thumbnails (if multiple) */}
      {imageCount > 1 && character.images && (
        <div className="flex items-center gap-1 mt-2">
          {character.images.slice(0, 3).map((img, idx) => (
            <div
              key={img.id}
              className="size-6 rounded border overflow-hidden bg-muted"
            >
              <Image
                src={img.url}
                alt=""
                width={24}
                height={24}
                className="object-cover size-full"
              />
            </div>
          ))}
          {imageCount > 3 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              +{imageCount - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {character.use_count > 0 && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-normal gap-1"
            >
              <Sparkles className="size-2.5" aria-hidden="true" />
              {character.use_count}
            </Badge>
          )}
          {imageCount > 0 && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-normal"
            >
              {imageCount} ref{imageCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Compact Character Item (for quick select)
// ============================================

interface CharacterQuickItemProps {
  character: Character;
  onSelect: (character: Character) => void;
}

export function CharacterQuickItem({
  character,
  onSelect,
}: CharacterQuickItemProps) {
  // Get primary image or first image
  const avatarImage =
    character.primary_image?.url ||
    (character.images && character.images.length > 0
      ? character.images[0].url
      : null);

  return (
    <button
      onClick={() => onSelect(character)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg transition-colors",
        "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="size-6 rounded border flex-shrink-0">
          {avatarImage ? (
            <AvatarImage src={avatarImage} alt={character.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="rounded bg-muted text-[10px]">
            <User className="size-3 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{character.name}</span>
            {character.is_favorite && (
              <Heart className="size-3 text-red-500 fill-red-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {character.prompt_template}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================
// Character Mini Card (for selector in modal)
// ============================================

interface CharacterMiniCardProps {
  character: Character;
  isLinked?: boolean;
  onToggleLink?: (character: Character) => void;
}

export function CharacterMiniCard({
  character,
  isLinked = false,
  onToggleLink,
}: CharacterMiniCardProps) {
  // Get primary image or first image
  const avatarImage =
    character.primary_image?.url ||
    (character.images && character.images.length > 0
      ? character.images[0].url
      : null);

  return (
    <button
      onClick={() => onToggleLink?.(character)}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors w-full text-left",
        "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus:outline-none",
        isLinked && "bg-primary/10 border border-primary/20"
      )}
    >
      <Avatar className="size-5 rounded border flex-shrink-0">
        {avatarImage ? (
          <AvatarImage src={avatarImage} alt={character.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="rounded bg-muted text-[8px]">
          <User className="size-2.5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium truncate flex-1">{character.name}</span>
      {isLinked && (
        <div className="size-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}
