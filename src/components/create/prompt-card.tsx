"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/validations/color";
import type { Prompt, PromptTag, PromptFolder, PromptImage } from "@/types/prompt";
import {
  Heart,
  Copy,
  Check,
  Share2,
  Trash2,
  Pencil,
  MoreHorizontal,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// Unified Prompt Card
// ============================================

interface PromptCardProps {
  prompt: Prompt;
  tags?: PromptTag[];
  primaryFolder?: PromptFolder;
  variant?: "compact" | "full";
  viewMode?: "grid" | "list";
  onSelect?: (prompt: Prompt) => void;
  onToggleFavorite?: (promptId: string, isFavorite: boolean) => void;
  onCopy?: (prompt: Prompt) => void;
  onShare?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  onUse?: (prompt: Prompt) => void;
  isSelected?: boolean;
  isFocused?: boolean;
  showActions?: boolean;
  index?: number;
}

export function PromptCard({
  prompt,
  tags,
  primaryFolder,
  variant = "compact",
  viewMode = "grid",
  onSelect,
  onToggleFavorite,
  onCopy,
  onShare,
  onEdit,
  onDelete,
  onUse,
  isSelected = false,
  isFocused = false,
  showActions = true,
  index = 0,
}: PromptCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [justCopied, setJustCopied] = React.useState(false);
  const [justUsed, setJustUsed] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll focused card into view
  React.useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isFocused]);

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1200);
      onCopy?.(prompt);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt.id, !prompt.is_favorite);
  };

  const handleUse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustUsed(true);
    setTimeout(() => setJustUsed(false), 600);
    onUse?.(prompt);
  };

  const folderBorderColor = safeColor(primaryFolder?.color);
  const images = prompt.images ?? [];
  const visibleTags = (tags ?? []).slice(0, 3);
  const extraTagCount = (tags ?? []).length - 3;

  if (variant === "compact") {
    return (
      <motion.div
        ref={cardRef}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
        transition={{ duration: 0.15, delay: prefersReducedMotion ? 0 : index * 0.03 }}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(prompt)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(prompt);
          }
        }}
        className={cn(
          "group relative rounded-xl border bg-card p-3 cursor-pointer transition-all duration-200",
          "hover:border-foreground/20 hover:bg-accent/30 hover:shadow-md",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isSelected && "ring-2 ring-primary border-primary",
          isFocused && "ring-2 ring-primary/50 border-primary/50"
        )}
        style={{
          borderLeftWidth: folderBorderColor ? 3 : undefined,
          borderLeftColor: folderBorderColor,
        }}
      >
        {/* Quick-use flash */}
        <AnimatePresence>
          {justUsed && !prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-xl bg-emerald-500/10 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium truncate">{prompt.name}</h3>
              <motion.button
                onClick={handleToggleFavorite}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.8 }}
                className="shrink-0"
                aria-label={prompt.is_favorite ? "Unfavorite" : "Favorite"}
              >
                <Heart
                  className={cn(
                    "size-3 transition-colors",
                    prompt.is_favorite
                      ? "text-red-500 fill-red-500"
                      : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"
                  )}
                />
              </motion.button>
            </div>
            {prompt.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {prompt.description}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyPrompt}
                    className="size-7 rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    aria-label="Copy prompt"
                  >
                    <AnimatePresence mode="wait">
                      {justCopied ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check className="size-3.5 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Copy className="size-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Copy prompt</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="size-7 rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
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
                    <Heart className={cn("size-3.5 mr-2", prompt.is_favorite && "fill-current")} />
                    {prompt.is_favorite ? "Unfavorite" : "Favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onShare && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(prompt); }}>
                      <Share2 className="size-3.5 mr-2" />
                      Share with user
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Prompt preview */}
        <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded-lg px-2 py-1.5 leading-relaxed">
          {prompt.prompt_text}
        </p>

        {/* Tag pills + metadata footer */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0 border"
                style={{
                  backgroundColor: safeColor(tag.color) ? `${safeColor(tag.color)}15` : undefined,
                  borderColor: safeColor(tag.color) ? `${safeColor(tag.color)}30` : undefined,
                  color: safeColor(tag.color),
                }}
              >
                {tag.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-[9px] text-muted-foreground shrink-0">
                +{extraTagCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {prompt.use_count > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal gap-1">
                <Sparkles className="size-2.5" aria-hidden="true" />
                {prompt.use_count}
              </Badge>
            )}
            {prompt.original_author_id && (
              <span className="text-[10px] text-muted-foreground">Shared</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // Full variant (Library page - grid or list)
  // ============================================

  if (viewMode === "list") {
    return (
      <motion.div
        ref={cardRef}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: prefersReducedMotion ? 0 : index * 0.02 }}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(prompt)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(prompt);
          }
        }}
        className={cn(
          "group relative rounded-xl border bg-card p-3 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-foreground/15 hover:bg-accent/20",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isSelected && "ring-2 ring-primary border-primary",
          isFocused && "ring-2 ring-primary/50"
        )}
        style={{
          borderLeftWidth: folderBorderColor ? 3 : undefined,
          borderLeftColor: folderBorderColor,
        }}
      >
        {/* Quick-use flash */}
        <AnimatePresence>
          {justUsed && !prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-xl bg-emerald-500/10 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          {/* Image thumbnail */}
          {images.length > 0 && (
            <div className="relative size-12 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={images[0].url}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight truncate">{prompt.name}</h3>
              {prompt.is_favorite && (
                <Heart className="size-3.5 text-red-500 fill-red-500 shrink-0" aria-label="Favorite" />
              )}
              {/* Tag pills inline */}
              {visibleTags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border"
                      style={{
                        backgroundColor: safeColor(tag.color) ? `${safeColor(tag.color)}15` : undefined,
                        borderColor: safeColor(tag.color) ? `${safeColor(tag.color)}30` : undefined,
                        color: safeColor(tag.color),
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {extraTagCount > 0 && (
                    <span className="text-[9px] text-muted-foreground">+{extraTagCount}</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-2.5 py-1.5 mt-1.5 line-clamp-1 leading-relaxed">
              {prompt.prompt_text}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 shrink-0">
            {prompt.use_count > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium gap-1">
                <Sparkles className="size-2.5 mr-1" aria-hidden="true" />
                Used {prompt.use_count}x
              </Badge>
            )}
            {prompt.original_author_id && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                Shared
              </Badge>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {onUse && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" onClick={handleUse} className="h-7 px-2">
                      <ExternalLink className="size-3.5 mr-1" />
                      Use
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Use in Create</TooltipContent>
                </Tooltip>
              )}
              <CardDropdownMenu
                prompt={prompt}
                onCopy={handleCopyPrompt}
                onToggleFavorite={handleToggleFavorite}
                onShare={onShare}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ============================================
  // Full variant - Grid mode
  // ============================================

  return (
    <motion.div
      ref={cardRef}
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
      transition={{ duration: 0.2, delay: prefersReducedMotion ? 0 : index * 0.03 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(prompt)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(prompt);
        }
      }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden flex flex-col cursor-pointer",
        "transition-shadow duration-200",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:z-10",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isSelected && "ring-2 ring-primary border-primary",
        isFocused && "ring-2 ring-primary/50"
      )}
      style={{
        borderLeftWidth: folderBorderColor ? 3 : undefined,
        borderLeftColor: folderBorderColor,
      }}
    >
      {/* Quick-use flash */}
      <AnimatePresence>
        {justUsed && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-emerald-500/10 pointer-events-none z-20"
          />
        )}
      </AnimatePresence>

      {/* Image section */}
      {images.length > 0 && (
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {images.length === 1 ? (
            <Image src={images[0].url} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : images.length === 2 ? (
            <div className="grid grid-cols-2 gap-0.5 h-full">
              {images.slice(0, 2).map((img: PromptImage) => (
                <div key={img.id} className="relative overflow-hidden">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 h-full">
              {images.slice(0, 3).map((img: PromptImage) => (
                <div key={img.id} className="relative overflow-hidden">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 33vw, 20vw" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons overlay */}
      {showActions && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onUse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" onClick={handleUse} className="h-7 px-2 shadow-sm">
                  <ExternalLink className="size-3.5 mr-1" />
                  Use
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use in Create</TooltipContent>
            </Tooltip>
          )}
          <CardDropdownMenu
            prompt={prompt}
            onCopy={handleCopyPrompt}
            onToggleFavorite={handleToggleFavorite}
            onShare={onShare}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold tracking-tight truncate">{prompt.name}</h3>
          <motion.button
            onClick={handleToggleFavorite}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.75 }}
            className="shrink-0 mt-0.5"
            aria-label={prompt.is_favorite ? "Unfavorite" : "Favorite"}
          >
            <Heart
              className={cn(
                "size-4 transition-colors",
                prompt.is_favorite
                  ? "text-red-500 fill-red-500"
                  : "text-muted-foreground/30 hover:text-red-400"
              )}
            />
          </motion.button>
        </div>

        {/* Description */}
        {prompt.description && (
          <p className="text-sm text-muted-foreground truncate mb-2 leading-tight">
            {prompt.description}
          </p>
        )}

        {/* Prompt preview */}
        <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 rounded-lg px-2.5 py-2 leading-relaxed">
          {prompt.prompt_text}
        </p>

        {/* Tag pills */}
        {visibleTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2.5 flex-wrap">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                style={{
                  backgroundColor: safeColor(tag.color) ? `${safeColor(tag.color)}15` : undefined,
                  borderColor: safeColor(tag.color) ? `${safeColor(tag.color)}30` : undefined,
                  color: safeColor(tag.color),
                }}
              >
                {tag.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-[10px] text-muted-foreground">+{extraTagCount}</span>
            )}
          </div>
        )}

        {/* Settings preview */}
        {prompt.settings && Object.keys(prompt.settings).length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {prompt.settings.model && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">
                {prompt.settings.model}
              </span>
            )}
            {prompt.settings.aspectRatio && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">
                {prompt.settings.aspectRatio}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-3">
          {prompt.use_count > 0 && (
            <Badge variant="outline" className="text-[10px] font-medium">
              <Sparkles className="size-2.5 mr-1" aria-hidden="true" />
              Used {prompt.use_count}x
            </Badge>
          )}
          {prompt.original_author_id && (
            <Badge variant="secondary" className="text-[10px] font-medium">
              Shared
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Card Dropdown Menu (shared between variants)
// ============================================

function CardDropdownMenu({
  prompt,
  onCopy,
  onToggleFavorite,
  onShare,
  onEdit,
  onDelete,
}: {
  prompt: Prompt;
  onCopy: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onShare?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}>
            <Pencil className="size-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="size-3.5 mr-2" />
          Copy prompt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleFavorite}>
          <Heart className={cn("size-3.5 mr-2", prompt.is_favorite && "fill-current")} />
          {prompt.is_favorite ? "Unfavorite" : "Favorite"}
        </DropdownMenuItem>
        {onShare && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(prompt); }}>
              <Share2 className="size-3.5 mr-2" />
              Share with user
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Compact Prompt Item (for quick select - kept for backward compat)
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
