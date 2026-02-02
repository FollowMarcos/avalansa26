"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreate, type GeneratedImage } from "./create-context";
import type { SessionWithCount } from "@/types/session";
import {
  Layers,
  Trash2,
  X,
  Download,
  Copy,
  ImagePlus,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Pencil,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HistoryIsland() {
  const {
    history,
    selectedImage,
    selectImage,
    clearHistory,
    historyPanelOpen,
    toggleHistoryPanel,
    addReferenceImageFromUrl,
    sessions,
    currentSessionId,
    historyGroupedBySession,
    setHistoryGroupedBySession,
    startNewSession,
    deleteSession,
  } = useCreate();

  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = React.useState(false);
  const [newSessionName, setNewSessionName] = React.useState("");
  const [expandedSessions, setExpandedSessions] = React.useState<Set<string>>(
    new Set([currentSessionId || ""])
  );
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);

  // Auto-expand current session when it changes
  React.useEffect(() => {
    if (currentSessionId) {
      setExpandedSessions((prev) => new Set([...prev, currentSessionId]));
    }
  }, [currentSessionId]);

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  const handleCreateSession = () => {
    startNewSession(newSessionName || undefined);
    setNewSessionName("");
    setShowNewSessionDialog(false);
  };

  const handleDeleteSession = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const handleDownload = async (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `generation-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleUseAsReference = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await addReferenceImageFromUrl(url);
  };

  // Group history by session for grouped view
  const groupedHistory = React.useMemo(() => {
    const groups = new Map<string, GeneratedImage[]>();

    // Create groups for each session
    for (const session of sessions) {
      groups.set(session.id, []);
    }

    // Add a group for unsessioned images
    groups.set("unsessioned", []);

    // Distribute history items to groups based on timestamp proximity to sessions
    // Note: In production, this would use session_id from generations
    // For now, we approximate by checking if the image timestamp falls within session bounds
    for (const image of history) {
      let assigned = false;
      for (const session of sessions) {
        const sessionStart = new Date(session.started_at).getTime();
        const sessionEnd = session.ended_at
          ? new Date(session.ended_at).getTime()
          : Date.now();

        if (image.timestamp >= sessionStart && image.timestamp <= sessionEnd) {
          groups.get(session.id)?.push(image);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        groups.get("unsessioned")?.push(image);
      }
    }

    return groups;
  }, [history, sessions]);

  // Render a single image thumbnail
  const renderImageThumbnail = (image: GeneratedImage) => {
    const isPending = image.status === "pending" || !image.url;

    return (
      <motion.button
        key={image.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => !isPending && selectImage(image)}
        disabled={isPending}
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden group",
          "border border-border transition-colors",
          isPending
            ? "cursor-default border-dashed"
            : "hover:border-foreground/30",
          selectedImage?.id === image.id && !isPending && "ring-2 ring-foreground"
        )}
      >
        {isPending ? (
          // Pending/loading state
          <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center gap-2">
            <div className="size-6 border-2 border-muted-foreground/30 border-t-blue-500 rounded-full animate-spin" aria-hidden="true" />
            <span className="text-[10px] font-mono text-muted-foreground">Generating…</span>
          </div>
        ) : (
          <Image
            src={image.url}
            alt={image.prompt || "Generated"}
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {/* Hover overlay - only for completed images */}
        {!isPending && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleUseAsReference(e, image.url)}
                    aria-label="Use as reference image"
                    className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ImagePlus className="size-3.5 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Use as reference</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleDownload(e, image.url, image.id)}
                    aria-label="Download image"
                    className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Download className="size-3.5 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              {image.prompt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => handleCopyPrompt(e, image.prompt)}
                      aria-label="Copy prompt"
                      className="size-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Copy className="size-3.5 text-zinc-900" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy prompt</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Time badge or pending badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
          {isPending ? "Queued" : formatTime(image.timestamp)}
        </div>
      </motion.button>
    );
  };

  // Render a session group
  const renderSessionGroup = (session: SessionWithCount, images: GeneratedImage[]) => {
    const isExpanded = expandedSessions.has(session.id);
    const isCurrentSession = session.id === currentSessionId;
    const sessionName = session.name || `Session`;

    return (
      <div key={session.id} className="border-b border-border last:border-b-0">
        {/* Session header */}
        <button
          onClick={() => toggleSessionExpanded(session.id)}
          aria-expanded={isExpanded}
          aria-label={`${sessionName}: ${session.generation_count} images, ${formatSessionTime(session.started_at)}`}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left",
            isCurrentSession && "bg-muted/30"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground flex-shrink-0" />
          )}

          {/* Session thumbnail */}
          {session.first_image_url ? (
            <div className="size-6 rounded overflow-hidden flex-shrink-0">
              <Image
                src={session.first_image_url}
                alt=""
                width={24}
                height={24}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
          ) : (
            <div className="size-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <FolderOpen className="size-3 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium truncate">{sessionName}</span>
              {isCurrentSession && (
                <span className="px-1 py-0.5 text-[9px] rounded bg-foreground text-background font-mono">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <span>{session.generation_count} images</span>
              <span>·</span>
              <span>{formatSessionTime(session.started_at)}</span>
            </div>
          </div>

          {/* Session actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                className="size-7 rounded hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Options for ${sessionName}`}
              >
                <MoreHorizontal className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setSessionToDelete(session.id)}>
                <Trash2 className="size-3.5 mr-2" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </button>

        {/* Session images */}
        {images.length > 0 && (
          <div
            className={cn(
              "grid transition-all duration-200",
              isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2 p-2 bg-muted/20">
                {images.map(renderImageThumbnail)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Clear History Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all {history.length} generation
              {history.length !== 1 ? "s" : ""} from history? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session and all its images? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Session Dialog */}
      <AlertDialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Session</AlertDialogTitle>
            <AlertDialogDescription>
              Start a new session to organize your generations. You can name it now or
              leave it blank for an auto-generated name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Session name (optional)"
            aria-label="Session name"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus:outline-none"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSession}>
              Create Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TooltipProvider delayDuration={300}>
        <div className="absolute top-4 right-4 z-20">
          <AnimatePresence initial={false} mode="wait">
            {historyPanelOpen ? (
              <motion.div
                key="panel"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-72 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-mono font-medium">History</span>
                    {history.length > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({history.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* New Session Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowNewSessionDialog(true)}
                          aria-label="New session"
                          className="size-7 rounded-lg"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New session</TooltipContent>
                    </Tooltip>

                    {/* View Toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHistoryGroupedBySession(!historyGroupedBySession)}
                          aria-label={historyGroupedBySession ? "Show flat view" : "Show grouped view"}
                          className={cn(
                            "size-7 rounded-lg",
                            historyGroupedBySession && "bg-muted"
                          )}
                        >
                          <FolderOpen className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {historyGroupedBySession ? "Flat view" : "Group by session"}
                      </TooltipContent>
                    </Tooltip>

                    {history.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowClearConfirm(true)}
                            aria-label="Clear history"
                            className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear history</TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleHistoryPanel}
                      aria-label="Close history panel"
                      className="size-7 rounded-lg"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="h-[320px]">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Layers
                        className="size-8 text-muted-foreground/30 mb-2"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        No generations yet
                      </p>
                    </div>
                  ) : historyGroupedBySession && sessions.length > 0 ? (
                    // Grouped view
                    <div>
                      {sessions.map((session) =>
                        renderSessionGroup(session, groupedHistory.get(session.id) || [])
                      )}
                      {/* Unsessioned images */}
                      {(groupedHistory.get("unsessioned")?.length || 0) > 0 && (
                        <div className="border-b border-border">
                          <div className="px-3 py-2 text-xs text-muted-foreground font-mono">
                            Earlier
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-2">
                            {groupedHistory.get("unsessioned")?.map(renderImageThumbnail)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Flat view
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {history.map(renderImageThumbnail)}
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
                      onClick={toggleHistoryPanel}
                      aria-label="Open history"
                      className="size-10 rounded-xl bg-background/95 backdrop-blur-xl border-border shadow-lg"
                    >
                      <Layers className="size-4" aria-hidden="true" />
                      {history.length > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-foreground text-background text-[10px] font-mono flex items-center justify-center">
                          {history.length > 9 ? "9+" : history.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">History</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </>
  );
}
