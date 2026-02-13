"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/types/prompt";
import {
  Heart,
  Copy,
  Share2,
  Trash2,
  MoreHorizontal,
  Sparkles,
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

// ============================================
// Prompt Card (for user's vault)
// ============================================

interface PromptCardProps {
  prompt: Prompt;
  onSelect?: (prompt: Prompt) => void;
  onToggleFavorite?: (promptId: string, isFavorite: boolean) => void;
  onShare?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function PromptCard({
  prompt,
  onSelect,
  onToggleFavorite,
  onShare,
  onDelete,
  isSelected = false,
  showActions = true,
}: PromptCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt.id, !prompt.is_favorite);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(prompt)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(prompt); } }}
      className={cn(
        "group relative rounded-xl border bg-card p-3 cursor-pointer transition-colors",
        "hover:border-foreground/20 hover:bg-accent/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium truncate">{prompt.name}</h3>
            {prompt.is_favorite && (
              <Heart
                className="size-3 text-red-500 fill-red-500 flex-shrink-0"
                aria-label="Favorite"
              />
            )}
          </div>
          {prompt.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {prompt.description}
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyPrompt}
              className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Copy prompt to clipboard"
            >
              <Copy className="size-3.5" aria-hidden="true" />
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
                    prompt.is_favorite && "fill-current"
                  )}
                />
                {prompt.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(prompt);
                }}
              >
                <Share2 className="size-3.5 mr-2" />
                Share with user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(prompt.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
      </div>

      {/* Prompt preview */}
      <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded-lg px-2 py-1.5">
        {prompt.prompt_text}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {prompt.use_count > 0 && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-normal gap-1"
            >
              <Sparkles className="size-2.5" aria-hidden="true" />
              {prompt.use_count}
            </Badge>
          )}
        </div>

        {prompt.original_author_id && (
          <span className="text-[10px] text-muted-foreground">Shared</span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Compact Prompt Item (for quick select)
// ============================================

interface PromptQuickItemProps {
  prompt: Prompt;
  onSelect: (prompt: Prompt) => void;
}

export function PromptQuickItem({ prompt, onSelect }: PromptQuickItemProps) {
  return (
    <button
      onClick={() => onSelect(prompt)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg transition-colors",
        "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus:outline-none"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{prompt.name}</span>
        {prompt.is_favorite && (
          <Heart className="size-3 text-red-500 fill-red-500 flex-shrink-0" />
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {prompt.prompt_text}
      </p>
    </button>
  );
}
