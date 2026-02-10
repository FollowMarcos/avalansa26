"use client";

import * as React from "react";
import { Plus, FolderOpen, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreate } from "./create-context";
import type { Collection } from "@/types/generation";

interface CollectionSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CollectionSidebar({ open, onClose }: CollectionSidebarProps) {
  const {
    collections,
    createCollection,
    galleryFilterState,
    setGalleryFilters,
  } = useCreate();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activeCollectionId = galleryFilterState.filters.collectionId;

  React.useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createCollection(name);
    setNewName("");
    setIsCreating(false);
  };

  const handleSelect = (id: string | null) => {
    setGalleryFilters({ collectionId: id === activeCollectionId ? null : id });
  };

  if (!open) return null;

  return (
    <div className="w-56 border-r border-border bg-background shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <h3 className="text-xs font-medium">Collections</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setIsCreating(true)}
            aria-label="Create collection"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* All Images (clear filter) */}
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors",
              "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
              !activeCollectionId && "bg-muted font-medium",
            )}
            onClick={() => handleSelect(null)}
          >
            <FolderOpen className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="truncate">All Images</span>
          </button>

          {/* Collection list */}
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors",
                "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
                activeCollectionId === collection.id && "bg-muted font-medium",
              )}
              onClick={() => handleSelect(collection.id)}
            >
              {collection.color ? (
                <div
                  className="size-3.5 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: collection.color }}
                  aria-hidden="true"
                />
              ) : (
                <FolderOpen
                  className="size-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{collection.name}</span>
              {activeCollectionId === collection.id && (
                <ChevronRight className="size-3 ml-auto text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          ))}

          {/* Create inline */}
          {isCreating && (
            <form
              className="px-1 py-1"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <Input
                ref={inputRef}
                type="text"
                name="collection-name"
                autoComplete="off"
                placeholder="Collection name\u2026"
                aria-label="New collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => {
                  if (!newName.trim()) setIsCreating(false);
                }}
                className="h-7 text-xs font-mono"
              />
            </form>
          )}

          {/* Empty state */}
          {collections.length === 0 && !isCreating && (
            <p className="px-2.5 py-4 text-[10px] text-muted-foreground text-center">
              No collections yet.
              <br />
              Create one to organize your images.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
