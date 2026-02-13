"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check, Download, Pencil, Trash2, MoreHorizontal, X } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ReferenceImageWithUrl } from "@/types/reference-image";

interface AssetCardProps {
  image: ReferenceImageWithUrl;
  isBulkMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
}

export function AssetCard({
  image,
  isBulkMode,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onDownload,
}: AssetCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(image.name || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayName = image.name || "Untitled";

  const handleStartRename = () => {
    setEditName(image.name || "");
    setIsEditing(true);
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== image.name) {
      onRename(image.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isBulkMode) {
      e.preventDefault();
      onSelect();
    }
  };

  const card = (
    <article
      onClick={handleClick}
      className={cn(
        "group relative rounded-xl overflow-hidden bg-muted border transition-shadow duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isBulkMode && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      tabIndex={0}
      role={isBulkMode ? "checkbox" : undefined}
      aria-checked={isBulkMode ? isSelected : undefined}
      aria-label={displayName}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <Image
          src={image.url}
          alt={displayName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />

        {/* Selection checkbox */}
        {isBulkMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={cn(
                "size-6 rounded-md border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background/80 border-border"
              )}
            >
              {isSelected && <Check className="size-4" />}
            </div>
          </div>
        )}

        {/* Hover actions */}
        {!isBulkMode && (
          <div
            className={cn(
              "absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200",
              "flex items-center justify-center gap-1",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartRename();
              }}
              className="size-9 rounded-lg bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Rename"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(image.url, displayName);
              }}
              className="size-9 rounded-lg bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Download"
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="size-9 rounded-lg bg-background/90 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-2.5 py-2 min-h-[36px]">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 text-xs bg-transparent border-b border-primary outline-none font-medium"
              aria-label="Image name"
            />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Cancel rename"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <p
            className="text-xs font-medium truncate text-foreground"
            onDoubleClick={handleStartRename}
            title={displayName}
          >
            {displayName}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(image.created_at))}
        </p>
      </div>
    </article>
  );

  if (isBulkMode) return card;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleStartRename}>
          <Pencil className="size-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDownload(image.url, displayName)}>
          <Download className="size-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(image.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
