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
import { Loader } from "@/components/ui/loader";
import { Paintbrush, ChevronDown } from "lucide-react";
import { InpaintCanvas } from "./inpaint-canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

  React.useEffect(() => {
    if (isOpen && selectedApiId) {
      setInpaintApiId(selectedApiId);
    }
  }, [isOpen, selectedApiId]);

  React.useEffect(() => {
    if (!inpaintSourceImage?.url) {
      setCanvasSize(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = 512;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      setCanvasSize({
        w: Math.round(img.naturalWidth * scale),
        h: Math.round(img.naturalHeight * scale),
      });
    };
    img.onerror = () => {
      setCanvasSize({ w: 512, h: 512 });
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
    inpaint(maskDataUrl, inpaintPrompt.trim(), inpaintApiId ?? undefined);
    setMaskDataUrl(null);
    setInpaintPrompt("");
  };

  const selectedApi = availableApis.find((a) => a.id === inpaintApiId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] rounded-none bg-[var(--void)] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--nerv-orange)] uppercase tracking-[0.1em] text-sm font-[family-name:var(--font-ibm-plex-mono)]">
            <Paintbrush className="size-4 text-[var(--alert-red)]" style={{ filter: "drop-shadow(0 0 4px rgba(255, 72, 64, 0.4))" }} />
            <span className="glow-orange">INPAINT OPERATION</span>
            <span className="text-[8px] tracking-[0.1em] text-[var(--steel-dim)] font-[family-name:var(--font-noto-sans-jp)] ml-1">
              塗り替え
            </span>
          </DialogTitle>
          <DialogDescription className="text-[var(--steel-dim)] text-xs uppercase tracking-[0.05em] font-[family-name:var(--font-ibm-plex-mono)]">
            Paint over the target area, then specify replacement parameters.
          </DialogDescription>
        </DialogHeader>

        {inpaintSourceImage && canvasSize && (
          <div className="flex gap-4" style={{ maxHeight: 'calc(85vh - 130px)' }}>
            {/* Left: Canvas */}
            <div className="flex-1 min-w-0 min-h-0">
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
                <label className="text-[10px] font-medium text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em] font-[family-name:var(--font-ibm-plex-mono)]">MODEL</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="mt-1 w-full flex items-center justify-between gap-2 border border-[var(--nerv-orange-dim)]/40 bg-[var(--void)] px-2.5 py-1.5 text-xs text-[var(--data-green)] hover:bg-[var(--nerv-orange)]/10 transition-colors font-[family-name:var(--font-ibm-plex-mono)]"
                    >
                      <span className="truncate">{selectedApi?.name || "SELECT MODEL"}</span>
                      <ChevronDown className="size-3 text-[var(--nerv-orange-dim)] shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 rounded-none bg-[var(--void)] border-[var(--nerv-orange-dim)]/40 border-t-2 border-t-[var(--nerv-orange)]">
                    {availableApis.map((api) => (
                      <DropdownMenuItem
                        key={api.id}
                        onClick={() => setInpaintApiId(api.id)}
                        className={cn(
                          "rounded-none text-[11px] tracking-wide text-[var(--nerv-orange)] hover:bg-[var(--nerv-orange)]/10",
                          api.id === inpaintApiId && "bg-[var(--nerv-orange)]/10"
                        )}
                      >
                        {api.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-[10px] font-medium text-[var(--nerv-orange-dim)] uppercase tracking-[0.12em] font-[family-name:var(--font-ibm-plex-mono)]">PROMPT</label>
                <textarea
                  value={inpaintPrompt}
                  onChange={(e) => setInpaintPrompt(e.target.value)}
                  placeholder={"Describe replacement content..."}
                  rows={4}
                  className="mt-1 w-full resize-none border border-[var(--nerv-orange-dim)]/40 bg-[var(--void)] px-3 py-2 text-sm text-[var(--data-green)] font-[family-name:var(--font-ibm-plex-mono)] placeholder:text-[var(--steel-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nerv-orange)]/50"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={handleInpaint}
                  disabled={!maskDataUrl || !inpaintPrompt.trim()}
                  className={cn(
                    "w-full h-9 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-100 border font-[family-name:var(--font-ibm-plex-mono)]",
                    maskDataUrl && inpaintPrompt.trim()
                      ? "bg-[var(--alert-red)] text-[var(--void)] border-[var(--alert-red)] hover:bg-[var(--alert-red-hot)]"
                      : "bg-[var(--void)] text-[var(--alert-red-dim)] border-[var(--alert-red-dim)]/40 opacity-40 cursor-not-allowed"
                  )}
                >
                  <Paintbrush className="size-4" />
                  INPAINT
                </button>
                <button
                  onClick={handleClose}
                  className="w-full h-9 flex items-center justify-center text-xs font-medium uppercase tracking-[0.08em] border border-[var(--steel-dim)]/40 text-[var(--steel-dim)] hover:bg-[var(--steel-faint)] hover:text-[var(--steel)] transition-colors font-[family-name:var(--font-ibm-plex-mono)]"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {inpaintSourceImage && !canvasSize && (
          <div className="flex items-center justify-center py-12">
            <Loader className="size-6 text-[var(--nerv-orange)]" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
