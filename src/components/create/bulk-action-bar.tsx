"use client";

import * as React from "react";
import { Download, Trash2, X, Loader2, CheckSquare, Square, FolderPlus, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCreate } from "./create-context";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export function BulkActionBar() {
  const {
    galleryFilterState,
    toggleBulkSelection,
    deselectAllImages,
    selectAllImages,
    bulkDeleteImages,
    getFilteredHistory,
    history,
    collections,
    tags,
    bulkAddToCollection,
    bulkAddTag,
    createCollection,
    createTag,
  } = useCreate();

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  // Batch assignment state
  const [collectionPopoverOpen, setCollectionPopoverOpen] = React.useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = React.useState(false);
  const [collectionSearch, setCollectionSearch] = React.useState("");
  const [tagSearch, setTagSearch] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);

  const selectedCount = galleryFilterState.bulkSelection.selectedIds.size;
  const filteredHistory = getFilteredHistory();
  const allSelected = selectedCount === filteredHistory.length && filteredHistory.length > 0;

  if (!galleryFilterState.bulkSelection.enabled) {
    return null;
  }

  const getSelectedIds = () => Array.from(galleryFilterState.bulkSelection.selectedIds);

  const handleDownloadAll = async () => {
    if (selectedCount === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      const selectedImages = history.filter((img) =>
        galleryFilterState.bulkSelection.selectedIds.has(img.id)
      );

      let completed = 0;
      await Promise.all(
        selectedImages.map(async (img, index) => {
          try {
            const response = await fetch(img.url);
            if (!response.ok) throw new Error(`Failed to fetch ${img.url}`);

            const blob = await response.blob();
            const extension = blob.type.split("/")[1] || "png";
            const filename = `image-${index + 1}-${img.id.slice(0, 8)}.${extension}`;

            zip.file(filename, blob);
            completed++;
            setDownloadProgress(Math.round((completed / selectedImages.length) * 100));
          } catch (error) {
            console.error(`Failed to download image ${img.id}:`, error);
          }
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(content, `generations-${timestamp}.zip`);
      toast.success(`Downloaded ${selectedCount} images`);
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      toast.error("Failed to download images");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDeleteAll = async () => {
    if (selectedCount === 0) return;

    setIsDeleting(true);
    try {
      await bulkDeleteImages(getSelectedIds());
      toast.success(`Deleted ${selectedCount} images`);
    } catch (error) {
      console.error("Failed to delete images:", error);
      toast.error("Failed to delete images");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      deselectAllImages();
    } else {
      selectAllImages();
    }
  };

  // -- Batch collection assignment --

  const handleBulkAddToCollection = async (collectionId: string) => {
    if (selectedCount === 0) return;
    setIsAssigning(true);
    try {
      await bulkAddToCollection(getSelectedIds(), collectionId);
      const collection = collections.find(c => c.id === collectionId);
      toast.success(`Added ${selectedCount} images to "${collection?.name}"`);
      setCollectionPopoverOpen(false);
      setCollectionSearch("");
    } catch (error) {
      console.error("Failed to add images to collection:", error);
      toast.error("Failed to add to collection");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateAndAddCollection = async () => {
    const name = collectionSearch.trim();
    if (!name || selectedCount === 0) return;
    setIsAssigning(true);
    try {
      const collection = await createCollection(name);
      if (collection) {
        await bulkAddToCollection(getSelectedIds(), collection.id);
        toast.success(`Created "${name}" and added ${selectedCount} images`);
        setCollectionPopoverOpen(false);
        setCollectionSearch("");
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setIsAssigning(false);
    }
  };

  // -- Batch tag assignment --

  const handleBulkAddTag = async (tagId: string) => {
    if (selectedCount === 0) return;
    setIsAssigning(true);
    try {
      await bulkAddTag(getSelectedIds(), tagId);
      const tag = tags.find(t => t.id === tagId);
      toast.success(`Added tag "${tag?.name}" to ${selectedCount} images`);
      setTagPopoverOpen(false);
      setTagSearch("");
    } catch (error) {
      console.error("Failed to add tag to images:", error);
      toast.error("Failed to add tag");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateAndAddTag = async () => {
    const name = tagSearch.trim();
    if (!name || selectedCount === 0) return;
    setIsAssigning(true);
    try {
      const tag = await createTag(name);
      if (tag) {
        await bulkAddTag(getSelectedIds(), tag.id);
        toast.success(`Created tag "${name}" and added to ${selectedCount} images`);
        setTagPopoverOpen(false);
        setTagSearch("");
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(collectionSearch.toLowerCase())
  );
  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );
  const showCreateCollection =
    collectionSearch.trim() &&
    !collections.some(c => c.name.toLowerCase() === collectionSearch.trim().toLowerCase());
  const showCreateTag =
    tagSearch.trim() &&
    !tags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase());

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg">
        {/* Select All Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 font-mono text-sm"
          onClick={handleSelectAllToggle}
        >
          {allSelected ? (
            <CheckSquare className="size-4" aria-hidden="true" />
          ) : (
            <Square className="size-4" aria-hidden="true" />
          )}
          {allSelected ? "Deselect all" : "Select all"}
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Selection count */}
        <span className="font-mono text-sm tabular-nums text-muted-foreground min-w-[80px]">
          {selectedCount} selected
        </span>

        <div className="w-px h-6 bg-border" />

        {/* Download button */}
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-2 font-mono text-sm"
          onClick={handleDownloadAll}
          disabled={selectedCount === 0 || isDownloading}
        >
          {isDownloading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span className="tabular-nums">{downloadProgress}%</span>
            </span>
          ) : (
            <>
              <Download className="size-4" aria-hidden="true" />
              Download ZIP
            </>
          )}
        </Button>

        {/* Add to Collection */}
        <Popover open={collectionPopoverOpen} onOpenChange={setCollectionPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-2 font-mono text-sm"
              disabled={selectedCount === 0 || isAssigning}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              Collection
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="center" side="top">
            <Command>
              <CommandInput
                placeholder="Search or create..."
                value={collectionSearch}
                onValueChange={setCollectionSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {showCreateCollection ? (
                    <button
                      type="button"
                      className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                      onClick={handleCreateAndAddCollection}
                      disabled={isAssigning}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Create &ldquo;{collectionSearch.trim()}&rdquo;
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No collections found</span>
                  )}
                </CommandEmpty>
                {filteredCollections.length > 0 && (
                  <CommandGroup heading="Collections">
                    {filteredCollections.map((collection) => (
                      <CommandItem
                        key={collection.id}
                        value={collection.name}
                        onSelect={() => handleBulkAddToCollection(collection.id)}
                        disabled={isAssigning}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="size-3 rounded-sm shrink-0"
                          style={{ backgroundColor: collection.color || "var(--muted)" }}
                        />
                        <span className="font-mono text-xs flex-1 truncate">{collection.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {showCreateCollection && filteredCollections.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateAndAddCollection}
                        disabled={isAssigning}
                        className="flex items-center gap-2"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span className="text-xs">Create &ldquo;{collectionSearch.trim()}&rdquo;</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Add Tags */}
        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-2 font-mono text-sm"
              disabled={selectedCount === 0 || isAssigning}
            >
              <Tag className="size-4" aria-hidden="true" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="center" side="top">
            <Command>
              <CommandInput
                placeholder="Search or create tag..."
                value={tagSearch}
                onValueChange={setTagSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {showCreateTag ? (
                    <button
                      type="button"
                      className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                      onClick={handleCreateAndAddTag}
                      disabled={isAssigning}
                    >
                      <Tag className="size-4" aria-hidden="true" />
                      Create &ldquo;{tagSearch.trim()}&rdquo;
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No tags found</span>
                  )}
                </CommandEmpty>
                {filteredTags.length > 0 && (
                  <CommandGroup heading="Tags">
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleBulkAddTag(tag.id)}
                        disabled={isAssigning}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="size-3 rounded-full border shrink-0"
                          style={{
                            backgroundColor: tag.color || "transparent",
                            borderColor: tag.color || "currentColor",
                          }}
                        />
                        <span className="font-mono text-xs flex-1 truncate">{tag.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {showCreateTag && filteredTags.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateAndAddTag}
                        disabled={isAssigning}
                        className="flex items-center gap-2"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span className="text-xs">Create &ldquo;{tagSearch.trim()}&rdquo;</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 gap-2 font-mono text-sm"
              disabled={selectedCount === 0 || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} images?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected images will be permanently
                deleted from your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
              >
                Delete {selectedCount} images
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="w-px h-6 bg-border" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={toggleBulkSelection}
          aria-label="Cancel selection"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
