"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCreate } from "./create-context";
import {
  Layers2,
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CanvasList() {
  const {
    canvasList,
    currentCanvasId,
    switchCanvas,
    createNewCanvas,
    renameCanvas,
    deleteCanvas,
    isSaving,
    lastSaved,
  } = useCreate();

  const [isOpen, setIsOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      await renameCanvas(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  };

  const handleCreateNew = async () => {
    await createNewCanvas();
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteCanvas(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const canvasToDelete = canvasList.find((c) => c.id === deleteConfirmId);

  return (
    <>
    <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{canvasToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-4 z-20">
        <AnimatePresence initial={false} mode="wait">
          {isOpen ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-64 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Layers2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-mono font-medium">Canvases</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({canvasList.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Save status */}
                  {isSaving ? (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                      Saving
                    </span>
                  ) : lastSaved ? (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Saved
                    </span>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCreateNew}
                        aria-label="New canvas"
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New Canvas</TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close canvas list"
                    className="size-7 rounded-lg"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="h-[280px]">
                {canvasList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Layers2 className="size-8 text-muted-foreground/30 mb-2" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground font-mono">
                      No canvases yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNew}
                      className="mt-3 text-xs"
                    >
                      <Plus className="size-3 mr-1" aria-hidden="true" />
                      Create Canvas
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {canvasList.map((canvas) => (
                      <motion.div
                        key={canvas.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Switch to canvas: ${canvas.name}`}
                        aria-current={currentCanvasId === canvas.id ? "true" : undefined}
                        className={cn(
                          "group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer",
                          "hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                          currentCanvasId === canvas.id && "bg-muted"
                        )}
                        onClick={() => {
                          if (editingId !== canvas.id) {
                            switchCanvas(canvas.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingId !== canvas.id) {
                            switchCanvas(canvas.id);
                          }
                        }}
                      >
                        {/* Canvas icon/thumbnail */}
                        <div
                          className={cn(
                            "size-10 rounded-md border flex items-center justify-center flex-shrink-0",
                            currentCanvasId === canvas.id
                              ? "border-foreground/30 bg-foreground/5"
                              : "border-border bg-muted/50"
                          )}
                        >
                          <Layers2 className="size-4 text-muted-foreground" aria-hidden="true" />
                        </div>

                        {/* Canvas info */}
                        <div className="flex-1 min-w-0">
                          {editingId === canvas.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-xs px-1"
                                autoComplete="off"
                                aria-label="Canvas name"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit();
                                }}
                                aria-label="Save canvas name"
                                className="size-6 rounded"
                              >
                                <Check className="size-3" aria-hidden="true" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-mono truncate">
                                {canvas.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {formatTime(canvas.updated_at)} •{" "}
                                {canvas.nodes?.length || 0} nodes
                              </p>
                            </>
                          )}
                        </div>

                        {/* Actions (visible on hover) */}
                        {editingId !== canvas.id && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(canvas.id, canvas.name);
                                  }}
                                  aria-label="Rename canvas"
                                  className="size-6 rounded"
                                >
                                  <Pencil className="size-3" aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rename</TooltipContent>
                            </Tooltip>
                            {canvasList.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmId(canvas.id);
                                    }}
                                    aria-label="Delete canvas"
                                    className="size-6 rounded text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="size-3" aria-hidden="true" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}

                        {/* Current indicator */}
                        {currentCanvasId === canvas.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-foreground rounded-r" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open canvases"
                    className="size-10 rounded-xl bg-background/95 backdrop-blur-xl border-border shadow-lg"
                  >
                    <Layers2 className="size-4" aria-hidden="true" />
                    {canvasList.length > 1 && (
                      <span className="absolute -top-1 -right-1 size-4 rounded-full bg-foreground text-background text-[10px] font-mono flex items-center justify-center">
                        {canvasList.length > 9 ? "9+" : canvasList.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Canvases</TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
    </>
  );
}
