"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { GroupData } from "@/types/canvas";
import { hexToRgba, GROUP_COLLAPSED_HEIGHT, GROUP_TITLE_HEIGHT } from "./group-utils";
import { ChevronDown, ChevronRight, GripHorizontal, Pencil } from "lucide-react";

interface GroupItemProps {
  group: GroupData;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (delta: { x: number; y: number }) => void;
  onResize: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onTitleChange: (title: string) => void;
  onToggleCollapse: () => void;
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

export const GroupItem = React.memo(function GroupItem({
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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTitleHovered, setIsTitleHovered] = React.useState(false);
  const [resizeHandle, setResizeHandle] = React.useState<ResizeHandle | null>(null);
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const initialBoundsRef = React.useRef(group.bounds);
  const currentBoundsRef = React.useRef(group.bounds);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep current bounds ref in sync with props (for stale closure fix)
  React.useEffect(() => {
    currentBoundsRef.current = group.bounds;
  }, [group.bounds]);

  // Calculate position in screen coordinates
  const screenX = group.bounds.x * transform.zoom + transform.x;
  const screenY = group.bounds.y * transform.zoom + transform.y;
  const screenWidth = group.bounds.width * transform.zoom;
  const screenHeight = group.isCollapsed
    ? GROUP_COLLAPSED_HEIGHT * transform.zoom
    : group.bounds.height * transform.zoom;

  // Sync editValue with group.title when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(group.title);
    }
  }, [group.title, isEditing]);

  // Handle title editing
  const startEditing = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setEditValue(group.title);
  }, [group.title]);

  const handleTitleBlur = React.useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== group.title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(group.title);
    }
  }, [editValue, group.title, onTitleChange]);

  const handleTitleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditValue(group.title);
    }
  }, [handleTitleBlur, group.title]);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      // Small delay to ensure the input is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  // Handle drag start
  const handleDragStart = React.useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    // Use currentBoundsRef to avoid stale closure
    initialBoundsRef.current = { ...currentBoundsRef.current };
    onSelect();
  }, [isEditing, onSelect]);

  // Handle resize start
  const handleResizeStart = React.useCallback((handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeHandle(handle);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    // Use currentBoundsRef to avoid stale closure
    initialBoundsRef.current = { ...currentBoundsRef.current };
    onSelect();
  }, [onSelect]);

  // Handle mouse move (drag or resize)
  React.useEffect(() => {
    if (!isDragging && !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = (e.clientX - dragStartRef.current.x) / transform.zoom;
      const deltaY = (e.clientY - dragStartRef.current.y) / transform.zoom;

      if (isDragging) {
        // Update drag start for continuous movement
        dragStartRef.current = { x: e.clientX, y: e.clientY };
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
        if (bounds.width < 150) {
          if (resizeHandle.includes("w")) {
            bounds.x = initialBoundsRef.current.x + initialBoundsRef.current.width - 150;
          }
          bounds.width = 150;
        }
        if (bounds.height < 80) {
          if (resizeHandle.includes("n")) {
            bounds.y = initialBoundsRef.current.y + initialBoundsRef.current.height - 80;
          }
          bounds.height = 80;
        }

        onResize(bounds);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeHandle(null);
      dragStartRef.current = null;
    };

    // Add listeners to window for better drag handling
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.cursor = isDragging ? "grabbing" : (resizeHandle ? `${resizeHandle}-resize` : "default");

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, resizeHandle, onMove, onResize, transform.zoom]);

  // Resize handle positions - larger handles (12px)
  const handleSize = 12;
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
        "absolute pointer-events-auto",
        "transition-[box-shadow,opacity] duration-150",
        // Base z-index for groups, higher when selected/interacting
        isSelected || isDragging || resizeHandle ? "z-10" : "z-0",
        isDragging && "opacity-90",
        resizeHandle && "opacity-95"
      )}
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
        boxShadow: (isDragging || resizeHandle)
          ? `0 8px 32px ${hexToRgba(group.color, 0.3)}`
          : isSelected
            ? `0 4px 16px ${hexToRgba(group.color, 0.2)}`
            : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          onSelect();
        }
      }}
    >
      {/* Group background */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 transition-all duration-150",
          !group.isCollapsed && "overflow-hidden"
        )}
        style={{
          backgroundColor: hexToRgba(group.color, isHovered || isSelected ? 0.15 : 0.08),
          borderColor: hexToRgba(group.color, isSelected ? 0.9 : isHovered ? 0.6 : 0.35),
          borderStyle: isSelected ? "solid" : "dashed",
        }}
      />

      {/* Title bar */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center gap-2 px-3 rounded-t-lg select-none",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
          !isEditing && "cursor-grab active:cursor-grabbing"
        )}
        style={{
          height: GROUP_TITLE_HEIGHT * transform.zoom,
          backgroundColor: hexToRgba(group.color, isHovered || isSelected ? 0.35 : 0.2),
        }}
        onMouseDown={handleDragStart}
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
        onDoubleClick={startEditing}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          } else if (e.key === "F2") {
            e.preventDefault();
            startEditing();
          }
        }}
        aria-label={`${group.title} group - double-click or F2 to rename, drag to move`}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center size-6 rounded transition-colors",
            "hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ transform: `scale(${Math.min(transform.zoom, 1.2)})`, transformOrigin: "center" }}
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
          className={cn("size-4 transition-opacity", isTitleHovered ? "opacity-60" : "opacity-30")}
          style={{
            color: group.color,
            transform: `scale(${Math.min(transform.zoom, 1.2)})`,
            transformOrigin: "center",
          }}
          aria-hidden="true"
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
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex-1 min-w-0 bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-medium",
              "outline-none ring-2 ring-ring"
            )}
            style={{
              fontSize: Math.max(12, 14 * Math.min(transform.zoom, 1.2)),
              color: group.color,
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Group name"
          />
        ) : (
          <span
            className="flex-1 min-w-0 font-medium truncate"
            style={{
              fontSize: Math.max(12, 14 * Math.min(transform.zoom, 1.2)),
              color: group.color,
            }}
          >
            {group.title}
          </span>
        )}

        {/* Edit button (show on hover) */}
        {!isEditing && isTitleHovered && (
          <button
            type="button"
            className={cn(
              "flex items-center justify-center size-6 rounded transition-opacity",
              "hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            onClick={startEditing}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ transform: `scale(${Math.min(transform.zoom, 1.2)})`, transformOrigin: "center" }}
            aria-label="Rename group"
          >
            <Pencil className="size-3" style={{ color: group.color }} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Resize handles (only show when selected and not collapsed) */}
      {isSelected && !group.isCollapsed &&
        handles.map(({ handle, style }) => (
          <div
            key={handle}
            role="separator"
            tabIndex={0}
            aria-label={`Resize ${handle}`}
            aria-orientation={handle === "n" || handle === "s" ? "horizontal" : "vertical"}
            className={cn(
              "absolute bg-white border-2 rounded-sm z-20",
              "transition-transform duration-100",
              "hover:scale-125 focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            style={{
              ...style,
              width: handleSize,
              height: handleSize,
              borderColor: group.color,
              boxShadow: `0 2px 4px ${hexToRgba(group.color, 0.3)}`,
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

              if (handle.includes("n")) {
                bounds.y += deltaY;
                bounds.height -= deltaY;
              }
              if (handle.includes("s")) bounds.height += deltaY;
              if (handle.includes("w")) {
                bounds.x += deltaX;
                bounds.width -= deltaX;
              }
              if (handle.includes("e")) bounds.width += deltaX;

              if (bounds.width >= 150 && bounds.height >= 80) {
                onResize(bounds);
              }
            }}
          />
        ))}

      {/* Selection indicator border (pulsing when selected) */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            border: `2px solid ${hexToRgba(group.color, 0.5)}`,
            animationDuration: "2s",
          }}
        />
      )}
    </div>
  );
});
