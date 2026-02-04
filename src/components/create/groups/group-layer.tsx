"use client";

import * as React from "react";
import { useStore, type ReactFlowState } from "@xyflow/react";
import type { GroupData } from "@/types/canvas";
import { GroupItem } from "./group-item";

interface GroupLayerProps {
  groups: GroupData[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onMoveGroup: (groupId: string, delta: { x: number; y: number }) => void;
  onResizeGroup: (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  onUpdateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  onToggleGroupCollapse: (groupId: string) => void;
}

// Selector for viewport transform
const transformSelector = (state: ReactFlowState) => ({
  x: state.transform[0],
  y: state.transform[1],
  zoom: state.transform[2],
});

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

  if (groups.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-label="Node groups layer"
    >
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          isSelected={selectedGroupId === group.id}
          onSelect={() => onSelectGroup(group.id)}
          onMove={(delta) => onMoveGroup(group.id, delta)}
          onResize={(bounds) => onResizeGroup(group.id, bounds)}
          onTitleChange={(title) => onUpdateGroup(group.id, { title })}
          onToggleCollapse={() => onToggleGroupCollapse(group.id)}
          transform={transform}
        />
      ))}
    </div>
  );
});
