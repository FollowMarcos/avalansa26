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
import { Paintbrush } from "lucide-react";
import { InpaintCanvas } from "./inpaint-canvas";
import { toast } from "sonner";

export function InpaintModal() {
  const {
    inpaintSourceImage,
    setInpaintSourceImage,
    isInpainting,
    inpaint,
  } = useCreate();

  const [maskDataUrl, setMaskDataUrl] = React.useState<string | null>(null);
  const [inpaintPrompt, setInpaintPrompt] = React.useState("");

  const isOpen = !!inpaintSourceImage;

  const handleClose = () => {
    if (isInpainting) return;
    setInpaintSourceImage(null);
    setMaskDataUrl(null);
    setInpaintPrompt("");
  };

  const handleInpaint = async () => {
    if (!maskDataUrl || !inpaintPrompt.trim()) return;
    try {
      await inpaint(maskDataUrl, inpaintPrompt.trim());
      toast.success("Inpainting complete!");
      setMaskDataUrl(null);
      setInpaintPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Inpainting failed");
    }
  };

  // Canvas dimensions (fit within modal, maintain aspect ratio)
  const canvasWidth = 512;
  const canvasHeight = 512;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="size-4 text-rose-500" />
            Inpaint
          </DialogTitle>
          <DialogDescription>
            Paint over the area you want to modify, then describe what should replace it.
          </DialogDescription>
        </DialogHeader>

        {inpaintSourceImage && (
          <div className="space-y-4">
            <InpaintCanvas
              sourceImageUrl={inpaintSourceImage.url}
              onMaskChange={setMaskDataUrl}
              width={canvasWidth}
              height={canvasHeight}
            />

            {/* Prompt */}
            <textarea
              value={inpaintPrompt}
              onChange={(e) => setInpaintPrompt(e.target.value)}
              placeholder="Describe what should appear in the painted area..."
              rows={2}
              className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/[0.15]"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={isInpainting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInpaint}
                disabled={!maskDataUrl || !inpaintPrompt.trim() || isInpainting}
                className="gap-2"
              >
                {isInpainting ? (
                  <>
                    <Loader className="size-4" />
                    Inpainting...
                  </>
                ) : (
                  <>
                    <Paintbrush className="size-4" />
                    Inpaint
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
