"use client";

import * as React from "react";
import {
  Download,
  Image as ImageIcon,
  FileImage,
  Share2,
  Loader2,
  Link2,
  FolderArchive,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCreate } from "./create-context";
import { ShareCanvasDialog } from "./share-canvas-dialog";

interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className }: ExportMenuProps) {
  const { exportCanvasAsPng, exportCanvasAsJpeg, nodes, history } = useCreate();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isZipping, setIsZipping] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  const hasNodes = nodes.length > 0;
  const hasHistory = history.length > 0;

  const handleExportPng = async () => {
    if (!hasNodes) {
      toast.error("Canvas is empty");
      return;
    }

    setIsExporting(true);
    try {
      await exportCanvasAsPng();
      toast.success("Canvas exported as PNG");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export canvas");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJpeg = async () => {
    if (!hasNodes) {
      toast.error("Canvas is empty");
      return;
    }

    setIsExporting(true);
    try {
      await exportCanvasAsJpeg();
      toast.success("Canvas exported as JPEG");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export canvas");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllImages = async () => {
    if (!hasHistory) {
      toast.error("No images to export");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Download all images and add to ZIP
      await Promise.all(
        history.map(async (img, index) => {
          try {
            const response = await fetch(img.url);
            if (!response.ok) throw new Error(`Failed to fetch ${img.url}`);

            const blob = await response.blob();
            const extension = blob.type.split("/")[1] || "png";
            const filename = `image-${index + 1}-${img.id.slice(0, 8)}.${extension}`;

            zip.file(filename, blob);
          } catch (error) {
            console.error(`Failed to download image ${img.id}:`, error);
          }
        })
      );

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(content, `all-generations-${timestamp}.zip`);
      toast.success(`Exported ${history.length} images`);
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      toast.error("Failed to export images");
    } finally {
      setIsZipping(false);
    }
  };

  const isLoading = isExporting || isZipping;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={className}
            disabled={isLoading}
            aria-label="Export and share"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Share2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Export Canvas
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleExportPng}
            disabled={!hasNodes || isLoading}
            className="gap-2 font-mono text-xs"
          >
            <ImageIcon className="size-4" aria-hidden="true" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportJpeg}
            disabled={!hasNodes || isLoading}
            className="gap-2 font-mono text-xs"
          >
            <FileImage className="size-4" aria-hidden="true" />
            Export as JPEG
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Export Images
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleExportAllImages}
            disabled={!hasHistory || isLoading}
            className="gap-2 font-mono text-xs"
          >
            <FolderArchive className="size-4" aria-hidden="true" />
            Export All as ZIP
            {hasHistory && (
              <span className="ml-auto text-muted-foreground">
                {history.length}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Share
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setShareDialogOpen(true)}
            disabled={!hasNodes}
            className="gap-2 font-mono text-xs"
          >
            <Link2 className="size-4" aria-hidden="true" />
            Create Shareable Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Canvas Dialog (controlled) */}
      <ShareCanvasDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
}
