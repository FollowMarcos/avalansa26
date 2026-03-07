"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eraser, Paintbrush, RotateCcw, Minus, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InpaintCanvasProps {
  sourceImageUrl: string;
  onMaskChange: (maskDataUrl: string | null) => void;
  width: number;
  height: number;
}

interface Line {
  points: number[];
  strokeWidth: number;
  isEraser: boolean;
}

export function InpaintCanvas({
  sourceImageUrl,
  onMaskChange,
  width,
  height,
}: InpaintCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [brushSize, setBrushSize] = React.useState(30);
  const [isEraser, setIsEraser] = React.useState(false);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
  const currentLine = React.useRef<Line | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  // Load source image
  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      redraw();
    };
    img.src = sourceImageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImageUrl]);

  // Redraw everything
  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw source image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, width, height);
    }

    // Draw mask overlay
    for (const line of lines) {
      drawLine(ctx, line);
    }
    if (currentLine.current) {
      drawLine(ctx, currentLine.current);
    }
  }, [width, height, lines]);

  React.useEffect(() => {
    redraw();
  }, [redraw]);

  function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
    if (line.points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = line.isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = line.isEraser ? "rgba(0,0,0,1)" : "rgba(255, 50, 50, 0.5)";
    ctx.lineWidth = line.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(line.points[0], line.points[1]);
    for (let i = 2; i < line.points.length; i += 2) {
      ctx.lineTo(line.points[i], line.points[i + 1]);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Export mask as black/white image (white = inpaint area)
  const exportMask = React.useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const ctx = maskCanvas?.getContext("2d");
    if (!maskCanvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);
    // Fill black (keep area)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // Draw white where mask is painted (non-eraser lines)
    for (const line of lines) {
      if (line.isEraser) continue;
      ctx.save();
      ctx.strokeStyle = "white";
      ctx.lineWidth = line.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i + 1]);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Now "erase" the eraser lines (set back to black)
    for (const line of lines) {
      if (!line.isEraser) continue;
      ctx.save();
      ctx.strokeStyle = "black";
      ctx.lineWidth = line.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i + 1]);
      }
      ctx.stroke();
      ctx.restore();
    }

    const dataUrl = maskCanvas.toDataURL("image/png");
    onMaskChange(dataUrl);
  }, [lines, width, height, onMaskChange]);

  React.useEffect(() => {
    if (lines.length > 0) {
      exportMask();
    } else {
      onMaskChange(null);
    }
  }, [lines, exportMask, onMaskChange]);

  // Mouse/touch handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    currentLine.current = {
      points: [pos.x, pos.y],
      strokeWidth: brushSize,
      isEraser,
    };
    redraw();
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    // Track cursor for brush preview
    if ("touches" in e) {
      // Don't show preview for touch
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const displayScale = rect.width / width;
        setCursorPos({
          x: (e as React.MouseEvent).clientX - rect.left,
          y: (e as React.MouseEvent).clientY - rect.top,
        });
      }
    }
    if (!isDrawing || !currentLine.current) return;
    e.preventDefault();
    currentLine.current.points.push(pos.x, pos.y);
    redraw();
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentLine.current) return;
    setIsDrawing(false);
    setLines((prev) => [...prev, currentLine.current!]);
    currentLine.current = null;
  };

  const clearMask = () => {
    setLines([]);
    currentLine.current = null;
    redraw();
  };

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div
        className="relative rounded-lg overflow-hidden border border-border bg-muted/30"
        onMouseLeave={() => setCursorPos(null)}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-none touch-none"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {/* Brush preview cursor */}
        {cursorPos && (
          <div
            className="pointer-events-none absolute rounded-full border-2 transition-[width,height] duration-75"
            style={{
              width: `${brushSize * (canvasRef.current ? canvasRef.current.getBoundingClientRect().width / width : 1)}px`,
              height: `${brushSize * (canvasRef.current ? canvasRef.current.getBoundingClientRect().width / width : 1)}px`,
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: "translate(-50%, -50%)",
              borderColor: isEraser ? "rgba(255,255,255,0.7)" : "rgba(255,50,50,0.7)",
              backgroundColor: isEraser ? "rgba(255,255,255,0.1)" : "rgba(255,50,50,0.1)",
            }}
          />
        )}
        {/* Hidden canvas for mask export */}
        <canvas
          ref={maskCanvasRef}
          width={width}
          height={height}
          className="hidden"
        />
      </div>

      {/* Controls */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-3">
          {/* Brush / Eraser toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsEraser(false)}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-150",
                    !isEraser
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                  aria-label="Brush mode"
                >
                  <Paintbrush className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Brush</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsEraser(true)}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-150",
                    isEraser
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                  aria-label="Eraser mode"
                >
                  <Eraser className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Eraser</TooltipContent>
            </Tooltip>
          </div>

          {/* Brush size */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setBrushSize(Math.max(5, brushSize - 5))}
                  disabled={brushSize <= 5}
                  className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label="Decrease brush size"
                >
                  <Minus className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Smaller brush</TooltipContent>
            </Tooltip>
            <span className="text-xs tabular-nums w-8 text-center font-medium">{brushSize}px</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setBrushSize(Math.min(100, brushSize + 5))}
                  disabled={brushSize >= 100}
                  className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label="Increase brush size"
                >
                  <Plus className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Larger brush</TooltipContent>
            </Tooltip>
          </div>

          {/* Clear */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={clearMask}
                disabled={lines.length === 0}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Clear mask"
              >
                <RotateCcw className="size-3" />
                Clear
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Clear all strokes</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
