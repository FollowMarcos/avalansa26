"use client";

import * as React from "react";
import { Plus, FolderOpen, X, ChevronRight, Download, MoreVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useCreate } from "./create-context";
import type { Collection } from "@/types/generation";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ---------------------------------------------------------------------------
// Droppable collection item
// ---------------------------------------------------------------------------

function DroppableCollectionItem({
  collection,
  isActive,
  isExporting,
  exportProgress,
  onClick,
  onExport,
  onDrop,
}: {
  collection: Collection;
  isActive: boolean;
  isExporting: boolean;
  exportProgress: number;
  onClick: () => void;
  onExport: () => void;
  onDrop: (imageIds: string[]) => void;
}) {
  const [isOver, setIsOver] = React.useState(false);
  const dragCounter = React.useRef(0);

  return (
    <div
      className="group relative"
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current++;
        setIsOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        dragCounter.current--;
        if (dragCounter.current === 0) setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsOver(false);
        const data = e.dataTransfer.getData("application/x-image-ids");
        if (data) {
          try {
            const ids = JSON.parse(data) as string[];
            onDrop(ids);
          } catch {
            /* ignore malformed data */
          }
        }
      }}
    >
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all",
          "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
          isActive && "bg-muted font-medium",
          isOver && "bg-primary/20 ring-2 ring-primary scale-[1.02]",
        )}
        onClick={onClick}
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
        <span className="truncate flex-1 text-left">{collection.name}</span>
        {isExporting && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {exportProgress}%
          </span>
        )}
        {isActive && !isExporting && (
          <ChevronRight className="size-3 ml-auto text-muted-foreground shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Collection actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-0.5 right-0.5 size-6",
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
              "transition-opacity",
            )}
            disabled={isExporting}
            aria-label={`Options for ${collection.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="size-3" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-3.5 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-3.5 mr-2" aria-hidden="true" />
            )}
            Export as ZIP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar
// ---------------------------------------------------------------------------

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
    history,
    imageOrganization,
    addToCollection,
    bulkAddToCollection,
  } = useCreate();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Export state
  const [exportingId, setExportingId] = React.useState<string | null>(null);
  const [exportProgress, setExportProgress] = React.useState(0);

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

  const handleDropToCollection = async (collectionId: string, imageIds: string[]) => {
    try {
      if (imageIds.length === 1) {
        await addToCollection(imageIds[0], collectionId);
        toast.success("Added to collection");
      } else {
        await bulkAddToCollection(imageIds, collectionId);
        toast.success(`Added ${imageIds.length} images to collection`);
      }
    } catch {
      toast.error("Failed to add to collection");
    }
  };

  const handleExportCollection = async (collection: Collection) => {
    setExportingId(collection.id);
    setExportProgress(0);

    try {
      const imagesInCollection = history.filter(img => {
        const org = imageOrganization.get(img.id);
        return org?.collectionIds.includes(collection.id);
      });

      if (imagesInCollection.length === 0) {
        toast.info("No images in this collection");
        setExportingId(null);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(collection.name);

      const metadata = {
        collectionName: collection.name,
        exportDate: new Date().toISOString(),
        imageCount: imagesInCollection.length,
        images: [] as Array<{
          filename: string;
          prompt: string;
          timestamp: number;
          settings: Record<string, unknown>;
          isFavorite: boolean;
        }>,
      };

      let completed = 0;
      await Promise.all(
        imagesInCollection.map(async (img, index) => {
          try {
            const response = await fetch(img.url);
            if (!response.ok) throw new Error(`Failed to fetch ${img.url}`);

            const blob = await response.blob();
            const extension = blob.type.split("/")[1] || "png";
            const filename = `${index + 1}-${img.id.slice(0, 8)}.${extension}`;

            folder?.file(filename, blob);

            metadata.images.push({
              filename,
              prompt: img.prompt,
              timestamp: img.timestamp,
              settings: img.settings as unknown as Record<string, unknown>,
              isFavorite: img.isFavorite ?? false,
            });

            completed++;
            setExportProgress(Math.round((completed / imagesInCollection.length) * 100));
          } catch (error) {
            console.error(`Failed to download image ${img.id}:`, error);
          }
        })
      );

      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(content, `${collection.name}-${timestamp}.zip`);
      toast.success(`Exported ${completed} images from "${collection.name}"`);
    } catch (error) {
      console.error("Failed to export collection:", error);
      toast.error("Failed to export collection");
    } finally {
      setExportingId(null);
      setExportProgress(0);
    }
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
            <DroppableCollectionItem
              key={collection.id}
              collection={collection}
              isActive={activeCollectionId === collection.id}
              isExporting={exportingId === collection.id}
              exportProgress={exportProgress}
              onClick={() => handleSelect(collection.id)}
              onExport={() => handleExportCollection(collection)}
              onDrop={(ids) => handleDropToCollection(collection.id, ids)}
            />
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
                placeholder={"Collection name\u2026"}
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
