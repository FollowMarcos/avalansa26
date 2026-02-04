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

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

interface DragState {
  type: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  initialBounds: { x: number; y: number; width: number; height: number };
}

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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTitleHovered, setIsTitleHovered] = React.useState(false);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Calculate screen coordinates
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
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  // Handle drag start (move)
  const handleDragStart = React.useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setDragState({
      type: "move",
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...group.bounds },
    });
  }, [isEditing, onSelect, group.bounds]);

  // Handle resize start
  const handleResizeStart = React.useCallback((handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    setDragState({
      type: "resize",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialBounds: { ...group.bounds },
    });
  }, [onSelect, group.bounds]);

  // Handle mouse move and mouse up
  React.useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragState.startX) / transform.zoom;
      const deltaY = (e.clientY - dragState.startY) / transform.zoom;

      if (dragState.type === "move") {
        onMove({ x: deltaX, y: deltaY });
        // Update start position for continuous movement
        setDragState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
      } else if (dragState.type === "resize" && dragState.handle) {
        const handle = dragState.handle;
        const bounds = { ...dragState.initialBounds };

        // Apply resize based on handle position
        if (handle.includes("n")) {
          bounds.y = dragState.initialBounds.y + deltaY;
          bounds.height = dragState.initialBounds.height - deltaY;
        }
        if (handle.includes("s")) {
          bounds.height = dragState.initialBounds.height + deltaY;
        }
        if (handle.includes("w")) {
          bounds.x = dragState.initialBounds.x + deltaX;
          bounds.width = dragState.initialBounds.width - deltaX;
        }
        if (handle.includes("e")) {
          bounds.width = dragState.initialBounds.width + deltaX;
        }

        // Enforce minimum dimensions
        const minWidth = 150;
        const minHeight = 80;

        if (bounds.width < minWidth) {
          if (handle.includes("w")) {
            bounds.x = dragState.initialBounds.x + dragState.initialBounds.width - minWidth;
          }
          bounds.width = minWidth;
        }
        if (bounds.height < minHeight) {
          if (handle.includes("n")) {
            bounds.y = dragState.initialBounds.y + dragState.initialBounds.height - minHeight;
          }
          bounds.height = minHeight;
        }

        onResize(bounds);
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, transform.zoom, onMove, onResize]);

  // Resize handle positions
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

  const isDragging = dragState?.type === "move";
  const isResizing = dragState?.type === "resize";

  return (
    <div
      role="region"
      aria-label={`Group: ${group.title}`}
      className={cn(
        "absolute pointer-events-auto select-none",
        isSelected || isDragging || isResizing ? "z-10" : "z-0",
        isDragging && "opacity-90",
        isResizing && "opacity-95",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
        boxShadow: (isDragging || isResizing)
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
          "absolute inset-0 rounded-lg border-2",
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
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          !isEditing && "cursor-grab",
          isDragging && "cursor-grabbing"
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
            "flex items-center justify-center size-6 rounded",
            "hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
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
          className={cn("size-4", isTitleHovered ? "opacity-60" : "opacity-30")}
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
              "flex items-center justify-center size-6 rounded",
              "hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              "hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Selection indicator border */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: `2px solid ${hexToRgba(group.color, 0.5)}`,
          }}
        />
      )}
    </div>
  );
});
