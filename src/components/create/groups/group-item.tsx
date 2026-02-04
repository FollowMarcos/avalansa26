"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { GroupData } from "@/types/canvas";
import { hexToRgba, GROUP_COLLAPSED_HEIGHT, GROUP_TITLE_HEIGHT } from "./group-utils";
import { ChevronDown, ChevronRight, GripHorizontal } from "lucide-react";

interface GroupItemProps {
  group: GroupData;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (delta: { x: number; y: number }) => void;
  onResize: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onTitleChange: (title: string) => void;
  onToggleCollapse: () => void;
  onDelete: () => void;
  transform: { x: number; y: number; zoom: number };
}

type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "w"
  | "e"
  | "sw"
  | "s"
  | "se";

export function GroupItem({
  group,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onTitleChange,
  onToggleCollapse,
  transform,
}: GroupItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(group.title);
  const [isDragging, setIsDragging] = React.useState(false);
  const [resizeHandle, setResizeHandle] = React.useState<ResizeHandle | null>(null);
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const initialBoundsRef = React.useRef(group.bounds);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Calculate position in screen coordinates
  const screenX = group.bounds.x * transform.zoom + transform.x;
  const screenY = group.bounds.y * transform.zoom + transform.y;
  const screenWidth = group.bounds.width * transform.zoom;
  const screenHeight = group.isCollapsed
    ? GROUP_COLLAPSED_HEIGHT * transform.zoom
    : group.bounds.height * transform.zoom;

  // Handle title editing
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(group.title);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== group.title) {
      onTitleChange(editValue.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(group.title);
    }
  };

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoundsRef.current = group.bounds;
    onSelect();
  };

  // Handle resize start
  const handleResizeStart = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeHandle(handle);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialBoundsRef.current = group.bounds;
    onSelect();
  };

  // Handle mouse move (drag or resize)
  React.useEffect(() => {
    if (!isDragging && !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = (e.clientX - dragStartRef.current.x) / transform.zoom;
      const deltaY = (e.clientY - dragStartRef.current.y) / transform.zoom;

      if (isDragging) {
        onMove({ x: deltaX, y: deltaY });
      } else if (resizeHandle) {
        const bounds = { ...initialBoundsRef.current };

        // Apply resize based on handle position
        if (resizeHandle.includes("n")) {
          bounds.y = initialBoundsRef.current.y + deltaY;
          bounds.height = initialBoundsRef.current.height - deltaY;
        }
        if (resizeHandle.includes("s")) {
          bounds.height = initialBoundsRef.current.height + deltaY;
        }
        if (resizeHandle.includes("w")) {
          bounds.x = initialBoundsRef.current.x + deltaX;
          bounds.width = initialBoundsRef.current.width - deltaX;
        }
        if (resizeHandle.includes("e")) {
          bounds.width = initialBoundsRef.current.width + deltaX;
        }

        // Ensure minimum dimensions
        if (bounds.width < 100) bounds.width = 100;
        if (bounds.height < 60) bounds.height = 60;

        onResize(bounds);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeHandle(null);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, resizeHandle, onMove, onResize, transform.zoom]);

  // Resize handle positions
  const handleSize = 8;
  const handles: { handle: ResizeHandle; style: React.CSSProperties }[] = [
    { handle: "nw", style: { top: -handleSize / 2, left: -handleSize / 2, cursor: "nwse-resize" } },
    { handle: "n", style: { top: -handleSize / 2, left: "50%", marginLeft: -handleSize / 2, cursor: "ns-resize" } },
    { handle: "ne", style: { top: -handleSize / 2, right: -handleSize / 2, cursor: "nesw-resize" } },
    { handle: "w", style: { top: "50%", marginTop: -handleSize / 2, left: -handleSize / 2, cursor: "ew-resize" } },
    { handle: "e", style: { top: "50%", marginTop: -handleSize / 2, right: -handleSize / 2, cursor: "ew-resize" } },
    { handle: "sw", style: { bottom: -handleSize / 2, left: -handleSize / 2, cursor: "nesw-resize" } },
    { handle: "s", style: { bottom: -handleSize / 2, left: "50%", marginLeft: -handleSize / 2, cursor: "ns-resize" } },
    { handle: "se", style: { bottom: -handleSize / 2, right: -handleSize / 2, cursor: "nwse-resize" } },
  ];

  return (
    <div
      role="region"
      aria-label={`Group: ${group.title}`}
      className={cn(
        "absolute pointer-events-auto transition-shadow duration-200",
        isSelected && "z-10"
      )}
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Group background */}
      <div
        className="absolute inset-0 rounded-lg border-2"
        style={{
          backgroundColor: hexToRgba(group.color, 0.1),
          borderColor: hexToRgba(group.color, isSelected ? 0.8 : 0.4),
        }}
      />

      {/* Title bar */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center gap-2 px-3 rounded-t-lg cursor-move select-none",
          "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
        )}
        style={{
          height: GROUP_TITLE_HEIGHT * transform.zoom,
          backgroundColor: hexToRgba(group.color, 0.25),
        }}
        onMouseDown={handleDragStart}
        onDoubleClick={handleTitleDoubleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          } else if (e.key === "F2") {
            e.preventDefault();
            setIsEditing(true);
            setEditValue(group.title);
          }
        }}
        aria-label={`${group.title} group - press Enter to select, F2 to rename`}
      >
        {/* Collapse toggle */}
        <button
          className="flex items-center justify-center size-5 rounded hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapse();
            }
          }}
          style={{ transform: `scale(${transform.zoom})`, transformOrigin: "center" }}
          aria-label={group.isCollapsed ? "Expand group" : "Collapse group"}
          aria-expanded={!group.isCollapsed}
        >
          {group.isCollapsed ? (
            <ChevronRight className="size-4" style={{ color: group.color }} aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" style={{ color: group.color }} aria-hidden="true" />
          )}
        </button>

        {/* Drag handle icon */}
        <GripHorizontal
          className="size-4 opacity-40"
          style={{
            color: group.color,
            transform: `scale(${transform.zoom})`,
            transformOrigin: "center",
          }}
        />

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="flex-1 bg-white/80 px-1 rounded text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
            style={{
              fontSize: 14 * transform.zoom,
              color: group.color,
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Group name"
          />
        ) : (
          <span
            className="flex-1 font-medium truncate"
            style={{
              fontSize: 14 * transform.zoom,
              color: group.color,
            }}
          >
            {group.title}
          </span>
        )}
      </div>

      {/* Resize handles (only show when selected and not collapsed) */}
      {isSelected && !group.isCollapsed &&
        handles.map(({ handle, style }) => (
          <div
            key={handle}
            role="slider"
            tabIndex={0}
            aria-label={`Resize ${handle} handle`}
            aria-valuetext="Drag to resize group"
            className="absolute bg-white border-2 rounded-sm z-20 focus:outline-none focus:ring-2 focus:ring-ring"
            style={{
              ...style,
              width: handleSize,
              height: handleSize,
              borderColor: group.color,
            }}
            onMouseDown={handleResizeStart(handle)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 20 : 5;
              let deltaX = 0;
              let deltaY = 0;

              if (e.key === "ArrowLeft") deltaX = -step;
              else if (e.key === "ArrowRight") deltaX = step;
              else if (e.key === "ArrowUp") deltaY = -step;
              else if (e.key === "ArrowDown") deltaY = step;
              else return;

              e.preventDefault();
              const bounds = { ...group.bounds };

              if (handle.includes("n")) bounds.y += deltaY;
              if (handle.includes("s")) bounds.height += deltaY;
              if (handle.includes("w")) bounds.x += deltaX;
              if (handle.includes("e")) bounds.width += deltaX;
              if (handle.includes("n")) bounds.height -= deltaY;
              if (handle.includes("w")) bounds.width -= deltaX;

              if (bounds.width >= 100 && bounds.height >= 60) {
                onResize(bounds);
              }
            }}
          />
        ))}
    </div>
  );
}
