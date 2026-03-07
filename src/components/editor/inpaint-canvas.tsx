"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Hand,
  Minus,
  Paintbrush,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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

type Tool = "brush" | "eraser" | "pan";

export function InpaintCanvas({
  sourceImageUrl,
  onMaskChange,
  width,
  height,
}: InpaintCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [brushSize, setBrushSize] = React.useState(30);
  const [tool, setTool] = React.useState<Tool>("brush");
  const [lines, setLines] = React.useState<Line[]>([]);
  const [redoStack, setRedoStack] = React.useState<Line[]>([]);
  const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
  const currentLine = React.useRef<Line | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Zoom & pan
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const panRef = React.useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  // Space-held = temporary pan mode
  const [spaceHeld, setSpaceHeld] = React.useState(false);

  const activeTool = spaceHeld ? "pan" : tool;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in textarea/input
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;

      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "b" || e.key === "B") setTool("brush");
      if (e.key === "e" || e.key === "E") setTool("eraser");
      if (e.key === "h" || e.key === "H") setTool("pan");
      if (e.key === "[") setBrushSize((s) => Math.max(5, s - 5));
      if (e.key === "]") setBrushSize((s) => Math.min(100, s + 5));
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setSpaceHeld(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  // Load source image
  React.useEffect(() => {
    setImageLoaded(false);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = sourceImageUrl;
  }, [sourceImageUrl]);

  // Redraw canvas
  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (imageRef.current && imageLoaded) {
      ctx.drawImage(imageRef.current, 0, 0, width, height);
    }

    for (const line of lines) {
      drawLine(ctx, line);
    }
    if (currentLine.current) {
      drawLine(ctx, currentLine.current);
    }
  }, [width, height, lines, imageLoaded]);

  React.useEffect(() => {
    redraw();
  }, [redraw]);

  function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
    if (line.points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = line.isEraser
      ? "destination-out"
      : "source-over";
    // Bright yellow-green for mask, matching reference UI
    ctx.strokeStyle = line.isEraser
      ? "rgba(0,0,0,1)"
      : "rgba(200, 255, 0, 0.55)";
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

  // Export mask
  const exportMask = React.useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const ctx = maskCanvas?.getContext("2d");
    if (!maskCanvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

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

  // Undo / Redo
  const undo = () => {
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    setRedoStack((prev) => [...prev, last]);
    setLines((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const line = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setLines((prev) => [...prev, line]);
  };

  // Convert screen coords to canvas coords (accounts for CSS zoom/pan)
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

  // Get raw screen position relative to the overflow container
  const getScreenPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    if (activeTool === "pan") {
      const sp = getScreenPos(e);
      panRef.current = {
        isPanning: true,
        startX: sp.x,
        startY: sp.y,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      return;
    }

    setIsDrawing(true);
    const pos = getPos(e);
    currentLine.current = {
      points: [pos.x, pos.y],
      strokeWidth: brushSize,
      isEraser: activeTool === "eraser",
    };
    redraw();
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    // Track cursor for brush preview (screen-space)
    if (!("touches" in e)) {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCursorPos({
          x: (e as React.MouseEvent).clientX - rect.left,
          y: (e as React.MouseEvent).clientY - rect.top,
        });
      }
    }

    if (panRef.current.isPanning) {
      const sp = getScreenPos(e);
      setPan({
        x: panRef.current.startPanX + (sp.x - panRef.current.startX),
        y: panRef.current.startPanY + (sp.y - panRef.current.startY),
      });
      return;
    }

    if (!isDrawing || !currentLine.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentLine.current.points.push(pos.x, pos.y);
    redraw();
  };

  const handlePointerUp = () => {
    if (panRef.current.isPanning) {
      panRef.current.isPanning = false;
      return;
    }
    if (!isDrawing || !currentLine.current) return;
    const finishedLine = currentLine.current;
    currentLine.current = null;
    setIsDrawing(false);
    setLines((prev) => [...prev, finishedLine]);
    // Clear redo stack on new stroke
    setRedoStack([]);
  };

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(5, Math.max(0.5, +(prev + delta).toFixed(2))));
  };

  const clearMask = () => {
    setLines([]);
    setRedoStack([]);
    currentLine.current = null;
    redraw();
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomPercent = Math.round(zoom * 100);
  const showBrushCursor = activeTool !== "pan" && cursorPos;

  // Compute display-space brush size for the cursor overlay
  const displayBrushSize = React.useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return brushSize;
    const rect = canvas.getBoundingClientRect();
    return brushSize * (rect.width / width);
  }, [brushSize, width, zoom]);

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Canvas viewport — takes remaining space */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 rounded-t-lg overflow-hidden border border-white/[0.06] bg-black/40 flex items-center justify-center"
        style={{
          cursor: activeTool === "pan" ? "grab" : "none",
        }}
        onMouseLeave={() => setCursorPos(null)}
        onWheel={handleWheel}
      >
        {/* Zoomable/pannable layer */}
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="max-w-full max-h-full touch-none"
            style={{ aspectRatio: `${width}/${height}`, display: "block" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>

        {/* Brush preview cursor */}
        {showBrushCursor && (
          <div
            className="pointer-events-none absolute rounded-full border-2 transition-[width,height] duration-75"
            style={{
              width: `${displayBrushSize}px`,
              height: `${displayBrushSize}px`,
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: "translate(-50%, -50%)",
              borderColor:
                activeTool === "eraser"
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(200,255,0,0.7)",
              backgroundColor:
                activeTool === "eraser"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(200,255,0,0.1)",
            }}
          />
        )}

        {/* Zoom badge */}
        {zoom !== 1 && (
          <button
            type="button"
            onClick={resetView}
            className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] tabular-nums text-white/70 hover:text-white hover:bg-black/80 transition-colors"
          >
            {zoomPercent}%
          </button>
        )}

        {/* Hidden mask canvas */}
        <canvas
          ref={maskCanvasRef}
          width={width}
          height={height}
          className="hidden"
        />
      </div>

      {/* Toolbar — attached to bottom of canvas */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-b-lg border border-t-0 border-white/[0.06] bg-white/[0.03] shrink-0">
          {/* Tool group: brush, eraser, pan */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/[0.04]">
            <ToolBtn
              icon={Paintbrush}
              active={tool === "brush"}
              onClick={() => setTool("brush")}
              tooltip="Brush (B)"
            />
            <ToolBtn
              icon={Eraser}
              active={tool === "eraser"}
              onClick={() => setTool("eraser")}
              tooltip="Eraser (E)"
            />
            <ToolBtn
              icon={Hand}
              active={tool === "pan"}
              onClick={() => setTool("pan")}
              tooltip="Pan (H / Space)"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.08] mx-1" />

          {/* Brush size */}
          <div className="flex items-center gap-1">
            <ToolBtn
              icon={Minus}
              onClick={() => setBrushSize(Math.max(5, brushSize - 5))}
              disabled={brushSize <= 5}
              tooltip="Smaller brush ([)"
            />
            <span className="text-[10px] tabular-nums w-7 text-center font-medium text-muted-foreground">
              {brushSize}
            </span>
            <ToolBtn
              icon={Plus}
              onClick={() => setBrushSize(Math.min(100, brushSize + 5))}
              disabled={brushSize >= 100}
              tooltip="Larger brush (])"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.08] mx-1" />

          {/* Undo / Redo */}
          <ToolBtn
            icon={Undo2}
            onClick={undo}
            disabled={lines.length === 0}
            tooltip="Undo (Ctrl+Z)"
          />
          <ToolBtn
            icon={Redo2}
            onClick={redo}
            disabled={redoStack.length === 0}
            tooltip="Redo (Ctrl+Shift+Z)"
          />

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.08] mx-1" />

          {/* Zoom */}
          <ToolBtn
            icon={ZoomOut}
            onClick={() =>
              setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))
            }
            disabled={zoom <= 0.5}
            tooltip="Zoom out"
          />
          <span className="text-[10px] tabular-nums w-8 text-center font-medium text-muted-foreground">
            {zoomPercent}%
          </span>
          <ToolBtn
            icon={ZoomIn}
            onClick={() =>
              setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))
            }
            disabled={zoom >= 5}
            tooltip="Zoom in"
          />

          {/* Clear — pushed right */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={clearMask}
                disabled={lines.length === 0}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                aria-label="Clear mask"
              >
                <RotateCcw className="size-3" />
                Clear
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              Clear all strokes
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}

/* ─── Small toolbar button ──────────────────────────────────── */

function ToolBtn({
  icon: Icon,
  active,
  disabled,
  onClick,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "p-1.5 rounded-md transition-all duration-100",
            active
              ? "bg-white/[0.12] text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]",
            disabled && "opacity-30 pointer-events-none"
          )}
          aria-label={tooltip}
        >
          <Icon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
