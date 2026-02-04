"use client";

import * as React from "react";
import { useStore, type ReactFlowState } from "@xyflow/react";
import type { GroupData } from "@/types/canvas";
import { GroupItem } from "./group-item";
import { GROUP_COLLAPSED_HEIGHT } from "./group-utils";

interface GroupLayerProps {
  groups: GroupData[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onMoveGroup: (groupId: string, delta: { x: number; y: number }) => void;
  onResizeGroup: (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  onUpdateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  onToggleGroupCollapse: (groupId: string) => void;
}

interface DragState {
  groupId: string;
  action: "move" | "resize";
  handle?: string;
  startMouseX: number;
  startMouseY: number;
  startBounds: { x: number; y: number; width: number; height: number };
}

// Selector for viewport transform
const transformSelector = (state: ReactFlowState) => ({
  x: state.transform[0],
  y: state.transform[1],
  zoom: state.transform[2],
});

/**
 * GroupLayer manages all group rendering and interaction state.
 * Drag and resize operations are handled here, not in individual GroupItems.
 */
export const GroupLayer = React.memo(function GroupLayer({
  groups,
  selectedGroupId,
  onSelectGroup,
  onMoveGroup,
  onResizeGroup,
  onUpdateGroup,
  onToggleGroupCollapse,
}: GroupLayerProps) {
  const transform = useStore(transformSelector);
  const [dragState, setDragState] = React.useState<DragState | null>(null);

  // Convert canvas coordinates to screen coordinates
  const toScreen = React.useCallback(
    (canvasX: number, canvasY: number) => ({
      x: canvasX * transform.zoom + transform.x,
      y: canvasY * transform.zoom + transform.y,
    }),
    [transform]
  );

  // Get screen bounds for a group
  const getScreenBounds = React.useCallback(
    (group: GroupData) => {
      const pos = toScreen(group.bounds.x, group.bounds.y);
      const height = group.isCollapsed
        ? GROUP_COLLAPSED_HEIGHT * transform.zoom
        : group.bounds.height * transform.zoom;
      return {
        x: pos.x,
        y: pos.y,
        width: group.bounds.width * transform.zoom,
        height,
      };
    },
    [toScreen, transform.zoom]
  );

  // Handle mouse down on a group (select, start drag, or resize)
  const handleMouseDown = React.useCallback(
    (groupId: string, e: React.MouseEvent, action: "move" | "resize" | "select", handle?: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      onSelectGroup(groupId);

      // If just selecting (clicked on background), don't start drag
      if (action === "select") return;

      setDragState({
        groupId,
        action,
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startBounds: { ...group.bounds },
      });
    },
    [groups, onSelectGroup]
  );

  // Handle mouse move during drag/resize
  React.useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragState.startMouseX) / transform.zoom;
      const deltaY = (e.clientY - dragState.startMouseY) / transform.zoom;

      if (dragState.action === "move") {
        // For move, we pass incremental deltas and update start position
        onMoveGroup(dragState.groupId, { x: deltaX, y: deltaY });
        setDragState((prev) =>
          prev ? { ...prev, startMouseX: e.clientX, startMouseY: e.clientY } : null
        );
      } else if (dragState.action === "resize" && dragState.handle) {
        // For resize, we calculate new bounds from the original start bounds
        const handle = dragState.handle;
        const newBounds = { ...dragState.startBounds };

        if (handle.includes("n")) {
          newBounds.y = dragState.startBounds.y + deltaY;
          newBounds.height = dragState.startBounds.height - deltaY;
        }
        if (handle.includes("s")) {
          newBounds.height = dragState.startBounds.height + deltaY;
        }
        if (handle.includes("w")) {
          newBounds.x = dragState.startBounds.x + deltaX;
          newBounds.width = dragState.startBounds.width - deltaX;
        }
        if (handle.includes("e")) {
          newBounds.width = dragState.startBounds.width + deltaX;
        }

        // Enforce minimum size
        const minWidth = 150;
        const minHeight = 80;

        if (newBounds.width < minWidth) {
          if (handle.includes("w")) {
            newBounds.x = dragState.startBounds.x + dragState.startBounds.width - minWidth;
          }
          newBounds.width = minWidth;
        }
        if (newBounds.height < minHeight) {
          if (handle.includes("n")) {
            newBounds.y = dragState.startBounds.y + dragState.startBounds.height - minHeight;
          }
          newBounds.height = minHeight;
        }

        onResizeGroup(dragState.groupId, newBounds);
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
  }, [dragState, transform.zoom, onMoveGroup, onResizeGroup]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      aria-label="Node groups layer"
    >
      {groups.map((group) => {
        const isDragging = dragState?.groupId === group.id && dragState.action === "move";
        const isResizing = dragState?.groupId === group.id && dragState.action === "resize";

        return (
          <GroupItem
            key={group.id}
            group={group}
            isSelected={selectedGroupId === group.id}
            isDragging={isDragging}
            isResizing={isResizing}
            screenBounds={getScreenBounds(group)}
            zoom={transform.zoom}
            onTitleChange={(title) => onUpdateGroup(group.id, { title })}
            onToggleCollapse={() => onToggleGroupCollapse(group.id)}
            onMouseDown={(e, action, handle) => handleMouseDown(group.id, e, action, handle)}
          />
        );
      })}
    </div>
  );
});
