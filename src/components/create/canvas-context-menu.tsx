"use client";

import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { GROUP_COLORS } from "./groups/group-utils";
import { Group, Ungroup, Palette, Trash2, Edit3, Copy } from "lucide-react";
import type { GroupData } from "@/types/canvas";

interface CanvasContextMenuProps {
  children: React.ReactNode;
  selectedNodeIds: Set<string>;
  selectedGroupId: string | null;
  groups: GroupData[];
  onCreateGroup: (nodeIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onClearSelection: () => void;
}

export function CanvasContextMenu({
  children,
  selectedNodeIds,
  selectedGroupId,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onUpdateGroup,
  onDuplicateGroup,
  onClearSelection,
}: CanvasContextMenuProps) {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleCreateGroup = () => {
    if (selectedNodeIds.size >= 2) {
      onCreateGroup(Array.from(selectedNodeIds));
    }
  };

  const handleDeleteGroup = () => {
    if (selectedGroupId) {
      onDeleteGroup(selectedGroupId);
    }
  };

  const handleDuplicateGroup = () => {
    if (selectedGroupId && onDuplicateGroup) {
      onDuplicateGroup(selectedGroupId);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedGroupId) {
      onUpdateGroup(selectedGroupId, { color });
    }
  };

  const handleRename = () => {
    if (selectedGroup) {
      setRenameValue(selectedGroup.title);
      setIsRenaming(true);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupId && renameValue.trim()) {
      onUpdateGroup(selectedGroupId, { title: renameValue.trim() });
    }
    setIsRenaming(false);
  };

  const canCreateGroup = selectedNodeIds.size >= 2;
  const hasSelectedGroup = !!selectedGroupId;

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-56">
        {/* Node selection actions */}
        {canCreateGroup && (
          <>
            <ContextMenuItem onClick={handleCreateGroup}>
              <Group className="mr-2 size-4" />
              Create Group
              <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Group actions */}
        {hasSelectedGroup && selectedGroup && (
          <>
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="px-2 py-1.5">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Group name"
                  autoFocus
                  onBlur={() => setIsRenaming(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsRenaming(false);
                    }
                  }}
                  aria-label="Rename group"
                />
              </form>
            ) : (
              <ContextMenuItem onClick={handleRename}>
                <Edit3 className="mr-2 size-4" />
                Rename Group
              </ContextMenuItem>
            )}

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="mr-2 size-4" />
                Change Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                {GROUP_COLORS.map((color) => (
                  <ContextMenuItem
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="size-4 rounded-full border"
                      style={{ backgroundColor: color.value }}
                      aria-hidden="true"
                    />
                    {color.name}
                    {selectedGroup.color === color.value && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {onDuplicateGroup && (
              <ContextMenuItem onClick={handleDuplicateGroup}>
                <Copy className="mr-2 size-4" />
                Duplicate Group
              </ContextMenuItem>
            )}

            <ContextMenuSeparator />

            <ContextMenuItem onClick={handleDeleteGroup}>
              <Ungroup className="mr-2 size-4" />
              Ungroup
            </ContextMenuItem>

            <ContextMenuItem
              onClick={handleDeleteGroup}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete Group
            </ContextMenuItem>
          </>
        )}

        {/* Default actions when nothing is selected */}
        {!canCreateGroup && !hasSelectedGroup && (
          <ContextMenuItem disabled className="text-muted-foreground">
            Select 2+ nodes to create a group
          </ContextMenuItem>
        )}

        {/* Clear selection */}
        {(selectedNodeIds.size > 0 || hasSelectedGroup) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onClearSelection}>
              Clear Selection
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
