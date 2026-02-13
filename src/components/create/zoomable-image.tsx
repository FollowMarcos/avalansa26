"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  /** Extra class names on the outer wrapper */
  className?: string;
  /** Class names applied to the <Image> element */
  imageClassName?: string;
  /** Scale factor when zoomed in (default 2.5) */
  zoomScale?: number;
  /** Called on single click (not double-click). Useful for backdrop close etc. */
  onSingleClick?: () => void;
  /** Called when the user scrolls up/down while NOT zoomed. direction: -1 = up (prev), 1 = down (next) */
  onScrollNavigate?: (direction: -1 | 1) => void;
}

/**
 * Image with Midjourney-style double-click zoom.
 *
 * - Double-click zooms in centered on the click point.
 * - Double-click again (or Escape) zooms back out.
 * - When zoomed, drag to pan.
 * - Scroll up/down navigates prev/next (when not zoomed).
 */
export function ZoomableImage({
  src,
  alt,
  className,
  imageClassName,
  zoomScale = 2.5,
  onSingleClick,
  onScrollNavigate,
}: ZoomableImageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef({ dragging: false, startX: 0, startY: 0, startTx: 0, startTy: 0 });

  // Reset zoom when src changes (image navigation)
  React.useEffect(() => {
    setZoomed(false);
    setTranslate({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
  }, [src]);

  // Escape to reset zoom
  React.useEffect(() => {
    if (!zoomed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setZoomed(false);
        setTranslate({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [zoomed]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (!zoomed) {
      // Zoom in — set transform-origin to click point
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin({ x, y });
      setTranslate({ x: 0, y: 0 });
      setZoomed(true);
    } else {
      // Zoom out
      setZoomed(false);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!zoomed) return;
    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startTx: translate.x,
      startTy: translate.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTranslate({
      x: dragRef.current.startTx + dx,
      y: dragRef.current.startTy + dy,
    });
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  // Scroll-wheel navigation (when not zoomed)
  const wheelCooldownRef = React.useRef(false);

  const handleWheel = React.useCallback(
    (e: React.WheelEvent) => {
      if (zoomed || !onScrollNavigate || wheelCooldownRef.current) return;
      // Only respond to meaningful scroll (not trackpad micro-scrolls)
      if (Math.abs(e.deltaY) < 30) return;
      e.preventDefault();
      wheelCooldownRef.current = true;
      onScrollNavigate(e.deltaY > 0 ? 1 : -1);
      // Cooldown prevents rapid-fire navigation
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 300);
    },
    [zoomed, onScrollNavigate],
  );

  // Distinguish single click from double click
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      // Second click within threshold — double-click will fire, clear single-click
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      onSingleClick?.();
    }, 250);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: zoomed ? (dragRef.current.dragging ? "grabbing" : "grab") : "zoom-in" }}
    >
      <div
        className="relative size-full transition-transform duration-200"
        style={{
          transform: zoomed
            ? `scale(${zoomScale}) translate(${translate.x / zoomScale}px, ${translate.y / zoomScale}px)`
            : "scale(1)",
          transformOrigin: `${origin.x}% ${origin.y}%`,
          willChange: zoomed ? "transform" : "auto",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-contain", imageClassName)}
          unoptimized
          draggable={false}
        />
      </div>
    </div>
  );
}
