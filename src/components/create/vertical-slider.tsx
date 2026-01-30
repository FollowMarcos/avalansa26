"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VerticalSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  height?: number;
}

export function VerticalSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  className,
  height = 120,
}: VerticalSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMove = React.useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const relativeY = rect.bottom - clientY;
      const percentage = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
      const newValue = min + (percentage / 100) * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Math.max(min, Math.min(max, steppedValue)));
    },
    [min, max, step, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientY);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {Math.round(value)}
        </span>
      )}

      <div
        ref={trackRef}
        className={cn(
          "relative w-3 rounded-full bg-muted cursor-pointer touch-none",
          "transition-colors hover:bg-muted/80",
          isDragging && "bg-muted/70"
        )}
        style={{ height }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-primary transition-all"
          style={{ height: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full",
            "bg-white dark:bg-zinc-200 shadow-md border-2 border-primary",
            "transition-transform",
            isDragging && "scale-110"
          )}
          style={{ bottom: `calc(${percentage}% - 10px)` }}
        />
      </div>

      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
