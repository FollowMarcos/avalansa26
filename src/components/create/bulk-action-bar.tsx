"use client";

import * as React from "react";
import { Download, Trash2, X, Loader2, CheckSquare, Square } from "lucide-react";
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
  } = useCreate();

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  const selectedCount = galleryFilterState.bulkSelection.selectedIds.size;
  const filteredHistory = getFilteredHistory();
  const allSelected = selectedCount === filteredHistory.length && filteredHistory.length > 0;

  if (!galleryFilterState.bulkSelection.enabled) {
    return null;
  }

  const handleDownloadAll = async () => {
    if (selectedCount === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      const selectedImages = history.filter((img) =>
        galleryFilterState.bulkSelection.selectedIds.has(img.id)
      );

      // Download each image and add to ZIP
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

      // Generate and download ZIP
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
      const selectedIds = Array.from(galleryFilterState.bulkSelection.selectedIds);
      await bulkDeleteImages(selectedIds);
      toast.success(`Deleted ${selectedIds.length} images`);
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
