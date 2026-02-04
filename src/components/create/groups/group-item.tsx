"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { GroupData } from "@/types/canvas";
import { hexToRgba, GROUP_TITLE_HEIGHT } from "./group-utils";
import { ChevronDown, ChevronRight, GripHorizontal, Pencil } from "lucide-react";

interface GroupItemProps {
  group: GroupData;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  screenBounds: { x: number; y: number; width: number; height: number };
  zoom: number;
  onTitleChange: (title: string) => void;
  onToggleCollapse: () => void;
  onMouseDown: (e: React.MouseEvent, action: "move" | "resize" | "select", handle?: string) => void;
}

/**
 * Pure presentational component for rendering a group.
 * All drag/resize state is managed by the parent GroupLayer.
 */
export const GroupItem = React.memo(function GroupItem({
  group,
  isSelected,
  isDragging,
  isResizing,
  screenBounds,
  zoom,
  onTitleChange,
  onToggleCollapse,
  onMouseDown,
}: GroupItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(group.title);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTitleHovered, setIsTitleHovered] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync editValue with group.title when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(group.title);
    }
  }, [group.title, isEditing]);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const startEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setEditValue(group.title);
  };

  const finishEditing = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== group.title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(group.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditValue(group.title);
    }
  };

  // Handle mousedown on the group background - just selects
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    onMouseDown(e, "select");
  };

  // Handle mousedown on title bar - selects and starts drag
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (isEditing) return;
    e.stopPropagation();
    onMouseDown(e, "move");
  };

  // Handle resize handle mousedown
  const handleResizeMouseDown = (handle: string) => (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    onMouseDown(e, "resize", handle);
  };

  // Resize handle definitions
  const handleSize = 10;
  const handles = [
    { id: "nw", style: { top: -handleSize / 2, left: -handleSize / 2, cursor: "nwse-resize" } },
    { id: "n", style: { top: -handleSize / 2, left: "50%", marginLeft: -handleSize / 2, cursor: "ns-resize" } },
    { id: "ne", style: { top: -handleSize / 2, right: -handleSize / 2, cursor: "nesw-resize" } },
    { id: "w", style: { top: "50%", marginTop: -handleSize / 2, left: -handleSize / 2, cursor: "ew-resize" } },
    { id: "e", style: { top: "50%", marginTop: -handleSize / 2, right: -handleSize / 2, cursor: "ew-resize" } },
    { id: "sw", style: { bottom: -handleSize / 2, left: -handleSize / 2, cursor: "nesw-resize" } },
    { id: "s", style: { bottom: -handleSize / 2, left: "50%", marginLeft: -handleSize / 2, cursor: "ns-resize" } },
    { id: "se", style: { bottom: -handleSize / 2, right: -handleSize / 2, cursor: "nwse-resize" } },
  ];

  const titleHeight = GROUP_TITLE_HEIGHT * zoom;
  const iconScale = Math.min(zoom, 1.2);

  return (
    <div
      role="region"
      aria-label={`Group: ${group.title}`}
      className={cn(
        "absolute",
        isSelected || isDragging || isResizing ? "z-10" : "z-0"
      )}
      style={{
        left: screenBounds.x,
        top: screenBounds.y,
        width: screenBounds.width,
        height: screenBounds.height,
        opacity: isDragging ? 0.9 : isResizing ? 0.95 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background - captures clicks for selection */}
      <div
        className="absolute inset-0 rounded-lg border-2 cursor-pointer pointer-events-auto"
        style={{
          backgroundColor: hexToRgba(group.color, isHovered || isSelected ? 0.15 : 0.08),
          borderColor: hexToRgba(group.color, isSelected ? 0.9 : isHovered ? 0.6 : 0.35),
          borderStyle: isSelected ? "solid" : "dashed",
        }}
        onMouseDown={handleBackgroundMouseDown}
      />

      {/* Title bar - captures clicks for drag */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center gap-2 px-3 rounded-t-lg pointer-events-auto",
          !isEditing && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        style={{
          height: titleHeight,
          backgroundColor: hexToRgba(group.color, isHovered || isSelected ? 0.35 : 0.2),
        }}
        onMouseDown={handleTitleMouseDown}
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
        onDoubleClick={startEditing}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          className="flex items-center justify-center size-6 rounded hover:bg-black/10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ transform: `scale(${iconScale})`, transformOrigin: "center" }}
          aria-label={group.isCollapsed ? "Expand group" : "Collapse group"}
        >
          {group.isCollapsed ? (
            <ChevronRight className="size-4" style={{ color: group.color }} />
          ) : (
            <ChevronDown className="size-4" style={{ color: group.color }} />
          )}
        </button>

        {/* Drag handle */}
        <GripHorizontal
          className={cn("size-4", isTitleHovered ? "opacity-60" : "opacity-30")}
          style={{ color: group.color, transform: `scale(${iconScale})` }}
        />

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleTitleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-medium outline-none ring-2 ring-ring"
            style={{ fontSize: Math.max(12, 14 * iconScale), color: group.color }}
            spellCheck={false}
            autoComplete="off"
          />
        ) : (
          <span
            className="flex-1 min-w-0 font-medium truncate select-none"
            style={{ fontSize: Math.max(12, 14 * iconScale), color: group.color }}
          >
            {group.title}
          </span>
        )}

        {/* Edit button */}
        {!isEditing && isTitleHovered && (
          <button
            type="button"
            className="flex items-center justify-center size-6 rounded hover:bg-black/10"
            onClick={startEditing}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ transform: `scale(${iconScale})` }}
            aria-label="Rename group"
          >
            <Pencil className="size-3" style={{ color: group.color }} />
          </button>
        )}
      </div>

      {/* Resize handles */}
      {isSelected && !group.isCollapsed &&
        handles.map(({ id, style }) => (
          <div
            key={id}
            className="absolute bg-white border-2 rounded-sm z-20 hover:scale-110 pointer-events-auto"
            style={{
              ...style,
              width: handleSize,
              height: handleSize,
              borderColor: group.color,
              cursor: style.cursor,
            }}
            onMouseDown={handleResizeMouseDown(id)}
          />
        ))}

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ border: `2px solid ${hexToRgba(group.color, 0.5)}` }}
        />
      )}
    </div>
  );
});
