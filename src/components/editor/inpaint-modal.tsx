"use client";

import * as React from "react";
import { useCreate } from "@/components/create/create-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Paintbrush, ChevronDown } from "lucide-react";
import { InpaintCanvas } from "./inpaint-canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InpaintModal() {
  const {
    inpaintSourceImage,
    setInpaintSourceImage,
    inpaint,
    availableApis,
    selectedApiId,
  } = useCreate();

  const [maskDataUrl, setMaskDataUrl] = React.useState<string | null>(null);
  const [inpaintPrompt, setInpaintPrompt] = React.useState("");
  const [canvasSize, setCanvasSize] = React.useState<{ w: number; h: number } | null>(null);
  const [inpaintApiId, setInpaintApiId] = React.useState<string | null>(null);

  const isOpen = !!inpaintSourceImage;

  // Sync inpaint API selector with the globally selected API when modal opens
  React.useEffect(() => {
    if (isOpen && selectedApiId) {
      setInpaintApiId(selectedApiId);
    }
  }, [isOpen, selectedApiId]);

  // Load source image to get actual dimensions, constrained by viewport
  React.useEffect(() => {
    if (!inpaintSourceImage?.url) {
      setCanvasSize(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxH = Math.min(512, Math.floor(window.innerHeight * 0.55));
      const maxW = 512;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      setCanvasSize({
        w: Math.round(img.naturalWidth * scale),
        h: Math.round(img.naturalHeight * scale),
      });
    };
    img.onerror = () => {
      const maxDim = Math.min(512, Math.floor(window.innerHeight * 0.55));
      setCanvasSize({ w: maxDim, h: maxDim });
    };
    img.src = inpaintSourceImage.url;
  }, [inpaintSourceImage?.url]);

  const handleClose = () => {
    setInpaintSourceImage(null);
    setMaskDataUrl(null);
    setInpaintPrompt("");
    setCanvasSize(null);
  };

  const handleInpaint = () => {
    if (!maskDataUrl || !inpaintPrompt.trim()) return;
    // Fire-and-forget: closes modal immediately, pending card appears in history
    inpaint(maskDataUrl, inpaintPrompt.trim(), inpaintApiId ?? undefined);
    setMaskDataUrl(null);
    setInpaintPrompt("");
  };

  const selectedApi = availableApis.find((a) => a.id === inpaintApiId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="size-4 text-rose-500" />
            Inpaint
          </DialogTitle>
          <DialogDescription>
            Paint over the area you want to modify, then describe what should replace it.
          </DialogDescription>
        </DialogHeader>

        {inpaintSourceImage && canvasSize && (
          <div className="flex gap-4">
            {/* Left: Canvas */}
            <div className="flex-1 min-w-0">
              <InpaintCanvas
                sourceImageUrl={inpaintSourceImage.url}
                onMaskChange={setMaskDataUrl}
                width={canvasSize.w}
                height={canvasSize.h}
              />
            </div>

            {/* Right: Controls */}
            <div className="flex flex-col gap-3 w-56 shrink-0">
              {/* Model selector */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Model</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="mt-1 w-full flex items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-foreground hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="truncate">{selectedApi?.name || "Select model"}</span>
                      <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {availableApis.map((api) => (
                      <DropdownMenuItem
                        key={api.id}
                        onClick={() => setInpaintApiId(api.id)}
                        className={api.id === inpaintApiId ? "bg-white/[0.08]" : ""}
                      >
                        {api.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Prompt</label>
                <textarea
                  value={inpaintPrompt}
                  onChange={(e) => setInpaintPrompt(e.target.value)}
                  placeholder="Describe what should appear in the painted area..."
                  rows={4}
                  className="mt-1 w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/[0.15]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto">
                <Button
                  size="sm"
                  onClick={handleInpaint}
                  disabled={!maskDataUrl || !inpaintPrompt.trim()}
                  className="w-full gap-2"
                >
                  <Paintbrush className="size-4" />
                  Inpaint
                </Button>
                <Button variant="outline" size="sm" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state while image dimensions are being detected */}
        {inpaintSourceImage && !canvasSize && (
          <div className="flex items-center justify-center py-12">
            <Loader className="size-6 text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
