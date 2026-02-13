"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Images,
  Upload,
  CheckSquare,
  Search,
  ArrowUpDown,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { uploadReferenceImage } from "@/utils/supabase/storage";
import {
  getUserReferenceImages,
  createReferenceImageRecord,
  updateReferenceImage,
  deleteReferenceImage,
} from "@/utils/supabase/reference-images.server";
import type { ReferenceImageWithUrl } from "@/types/reference-image";
import { AssetCard } from "./asset-card";

type SortMode = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export function AssetsPage() {
  const [images, setImages] = React.useState<ReferenceImageWithUrl[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadCount, setUploadCount] = React.useState(0);
  const [uploadTotal, setUploadTotal] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Bulk selection
  const [isBulkMode, setIsBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Search and sort
  const [search, setSearch] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SortMode>("date-desc");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);

  // Load images on mount
  React.useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const userImages = await getUserReferenceImages();
      setImages(userImages);
      setIsLoading(false);
    };
    init();
  }, []);

  // Drag and drop handlers
  React.useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        handleUpload(files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpload = async (files: File[]) => {
    if (!userId || isUploading) return;

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("No image files selected");
      return;
    }

    setIsUploading(true);
    setUploadCount(0);
    setUploadTotal(imageFiles.length);

    const uploaded: ReferenceImageWithUrl[] = [];

    for (const file of imageFiles) {
      try {
        const result = await uploadReferenceImage(file, userId);

        if (result.error) {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
          setUploadCount((prev) => prev + 1);
          continue;
        }

        const record = await createReferenceImageRecord(
          result.path,
          file.name.replace(/\.[^/.]+$/, "")
        );

        if (record) {
          uploaded.push(record);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
      setUploadCount((prev) => prev + 1);
    }

    if (uploaded.length > 0) {
      setImages((prev) => [...uploaded, ...prev]);
      toast.success(
        `Uploaded ${uploaded.length} image${uploaded.length !== 1 ? "s" : ""}`
      );
    }

    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRename = async (id: string, name: string) => {
    const result = await updateReferenceImage(id, { name });
    if (result) {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, name } : img))
      );
      toast.success("Renamed");
    } else {
      toast.error("Failed to rename");
    }
  };

  const handleRequestDelete = (ids: string[]) => {
    setPendingDeleteIds(ids);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    let deleted = 0;

    for (const id of pendingDeleteIds) {
      const ok = await deleteReferenceImage(id);
      if (ok) {
        deleted++;
      }
    }

    if (deleted > 0) {
      setImages((prev) =>
        prev.filter((img) => !pendingDeleteIds.includes(img.id))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pendingDeleteIds) {
          next.delete(id);
        }
        return next;
      });
      toast.success(
        `Deleted ${deleted} image${deleted !== 1 ? "s" : ""}`
      );
    }

    if (deleted < pendingDeleteIds.length) {
      toast.error(
        `Failed to delete ${pendingDeleteIds.length - deleted} image${pendingDeleteIds.length - deleted !== 1 ? "s" : ""}`
      );
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitBulkMode = () => {
    setIsBulkMode(false);
    setSelectedIds(new Set());
  };

  // Filter and sort
  const filtered = React.useMemo(() => {
    let result = images;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((img) =>
        (img.name || "").toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sortMode) {
      case "date-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
      case "date-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;
      case "name-asc":
        sorted.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "")
        );
        break;
    }

    return sorted;
  }, [images, search, sortMode]);

  const sortLabel: Record<SortMode, string> = {
    "date-desc": "Newest",
    "date-asc": "Oldest",
    "name-asc": "Name A-Z",
    "name-desc": "Name Z-A",
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-balance">Assets</h1>
          <div className="flex items-center gap-2">
            {isBulkMode ? (
              <>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {selectedIds.size} selected
                </span>
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleRequestDelete(Array.from(selectedIds))
                    }
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Delete
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exitBulkMode}>
                  <X className="size-4 mr-1.5" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="asset-upload-input"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="size-4 mr-1.5" />
                  )}
                  {isUploading
                    ? `Uploading ${uploadCount}/${uploadTotal}`
                    : "Upload"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkMode(true)}
                  disabled={images.length === 0}
                >
                  <CheckSquare className="size-4 mr-1.5" />
                  Select
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and sort */}
        {images.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={"Search assets\u2026"}
                className="pl-9 h-9"
                aria-label="Search assets"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="size-3.5" />
                  {sortLabel[sortMode]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortMode("date-desc")}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("date-asc")}>
                  Oldest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("name-asc")}>
                  Name A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("name-desc")}>
                  Name Z-A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-xs text-muted-foreground tabular-nums ml-auto">
              {filtered.length} image{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="text-center max-w-sm mx-auto">
              <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <Images className="size-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1 text-balance">
                No assets yet
              </h2>
              <p className="text-sm text-muted-foreground mb-4 text-pretty">
                Upload reference images to use in your AI generations. Drag and
                drop or click to upload.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-1.5" />
                Upload Images
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[30vh]">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No images match &ldquo;{search}&rdquo;
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            {filtered.map((image) => (
              <AssetCard
                key={image.id}
                image={image}
                isBulkMode={isBulkMode}
                isSelected={selectedIds.has(image.id)}
                onSelect={() => toggleSelect(image.id)}
                onRename={handleRename}
                onDelete={(id) => handleRequestDelete([id])}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
          <div className="text-center">
            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
              <Upload className="size-10 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Drop images here
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload reference images to your assets
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDeleteIds.length}{" "}
              {pendingDeleteIds.length === 1 ? "image" : "images"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              {pendingDeleteIds.length === 1
                ? "this image"
                : "these images"}{" "}
              from your assets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-1.5" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
