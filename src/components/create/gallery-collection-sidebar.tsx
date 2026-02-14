"use client";

import * as React from "react";
import { Plus, FolderOpen, X, ChevronRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useCreate } from "./create-context";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
    addToCollection,
    history,
    imageOrganization,
  } = useCreate();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Drop state: track which collection is being dragged over
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const dragCounterRef = React.useRef<Map<string, number>>(new Map());

  // Export state
  const [exportingId, setExportingId] = React.useState<string | null>(null);

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

  // -- Native drop handlers --

  const handleDragEnter = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const count = (dragCounterRef.current.get(collectionId) ?? 0) + 1;
    dragCounterRef.current.set(collectionId, count);
    if (count === 1) setDragOverId(collectionId);
  };

  const handleDragLeave = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const count = (dragCounterRef.current.get(collectionId) ?? 1) - 1;
    dragCounterRef.current.set(collectionId, count);
    if (count <= 0) {
      dragCounterRef.current.delete(collectionId);
      if (dragOverId === collectionId) setDragOverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current.delete(collectionId);
    setDragOverId(null);

    const imageId = e.dataTransfer.getData("text/plain");
    if (!imageId) return;

    try {
      await addToCollection(imageId, collectionId);
      const collection = collections.find((c) => c.id === collectionId);
      toast.success(`Added to "${collection?.name}"`);
    } catch {
      toast.error("Failed to add to collection");
    }
  };

  // -- Export collection as ZIP --

  const handleExport = async (e: React.MouseEvent, collectionId: string) => {
    e.stopPropagation();
    setExportingId(collectionId);

    try {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) return;

      // Find images in this collection via imageOrganization map
      const collectionImages = history.filter((img) => {
        if (img.status !== "completed") return false;
        const org = imageOrganization.get(img.id);
        return org?.collectionIds.includes(collectionId) ?? false;
      });

      if (collectionImages.length === 0) {
        toast.error("No images in this collection");
        return;
      }

      const zip = new JSZip();

      // Add metadata
      const metadata = {
        collection: collection.name,
        exportedAt: new Date().toISOString(),
        imageCount: collectionImages.length,
        images: collectionImages.map((img) => ({
          id: img.id,
          prompt: img.prompt,
          model: img.settings.model,
          aspectRatio: img.settings.aspectRatio,
          imageSize: img.settings.imageSize,
          createdAt: new Date(img.timestamp).toISOString(),
        })),
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Fetch and add images
      await Promise.all(
        collectionImages.map(async (img, index) => {
          try {
            const response = await fetch(img.url);
            if (!response.ok) return;
            const blob = await response.blob();
            const extension = blob.type.split("/")[1] || "png";
            const filename = `${index + 1}-${img.id.slice(0, 8)}.${extension}`;
            zip.file(filename, blob);
          } catch {
            // Skip failed downloads
          }
        }),
      );

      const content = await zip.generateAsync({ type: "blob" });
      const safeName = collection.name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
      saveAs(content, `${safeName || "collection"}.zip`);
      toast.success(`Exported "${collection.name}" (${collectionImages.length} images)`);
    } catch {
      toast.error("Failed to export collection");
    } finally {
      setExportingId(null);
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
            <button
              key={collection.id}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors",
                "hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring",
                activeCollectionId === collection.id && "bg-muted font-medium",
                dragOverId === collection.id && "ring-2 ring-primary bg-primary/10",
              )}
              onClick={() => handleSelect(collection.id)}
              onDragEnter={(e) => handleDragEnter(e, collection.id)}
              onDragLeave={(e) => handleDragLeave(e, collection.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, collection.id)}
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
              <span className="truncate flex-1">{collection.name}</span>
              {/* Export button */}
              <span
                role="button"
                tabIndex={-1}
                className="opacity-0 group-hover:opacity-100 hover:!opacity-100 focus-visible:opacity-100 shrink-0 size-5 flex items-center justify-center rounded hover:bg-muted-foreground/10 transition-opacity"
                aria-label={`Export ${collection.name} as ZIP`}
                onClick={(e) => handleExport(e, collection.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExport(e as unknown as React.MouseEvent, collection.id);
                }}
              >
                {exportingId === collection.id ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-3 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
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
                placeholder="Collection name…"
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
