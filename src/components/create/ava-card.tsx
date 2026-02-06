"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Ava } from "@/types/ava";
import {
  Heart,
  Copy,
  Share2,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Play,
  Pencil,
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

interface AvaCardProps {
  ava: Ava;
  onSelect?: (ava: Ava) => void;
  onToggleFavorite?: (avaId: string, isFavorite: boolean) => void;
  onShare?: (ava: Ava) => void;
  onEdit?: (ava: Ava) => void;
  onDelete?: (avaId: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function AvaCard({
  ava,
  onSelect,
  onToggleFavorite,
  onShare,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
}: AvaCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleCopyInstructions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ava.instructions);
      toast.success("Copied instructions");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(ava.id, !ava.is_favorite);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(ava)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(ava);
        }
      }}
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
            <h3 className="text-sm font-medium truncate">{ava.name}</h3>
            {ava.is_favorite && (
              <Heart
                className="size-3 text-red-500 fill-red-500 flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
          {ava.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {ava.description}
            </p>
          )}
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="size-7 rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(ava);
                }}
              >
                <Play className="size-3.5 mr-2" aria-hidden="true" />
                Run Ava
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(ava);
                }}
              >
                <Pencil className="size-3.5 mr-2" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyInstructions}>
                <Copy className="size-3.5 mr-2" aria-hidden="true" />
                Copy Instructions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Heart
                  className={cn(
                    "size-3.5 mr-2",
                    ava.is_favorite && "fill-current"
                  )}
                />
                {ava.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(ava);
                }}
              >
                <Share2 className="size-3.5 mr-2" aria-hidden="true" />
                Share with User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(ava.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Instructions preview */}
      <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded-lg px-2 py-1.5">
        {ava.instructions}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {ava.use_count > 0 && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-normal gap-1"
            >
              <Sparkles className="size-2.5" aria-hidden="true" />
              {ava.use_count}
            </Badge>
          )}
        </div>

        {ava.original_author_id && (
          <span className="text-[10px] text-muted-foreground">Shared</span>
        )}
      </div>
    </motion.div>
  );
}
