"use client";

import * as React from "react";
import { Copy, Check, Link2, Trash2, Eye, EyeOff, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreate } from "./create-context";
import type { CanvasShare } from "@/types/share";

interface ShareCanvasDialogProps {
  children?: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareCanvasDialog({
  children,
  className,
  open: controlledOpen,
  onOpenChange,
}: ShareCanvasDialogProps) {
  const { currentCanvasId, canvasList } = useCreate();
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [shares, setShares] = React.useState<CanvasShare[]>([]);
  const [copied, setCopied] = React.useState<string | null>(null);

  // Form state for new share
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showPrompts, setShowPrompts] = React.useState(true);
  const [allowDownload, setAllowDownload] = React.useState(false);
  const [expiresIn, setExpiresIn] = React.useState<string>("never");

  const currentCanvas = canvasList.find(c => c.id === currentCanvasId);

  // Load existing shares when dialog opens
  React.useEffect(() => {
    if (open && currentCanvasId) {
      loadShares();
    }
  }, [open, currentCanvasId]);

  const loadShares = async () => {
    if (!currentCanvasId) return;
    setIsLoading(true);
    try {
      const { getCanvasShares } = await import("@/utils/supabase/shares.server");
      const canvasShares = await getCanvasShares(currentCanvasId);
      setShares(canvasShares);
    } catch (error) {
      console.error("Failed to load shares:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!currentCanvasId) return;

    setIsCreating(true);
    try {
      const { createShare } = await import("@/utils/supabase/shares.server");

      // Calculate expiration date
      let expiresAt: string | undefined;
      if (expiresIn !== "never") {
        const now = new Date();
        switch (expiresIn) {
          case "1h":
            now.setHours(now.getHours() + 1);
            break;
          case "24h":
            now.setHours(now.getHours() + 24);
            break;
          case "7d":
            now.setDate(now.getDate() + 7);
            break;
          case "30d":
            now.setDate(now.getDate() + 30);
            break;
        }
        expiresAt = now.toISOString();
      }

      const share = await createShare({
        canvas_id: currentCanvasId,
        title: title || currentCanvas?.name || "Untitled Canvas",
        description: description || undefined,
        show_prompts: showPrompts,
        allow_download: allowDownload,
        expires_at: expiresAt,
      });

      if (share) {
        setShares(prev => [share, ...prev]);
        // Reset form
        setTitle("");
        setDescription("");
        setShowPrompts(true);
        setAllowDownload(false);
        setExpiresIn("never");
        toast.success("Share link created");
      } else {
        toast.error("Failed to create share link");
      }
    } catch (error) {
      console.error("Failed to create share:", error);
      toast.error("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (shareId: string) => {
    try {
      const { deleteShare } = await import("@/utils/supabase/shares.server");
      const success = await deleteShare(shareId);
      if (success) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        toast.success("Share link deleted");
      } else {
        toast.error("Failed to delete share link");
      }
    } catch (error) {
      console.error("Failed to delete share:", error);
      toast.error("Failed to delete share link");
    }
  };

  const handleCopyLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/${token}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy link");
    }
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "Never";
    const expiry = new Date(expiresAt);
    if (expiry < new Date()) return "Expired";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(expiry);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Link2 className="size-4" aria-hidden="true" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Canvas</DialogTitle>
          <DialogDescription>
            Create a public link to share this canvas with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create new share form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-title">Title (optional)</Label>
              <Input
                id="share-title"
                placeholder={currentCanvas?.name || "Untitled Canvas"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-description">Description (optional)</Label>
              <Textarea
                id="share-description"
                placeholder="Add a description for this share..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-prompts" className="flex items-center gap-2 text-sm">
                  {showPrompts ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  Show prompts
                </Label>
                <Switch
                  id="show-prompts"
                  checked={showPrompts}
                  onCheckedChange={setShowPrompts}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="allow-download" className="flex items-center gap-2 text-sm">
                  <Download className="size-4" />
                  Allow downloads
                </Label>
                <Switch
                  id="allow-download"
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-in">Link expires</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger id="expires-in">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1h">In 1 hour</SelectItem>
                  <SelectItem value="24h">In 24 hours</SelectItem>
                  <SelectItem value="7d">In 7 days</SelectItem>
                  <SelectItem value="30d">In 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating || !currentCanvasId}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="size-4 mr-2" aria-hidden="true" />
                  Create Share Link
                </>
              )}
            </Button>
          </div>

          {/* Existing shares */}
          {shares.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Active Share Links</h4>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {share.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{share.view_count} views</span>
                        <span>•</span>
                        <span>Expires: {formatExpiry(share.expires_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopyLink(share.share_token)}
                      aria-label="Copy share link"
                    >
                      {copied === share.share_token ? (
                        <Check className="size-4 text-green-500" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(share.id)}
                      aria-label="Delete share link"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
