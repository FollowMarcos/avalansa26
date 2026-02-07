"use client";

import * as React from "react";
import {
  Download,
  Loader2,
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCreate } from "./create-context";

interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className }: ExportMenuProps) {
  const { history } = useCreate();
  const [isZipping, setIsZipping] = React.useState(false);

  const hasHistory = history.length > 0;

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
          if (img.status === "pending" || img.status === "failed" || !img.url) return;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          disabled={isZipping}
          aria-label="Export images"
        >
          {isZipping ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Export Images
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={handleExportAllImages}
          disabled={!hasHistory || isZipping}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
