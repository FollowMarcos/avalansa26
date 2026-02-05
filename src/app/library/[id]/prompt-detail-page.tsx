"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Prompt, PromptImage } from "@/types/prompt";
import type { PromptShareHistoryEntry, PromptShareSource } from "@/utils/supabase/prompts.server";
import {
  getPromptShareHistory,
  getPromptShareSource,
  getOriginalAuthor,
  deletePrompt,
  togglePromptFavorite,
  sharePromptWithUser,
  uploadPromptImage,
  deletePromptImage,
} from "@/utils/supabase/prompts.server";
import { createClient } from "@/utils/supabase/client";
import { resizeImageToSize, PROMPT_IMAGE_MAX_SIZE } from "@/lib/image-utils";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Share2,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
  Users,
  ImagePlus,
  X,
  Loader2,
  Search,
  Check,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PromptDetailPageProps {
  promptId: string;
  initialPrompt: Prompt;
}

export function PromptDetailPage({ promptId, initialPrompt }: PromptDetailPageProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Prompt state
  const [prompt, setPrompt] = React.useState<Prompt>(initialPrompt);
  const [isOwner, setIsOwner] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Share history state
  const [shareHistory, setShareHistory] = React.useState<PromptShareHistoryEntry[]>([]);
  const [shareSource, setShareSource] = React.useState<PromptShareSource | null>(null);
  const [originalAuthor, setOriginalAuthor] = React.useState<{
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [isLoadingShareInfo, setIsLoadingShareInfo] = React.useState(true);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareSearchQuery, setShareSearchQuery] = React.useState("");
  const [shareSearchResults, setShareSearchResults] = React.useState<
    Array<{ id: string; username: string | null; avatar_url: string | null }>
  >([]);
  const [selectedShareUsers, setSelectedShareUsers] = React.useState<
    Array<{ id: string; username: string | null; avatar_url: string | null }>
  >([]);
  const [shareMessage, setShareMessage] = React.useState("");
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const shareSearchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Action states
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load share info on mount
  React.useEffect(() => {
    loadShareInfo();
  }, [promptId]);

  const loadShareInfo = async () => {
    setIsLoadingShareInfo(true);

    // Get current user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setIsOwner(prompt.user_id === user.id);
    }

    // Load share history (if owner)
    if (user && prompt.user_id === user.id) {
      const history = await getPromptShareHistory(promptId);
      setShareHistory(history);
    }

    // Load share source (if shared with user)
    const source = await getPromptShareSource(promptId);
    setShareSource(source);

    // Load original author info (if this is a copy)
    if (prompt.original_author_id) {
      const author = await getOriginalAuthor(prompt.original_author_id);
      setOriginalAuthor(author);
    }

    setIsLoadingShareInfo(false);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    const newValue = !prompt.is_favorite;
    setPrompt((prev) => ({ ...prev, is_favorite: newValue }));
    await togglePromptFavorite(promptId, newValue);
    toast.success(newValue ? "Added to favorites" : "Removed from favorites");
  };

  // Handle copy prompt text
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Handle use in create
  const handleUseInCreate = () => {
    sessionStorage.setItem("loadPrompt", JSON.stringify(prompt));
    router.push("/create");
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deletePrompt(promptId);
    if (success) {
      toast.success("Prompt deleted");
      router.push("/library");
    } else {
      toast.error("Failed to delete prompt");
      setIsDeleting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((prompt.images?.length ?? 0) >= 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    setIsUploadingImage(true);
    try {
      const { blob } = await resizeImageToSize(file, PROMPT_IMAGE_MAX_SIZE);
      const resizedFile = new File([blob], file.name, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", resizedFile);

      const image = await uploadPromptImage(promptId, formData);
      if (image) {
        setPrompt((prev) => ({
          ...prev,
          images: [...(prev.images ?? []), image],
        }));
        toast.success("Image added");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Handle image delete
  const handleDeleteImage = async (imageId: string) => {
    const success = await deletePromptImage(imageId);
    if (success) {
      setPrompt((prev) => ({
        ...prev,
        images: prev.images?.filter((img) => img.id !== imageId),
      }));
      toast.success("Image removed");
    } else {
      toast.error("Failed to remove image");
    }
  };

  // Share dialog - user search
  React.useEffect(() => {
    if (shareSearchTimeoutRef.current) {
      clearTimeout(shareSearchTimeoutRef.current);
    }

    if (!shareSearchQuery.trim()) {
      setShareSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    shareSearchTimeoutRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${shareSearchQuery}%`)
        .neq("id", currentUserId)
        .limit(10);

      if (!error && data) {
        const selectedIds = new Set(selectedShareUsers.map((u) => u.id));
        const alreadySharedIds = new Set(shareHistory.map((s) => s.shared_with));
        setShareSearchResults(
          data.filter((u) => !selectedIds.has(u.id) && !alreadySharedIds.has(u.id))
        );
      }
      setIsSearchingUsers(false);
    }, 300);

    return () => {
      if (shareSearchTimeoutRef.current) {
        clearTimeout(shareSearchTimeoutRef.current);
      }
    };
  }, [shareSearchQuery, selectedShareUsers, shareHistory, currentUserId]);

  const handleSelectShareUser = (
    user: { id: string; username: string | null; avatar_url: string | null }
  ) => {
    setSelectedShareUsers((prev) => [...prev, user]);
    setShareSearchQuery("");
    setShareSearchResults([]);
  };

  const handleRemoveShareUser = (userId: string) => {
    setSelectedShareUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleShare = async () => {
    if (selectedShareUsers.length === 0) return;

    setIsSharing(true);
    try {
      await Promise.all(
        selectedShareUsers.map((user) =>
          sharePromptWithUser({
            prompt_id: promptId,
            shared_with: user.id,
            message: shareMessage.trim() || undefined,
          })
        )
      );

      // Refresh share history
      const history = await getPromptShareHistory(promptId);
      setShareHistory(history);

      toast.success(`Shared with ${selectedShareUsers.length} user${selectedShareUsers.length > 1 ? "s" : ""}`);
      setShareDialogOpen(false);
      setSelectedShareUsers([]);
      setShareMessage("");
    } catch {
      toast.error("Failed to share prompt");
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <Link href="/library">
                    <ArrowLeft className="size-4" />
                    <span className="sr-only">Back to Library</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    {prompt.name}
                    {prompt.is_favorite && (
                      <Heart className="size-4 text-red-500 fill-red-500" />
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(prompt.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleFavorite}
                    >
                      <Heart
                        className={cn(
                          "size-4",
                          prompt.is_favorite && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>

                {isOwner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShareDialogOpen(true)}
                      >
                        <Share2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share prompt</TooltipContent>
                  </Tooltip>
                )}

                <Button onClick={handleUseInCreate}>
                  <Sparkles className="size-4 mr-2" />
                  Use in Create
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="space-y-8"
          >
            {/* Images Section */}
            {((prompt.images && prompt.images.length > 0) || isOwner) && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Images</h2>
                  {isOwner && (prompt.images?.length ?? 0) < 3 && (
                    <div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="detail-image-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <ImagePlus className="size-4 mr-2" />
                        )}
                        Add Image
                      </Button>
                    </div>
                  )}
                </div>

                {prompt.images && prompt.images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prompt.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                      >
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute top-2 right-2 size-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : isOwner ? (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                    <ImagePlus className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No images yet. Add up to 3 images to showcase this prompt.
                    </p>
                  </div>
                ) : null}
              </section>
            )}

            {/* Prompt Text Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Prompt</h2>
                <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                  <Copy className="size-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 font-mono text-sm leading-relaxed">
                {prompt.prompt_text}
              </div>

              {prompt.negative_prompt && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Negative Prompt</Label>
                  <div className="rounded-xl bg-red-500/10 p-4 font-mono text-sm leading-relaxed">
                    <span className="text-red-500 font-semibold">Negative:</span>{" "}
                    {prompt.negative_prompt}
                  </div>
                </div>
              )}
            </section>

            {/* Description Section */}
            {prompt.description && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="text-muted-foreground">{prompt.description}</p>
              </section>
            )}

            {/* Settings Section */}
            {prompt.settings && Object.keys(prompt.settings).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings2 className="size-4" />
                  Saved Settings
                </h2>
                <div className="flex flex-wrap gap-2">
                  {prompt.settings.aspectRatio && (
                    <Badge variant="outline">
                      Aspect: {prompt.settings.aspectRatio}
                    </Badge>
                  )}
                  {prompt.settings.imageSize && (
                    <Badge variant="outline">
                      Size: {prompt.settings.imageSize}
                    </Badge>
                  )}
                  {prompt.settings.model && (
                    <Badge variant="outline">
                      Model: {prompt.settings.model}
                    </Badge>
                  )}
                  {prompt.settings.outputCount && (
                    <Badge variant="outline">
                      Count: {prompt.settings.outputCount}
                    </Badge>
                  )}
                </div>
              </section>
            )}

            {/* Stats Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold">{prompt.use_count}</div>
                  <div className="text-sm text-muted-foreground">Times used</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold">{shareHistory.length}</div>
                  <div className="text-sm text-muted-foreground">Times shared</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-2xl font-bold">{prompt.images?.length ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Images</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-sm font-medium">{formatRelativeTime(prompt.updated_at)}</div>
                  <div className="text-sm text-muted-foreground">Last updated</div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Attribution Section */}
            {(shareSource || originalAuthor) && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="size-4" />
                  Attribution
                </h2>

                {shareSource && (
                  <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
                    {shareSource.sharer.avatar_url ? (
                      <Image
                        src={shareSource.sharer.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        Shared by @{shareSource.sharer.username || "unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(shareSource.created_at)}
                      </p>
                      {shareSource.message && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{shareSource.message}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {originalAuthor && (
                  <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
                    {originalAuthor.avatar_url ? (
                      <Image
                        src={originalAuthor.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        Originally by @{originalAuthor.username || "unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This prompt was copied from another user
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Share History Section (Owner only) */}
            {isOwner && shareHistory.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="size-4" />
                  Share History
                </h2>

                <div className="space-y-2">
                  {shareHistory.map((share) => (
                    <div
                      key={share.id}
                      className="rounded-xl border bg-card p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {share.recipient.avatar_url ? (
                          <Image
                            src={share.recipient.avatar_url}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-muted" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            @{share.recipient.username || "unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(share.created_at)}
                            {share.message && ` • "${share.message}"`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={share.is_seen ? "secondary" : "default"}>
                        {share.is_seen ? "Seen" : "New"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Danger Zone (Owner only) */}
            {isOwner && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete this prompt</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All images and shares will be deleted.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{prompt.name}" and all associated images.
                            Users you've shared this with will lose access. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="size-4" />
                Share Prompt
              </DialogTitle>
              <DialogDescription>
                Share "{prompt.name}" with other users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Share with</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    placeholder="Search users by username..."
                    className="pl-9"
                  />
                </div>

                {shareSearchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                    {shareSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectShareUser(user)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                      >
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="size-6 rounded-full bg-muted" />
                        )}
                        <span className="text-sm">{user.username || "Unknown"}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearchingUsers && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                  </div>
                )}

                {selectedShareUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedShareUsers.map((user) => (
                      <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                        {user.username || "Unknown"}
                        <button
                          onClick={() => handleRemoveShareUser(user.id)}
                          className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-message">
                  Message <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a note for the recipient..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={selectedShareUsers.length === 0 || isSharing}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="size-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
