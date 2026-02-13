'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { GitBranch, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Workflow } from '@/types/workflow';

export interface WorkflowsTabProps {
  savedWorkflows: Workflow[];
  currentWorkflowId: string | null;
  workflowName: string;
  onCreateNew: () => void;
  onSwitch: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function WorkflowsTab({
  savedWorkflows,
  currentWorkflowId,
  workflowName,
  onCreateNew,
  onSwitch,
  onRename,
  onDelete,
}: WorkflowsTabProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(
    null,
  );

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleStartEdit = (id: string, currentName: string): void => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (): void => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  };

  const displayItems = React.useMemo(() => {
    if (!currentWorkflowId && workflowName) {
      return [
        {
          id: '__unsaved__',
          name: workflowName,
          updated_at: new Date().toISOString(),
          nodeCount: 0,
          isCurrent: true,
          isUnsaved: true,
        },
        ...savedWorkflows.map((w) => ({
          id: w.id,
          name: w.name,
          updated_at: w.updated_at,
          nodeCount: w.definition?.nodes?.length ?? 0,
          isCurrent: false,
          isUnsaved: false,
        })),
      ];
    }
    return savedWorkflows.map((w) => ({
      id: w.id,
      name: w.id === currentWorkflowId ? workflowName : w.name,
      updated_at: w.updated_at,
      nodeCount: w.definition?.nodes?.length ?? 0,
      isCurrent: w.id === currentWorkflowId,
      isUnsaved: false,
    }));
  }, [savedWorkflows, currentWorkflowId, workflowName]);

  const workflowToDelete = savedWorkflows.find(
    (w) => w.id === deleteConfirmId,
  );

  return (
    <>
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{workflowToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* New workflow button */}
        <div className="px-3 py-1.5 border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            className="w-full h-7 text-xs"
          >
            <Plus className="size-3 mr-1" aria-hidden="true" />
            New Workflow
          </Button>
        </div>

        {/* Workflow list */}
        <ScrollArea className="flex-1">
          <TooltipProvider delayDuration={300}>
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <GitBranch
                  className="size-6 text-muted-foreground/30 mb-2"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">
                  No workflows yet
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Switch to workflow: ${item.name}`}
                    aria-current={item.isCurrent ? 'true' : undefined}
                    className={cn(
                      'group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer',
                      'hover:bg-muted/50 transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      item.isCurrent && 'bg-muted',
                    )}
                    onClick={() => {
                      if (editingId !== item.id && !item.isUnsaved)
                        onSwitch(item.id);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        editingId !== item.id &&
                        !item.isUnsaved
                      )
                        onSwitch(item.id);
                    }}
                  >
                    <div
                      className={cn(
                        'size-7 rounded-md border flex items-center justify-center flex-shrink-0',
                        item.isCurrent
                          ? 'border-foreground/30 bg-foreground/5'
                          : 'border-border bg-muted/50',
                      )}
                    >
                      <GitBranch
                        className="size-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-xs px-1"
                            autoComplete="off"
                            aria-label="Workflow name"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            aria-label="Save workflow name"
                            className="size-6 rounded"
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-medium truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {item.isUnsaved
                              ? 'Unsaved'
                              : formatTime(item.updated_at)}{' '}
                            &middot; {item.nodeCount} nodes
                          </p>
                        </>
                      )}
                    </div>

                    {/* Hover actions */}
                    {editingId !== item.id && !item.isUnsaved && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(item.id, item.name);
                              }}
                              aria-label="Rename workflow"
                              className="size-6 rounded"
                            >
                              <Pencil className="size-3" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Rename</TooltipContent>
                        </Tooltip>
                        {savedWorkflows.length > 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(item.id);
                                }}
                                aria-label="Delete workflow"
                                className="size-6 rounded text-muted-foreground hover:text-destructive"
                              >
                                <Trash2
                                  className="size-3"
                                  aria-hidden="true"
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}

                    {/* Current indicator */}
                    {item.isCurrent && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground rounded-r" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TooltipProvider>
        </ScrollArea>
      </div>
    </>
  );
}
