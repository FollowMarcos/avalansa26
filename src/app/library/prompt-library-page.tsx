"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Prompt, PromptFolder, PromptTag, PromptShareWithDetails, PromptImage } from "@/types/prompt";
import {
  getPromptsWithImages,
  getPromptFolders,
  getPromptTags,
  deletePrompt,
  togglePromptFavorite,
  createPromptFolder,
  createPromptTag,
  getReceivedPromptShares,
  markShareAsSeen,
  savePrompt,
  addPromptToFolder,
  addTagToPrompt,
  sharePromptWithUser,
  uploadPromptImage,
  deletePromptImage,
} from "@/utils/supabase/prompts.server";
import { createClient } from "@/utils/supabase/client";
import {
  BookMarked,
  Search,
  X,
  Folder,
  FolderPlus,
  Heart,
  Clock,
  Sparkles,
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Trash2,
  Share2,
  Copy,
  MoreHorizontal,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { resizeImageToSize, PROMPT_IMAGE_MAX_SIZE } from "@/lib/image-utils";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

type ViewMode = "grid" | "list";
type ActiveTab = "my-prompts" | "shared";
type FilterSection = "all" | "favorites" | "recent" | string;

export function PromptLibraryPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Data state
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [folders, setFolders] = React.useState<PromptFolder[]>([]);
  const [tags, setTags] = React.useState<PromptTag[]>([]);
  const [sharedPrompts, setSharedPrompts] = React.useState<PromptShareWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // UI state
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("my-prompts");
  const [activeSection, setActiveSection] = React.useState<FilterSection>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [newFolderDialogOpen, setNewFolderDialogOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);

  // Add prompt dialog state
  const [addPromptDialogOpen, setAddPromptDialogOpen] = React.useState(false);
  const [newPromptName, setNewPromptName] = React.useState("");
  const [newPromptText, setNewPromptText] = React.useState("");
  const [newPromptDescription, setNewPromptDescription] = React.useState("");
  const [isSavingPrompt, setIsSavingPrompt] = React.useState(false);
  const [newPromptImages, setNewPromptImages] = React.useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [promptToShare, setPromptToShare] = React.useState<Prompt | null>(null);
  const [shareSearchQuery, setShareSearchQuery] = React.useState("");
  const [shareSearchResults, setShareSearchResults] = React.useState<Array<{ id: string; username: string | null; avatar_url: string | null }>>([]);
  const [selectedShareUsers, setSelectedShareUsers] = React.useState<Array<{ id: string; username: string | null; avatar_url: string | null }>>([]);
  const [shareMessage, setShareMessage] = React.useState("");
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const shareSearchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [promptsData, foldersData, tagsData, sharesData] = await Promise.all([
        getPromptsWithImages(200, 0),
        getPromptFolders(),
        getPromptTags(),
        getReceivedPromptShares(),
      ]);
      setPrompts(promptsData);
      setFolders(foldersData);
      setTags(tagsData);
      setSharedPrompts(sharesData);
    } catch (error) {
      console.error("Failed to load library:", error);
      toast.error("Failed to load library");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter prompts based on search and section
  const filteredPrompts = React.useMemo(() => {
    let filtered = prompts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.prompt_text.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (activeSection === "favorites") {
      filtered = filtered.filter((p) => p.is_favorite);
    } else if (activeSection === "recent") {
      filtered = [...filtered]
        .filter((p) => p.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 20);
    } else if (activeSection !== "all") {
      // Filter by folder ID - would need folder items data
    }

    return filtered;
  }, [prompts, searchQuery, activeSection]);

  // Filter shared prompts
  const filteredSharedPrompts = React.useMemo(() => {
    if (!searchQuery) return sharedPrompts;
    const query = searchQuery.toLowerCase();
    return sharedPrompts.filter(
      (s) =>
        s.prompt.name.toLowerCase().includes(query) ||
        s.prompt.prompt_text.toLowerCase().includes(query)
    );
  }, [sharedPrompts, searchQuery]);

  const favoriteCount = prompts.filter((p) => p.is_favorite).length;
  const unseenShareCount = sharedPrompts.filter((s) => !s.is_seen).length;

  const handleDeletePrompt = async (promptId: string) => {
    const success = await deletePrompt(promptId);
    if (success) {
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      toast.success("Prompt deleted");
    } else {
      toast.error("Failed to delete prompt");
    }
  };

  const handleToggleFavorite = async (promptId: string, isFavorite: boolean) => {
    await togglePromptFavorite(promptId, isFavorite);
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === promptId ? { ...p, is_favorite: isFavorite } : p
      )
    );
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleUseInCreate = (prompt: Prompt) => {
    // Store prompt in sessionStorage for create page to pick up
    sessionStorage.setItem("loadPrompt", JSON.stringify(prompt));
    router.push("/create");
  };

  const handleMarkShareSeen = async (shareId: string) => {
    await markShareAsSeen(shareId);
    setSharedPrompts((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, is_seen: true } : s))
    );
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folder = await createPromptFolder({ name: newFolderName.trim() });
      if (folder) {
        setFolders((prev) => [...prev, folder]);
        setNewFolderName("");
        setNewFolderDialogOpen(false);
        toast.success("Folder created");
      }
    } catch {
      toast.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 3 images total
    const remainingSlots = 3 - newPromptImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image${remainingSlots !== 1 ? "s" : ""} allowed`);
    }

    // Resize images and create preview URLs
    const resizedFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of filesToAdd) {
      try {
        const { blob } = await resizeImageToSize(file, PROMPT_IMAGE_MAX_SIZE);
        const resizedFile = new File([blob], file.name, { type: "image/jpeg" });
        resizedFiles.push(resizedFile);
        previewUrls.push(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to resize image:", error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    setNewPromptImages((prev) => [...prev, ...resizedFiles]);
    setImagePreviewUrls((prev) => [...prev, ...previewUrls]);

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Remove an image from selection
  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setNewPromptImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Add new prompt handler
  const handleAddPrompt = async () => {
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast.error("Please enter a name and prompt text");
      return;
    }

    setIsSavingPrompt(true);
    try {
      // Save prompt first
      const prompt = await savePrompt({
        name: newPromptName.trim(),
        description: newPromptDescription.trim() || undefined,
        prompt_text: newPromptText.trim(),
      });

      if (prompt) {
        // Upload images if any
        const uploadedImages: PromptImage[] = [];
        for (const file of newPromptImages) {
          const formData = new FormData();
          formData.append("file", file);
          const image = await uploadPromptImage(prompt.id, formData);
          if (image) {
            uploadedImages.push(image);
          }
        }

        // Add prompt with images to state
        setPrompts((prev) => [{ ...prompt, images: uploadedImages }, ...prev]);

        // Reset form
        setNewPromptName("");
        setNewPromptText("");
        setNewPromptDescription("");
        // Clean up preview URLs
        imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        setNewPromptImages([]);
        setImagePreviewUrls([]);
        setAddPromptDialogOpen(false);

        toast.success("Prompt added to library");
      }
    } catch {
      toast.error("Failed to add prompt");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Share dialog handlers
  const handleOpenShareDialog = (prompt: Prompt) => {
    setPromptToShare(prompt);
    setShareDialogOpen(true);
    setShareSearchQuery("");
    setShareSearchResults([]);
    setSelectedShareUsers([]);
    setShareMessage("");
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setPromptToShare(null);
    setShareSearchQuery("");
    setShareSearchResults([]);
    setSelectedShareUsers([]);
    setShareMessage("");
  };

  // User search for sharing
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
        .limit(10);

      if (!error && data) {
        // Filter out already selected users
        const selectedIds = new Set(selectedShareUsers.map((u) => u.id));
        setShareSearchResults(data.filter((u) => !selectedIds.has(u.id)));
      }
      setIsSearchingUsers(false);
    }, 300);

    return () => {
      if (shareSearchTimeoutRef.current) {
        clearTimeout(shareSearchTimeoutRef.current);
      }
    };
  }, [shareSearchQuery, selectedShareUsers]);

  const handleSelectShareUser = (user: { id: string; username: string | null; avatar_url: string | null }) => {
    setSelectedShareUsers((prev) => [...prev, user]);
    setShareSearchQuery("");
    setShareSearchResults([]);
  };

  const handleRemoveShareUser = (userId: string) => {
    setSelectedShareUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSharePrompt = async () => {
    if (!promptToShare || selectedShareUsers.length === 0) return;

    setIsSharing(true);
    try {
      await Promise.all(
        selectedShareUsers.map((user) =>
          sharePromptWithUser({
            prompt_id: promptToShare.id,
            shared_with: user.id,
            message: shareMessage.trim() || undefined,
          })
        )
      );
      toast.success(`Shared with ${selectedShareUsers.length} user${selectedShareUsers.length > 1 ? "s" : ""}`);
      handleCloseShareDialog();
    } catch {
      toast.error("Failed to share prompt");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <Link href="/create">
                    <ArrowLeft className="size-4" />
                    <span className="sr-only">Back to Create</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    <BookMarked className="size-5 text-primary" />
                    Prompt Library
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {prompts.length} prompts saved
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center border rounded-lg p-0.5">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="size-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setAddPromptDialogOpen(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Add Prompt
                </Button>

                <Button asChild>
                  <Link href="/create">
                    <Sparkles className="size-4 mr-2" />
                    Create
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 hidden md:block">
              <div className="sticky top-24 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as ActiveTab)}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="my-prompts" className="flex-1">
                      My Prompts
                    </TabsTrigger>
                    <TabsTrigger value="shared" className="flex-1 relative">
                      Shared
                      {unseenShareCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                          {unseenShareCount}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Sections (only for My Prompts tab) */}
                {activeTab === "my-prompts" && (
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveSection("all")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        activeSection === "all"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Sparkles className="size-4" />
                      All Prompts
                      <span className="ml-auto text-muted-foreground">
                        {prompts.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveSection("favorites")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        activeSection === "favorites"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Heart className="size-4" />
                      Favorites
                      {favoriteCount > 0 && (
                        <span className="ml-auto text-muted-foreground">
                          {favoriteCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveSection("recent")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        activeSection === "recent"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Clock className="size-4" />
                      Recently Used
                    </button>

                    {/* Folders section */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between px-3 mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          Folders
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => setNewFolderDialogOpen(true)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>

                      {folders.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-3 py-2">
                          No folders yet
                        </p>
                      ) : (
                        folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => setActiveSection(folder.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                              activeSection === folder.id
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <Folder
                              className="size-4"
                              style={{ color: folder.color || undefined }}
                            />
                            <span className="truncate">{folder.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </nav>
                )}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeTab === "my-prompts" ? (
                <MyPromptsView
                  prompts={filteredPrompts}
                  viewMode={viewMode}
                  onDelete={handleDeletePrompt}
                  onToggleFavorite={handleToggleFavorite}
                  onCopy={handleCopyPrompt}
                  onUseInCreate={handleUseInCreate}
                  onShare={handleOpenShareDialog}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ) : (
                <SharedPromptsView
                  shares={filteredSharedPrompts}
                  viewMode={viewMode}
                  onMarkSeen={handleMarkShareSeen}
                  onCopy={handleCopyPrompt}
                  onUseInCreate={handleUseInCreate}
                  prefersReducedMotion={prefersReducedMotion}
                />
              )}
            </main>
          </div>
        </div>

        {/* New Folder Dialog */}
        <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="size-4" />
                New Folder
              </DialogTitle>
              <DialogDescription>
                Create a folder to organize your prompts
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My folder"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                }}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <FolderPlus className="size-4 mr-2" />
                )}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Prompt Dialog */}
        <Dialog open={addPromptDialogOpen} onOpenChange={setAddPromptDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="size-4" />
                Add New Prompt
              </DialogTitle>
              <DialogDescription>
                Create a new prompt to save in your library
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-prompt-name">Name</Label>
                <Input
                  id="new-prompt-name"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="My awesome prompt"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-prompt-text">Prompt</Label>
                <Textarea
                  id="new-prompt-text"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Enter your prompt text..."
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-prompt-description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="new-prompt-description"
                  value={newPromptDescription}
                  onChange={(e) => setNewPromptDescription(e.target.value)}
                  placeholder="What is this prompt for?"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>
                  Images{" "}
                  <span className="text-muted-foreground font-normal">(up to 3, optional)</span>
                </Label>

                {/* Image previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 size-5 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {newPromptImages.length < 3 && (
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="prompt-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full"
                    >
                      <ImagePlus className="size-4 mr-2" />
                      Add Images ({newPromptImages.length}/3)
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Images will be resized to 500KB max
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddPromptDialogOpen(false)}
                disabled={isSavingPrompt}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPrompt}
                disabled={!newPromptName.trim() || !newPromptText.trim() || isSavingPrompt}
              >
                {isSavingPrompt ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BookMarked className="size-4 mr-2" />
                    Add to Library
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Prompt Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={(open) => !open && handleCloseShareDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="size-4" />
                Share Prompt
              </DialogTitle>
              <DialogDescription>
                Share "{promptToShare?.name}" with other users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* User search */}
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

                {/* Search results */}
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

                {/* Selected users */}
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

              {/* Optional message */}
              <div className="space-y-2">
                <Label htmlFor="share-message">
                  Message{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
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
                onClick={handleCloseShareDialog}
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSharePrompt}
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

// ============================================
// My Prompts View
// ============================================

// Smooth easing for card animations
const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];

interface MyPromptsViewProps {
  prompts: Prompt[];
  viewMode: ViewMode;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onCopy: (text: string) => void;
  onUseInCreate: (prompt: Prompt) => void;
  onShare: (prompt: Prompt) => void;
  prefersReducedMotion: boolean | null;
}

function MyPromptsView({
  prompts,
  viewMode,
  onDelete,
  onToggleFavorite,
  onCopy,
  onUseInCreate,
  onShare,
  prefersReducedMotion,
}: MyPromptsViewProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookMarked className="size-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No prompts yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Save prompts from the Create studio using the bookmark button to see them here.
        </p>
        <Button asChild>
          <Link href="/create">
            <Sparkles className="size-4 mr-2" />
            Go to Create
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-2"
      )}
    >
      <AnimatePresence mode="popLayout">
        {prompts.map((prompt, index) => (
          <PromptLibraryCard
            key={prompt.id}
            prompt={prompt}
            index={index}
            viewMode={viewMode}
            onDelete={() => onDelete(prompt.id)}
            onToggleFavorite={() =>
              onToggleFavorite(prompt.id, !prompt.is_favorite)
            }
            onCopy={() => onCopy(prompt.prompt_text)}
            onUseInCreate={() => onUseInCreate(prompt)}
            onShare={() => onShare(prompt)}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Shared Prompts View
// ============================================

interface SharedPromptsViewProps {
  shares: PromptShareWithDetails[];
  viewMode: ViewMode;
  onMarkSeen: (shareId: string) => void;
  onCopy: (text: string) => void;
  onUseInCreate: (prompt: Prompt) => void;
  prefersReducedMotion: boolean | null;
}

function SharedPromptsView({
  shares,
  viewMode,
  onMarkSeen,
  onCopy,
  onUseInCreate,
  prefersReducedMotion,
}: SharedPromptsViewProps) {
  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="size-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No shared prompts</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          When someone shares a prompt with you, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-2"
      )}
    >
      <AnimatePresence mode="popLayout">
        {shares.map((share, index) => (
          <SharedPromptCard
            key={share.id}
            share={share}
            index={index}
            viewMode={viewMode}
            onMarkSeen={() => onMarkSeen(share.id)}
            onCopy={() => onCopy(share.prompt.prompt_text)}
            onUseInCreate={() => onUseInCreate(share.prompt)}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Prompt Library Card
// ============================================

interface PromptLibraryCardProps {
  prompt: Prompt;
  index: number;
  viewMode: ViewMode;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onUseInCreate: () => void;
  onShare: () => void;
  prefersReducedMotion: boolean | null;
}

function PromptLibraryCard({
  prompt,
  index,
  viewMode,
  onDelete,
  onToggleFavorite,
  onCopy,
  onUseInCreate,
  onShare,
  prefersReducedMotion,
}: PromptLibraryCardProps) {
  // Check if prompt has images
  const hasImages = prompt.images && prompt.images.length > 0;

  return (
    <Link href={`/library/${prompt.id}`} className="block">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.2,
          delay: prefersReducedMotion ? 0 : index * 0.03,
          ease: EASE_OUT,
        }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
        className={cn(
          "group relative rounded-2xl border bg-card overflow-hidden",
          "transition-shadow duration-200",
          viewMode === "list"
            ? "flex items-center gap-4 p-3 hover:bg-accent/50"
            : "flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:z-10"
        )}
      >
      {/* Image thumbnails (grid view only) */}
      {viewMode === "grid" && hasImages && (
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {prompt.images!.length === 1 ? (
            <Image
              src={prompt.images![0].url}
              alt=""
              fill
              className="object-cover"
            />
          ) : prompt.images!.length === 2 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
              {prompt.images!.slice(0, 2).map((img, i) => (
                <div key={img.id} className="relative">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 grid grid-cols-3 gap-0.5">
              {prompt.images!.slice(0, 3).map((img, i) => (
                <div key={img.id} className="relative">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1 min-w-0",
        viewMode === "list" ? "flex items-center gap-4" : "p-4"
      )}>
        <div className={cn("flex-1 min-w-0", viewMode === "list" && "flex items-center gap-4")}>
          {/* Header */}
          <div className={cn(viewMode === "list" ? "flex items-center gap-2 min-w-0" : "mb-1.5")}>
            <h3 className="font-semibold tracking-tight truncate">{prompt.name}</h3>
            {prompt.is_favorite && (
              <Heart className="size-3.5 text-red-500 fill-red-500 shrink-0" />
            )}
          </div>

          {/* Description */}
          {prompt.description && viewMode === "grid" && (
            <p className="text-sm text-muted-foreground truncate mb-2 leading-tight">
              {prompt.description}
            </p>
          )}

          {/* Prompt preview */}
          <p
            className={cn(
              "text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-2.5 py-2 leading-relaxed",
              viewMode === "grid" ? "line-clamp-2" : "line-clamp-1 flex-1"
            )}
          >
            {prompt.prompt_text}
          </p>

          {/* Meta */}
          {viewMode === "grid" && (
            <div className="flex items-center gap-2 mt-3">
              {prompt.use_count > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium">
                  <Sparkles className="size-2.5 mr-1" />
                  Used {prompt.use_count}x
                </Badge>
              )}
              {prompt.original_author_id && (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  Shared
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-1",
            viewMode === "grid"
              ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              : ""
          )}
          onClick={(e) => e.preventDefault()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  onUseInCreate();
                }}
              >
                <ExternalLink className="size-3.5 mr-1" />
                Use
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use in Create</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCopy}>
                <Copy className="size-3.5 mr-2" />
                Copy prompt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Heart
                  className={cn(
                    "size-3.5 mr-2",
                    prompt.is_favorite && "fill-current"
                  )}
                />
                {prompt.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="size-3.5 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// Shared Prompt Card
// ============================================

interface SharedPromptCardProps {
  share: PromptShareWithDetails;
  index: number;
  viewMode: ViewMode;
  onMarkSeen: () => void;
  onCopy: () => void;
  onUseInCreate: () => void;
  prefersReducedMotion: boolean | null;
}

function SharedPromptCard({
  share,
  index,
  viewMode,
  onMarkSeen,
  onCopy,
  onUseInCreate,
  prefersReducedMotion,
}: SharedPromptCardProps) {
  const { prompt, sharer, is_seen, message } = share;

  // Check if prompt has images
  const hasImages = prompt.images && prompt.images.length > 0;

  // Mark as seen when card is rendered and not yet seen
  React.useEffect(() => {
    if (!is_seen) {
      onMarkSeen();
    }
  }, [is_seen, onMarkSeen]);

  return (
    <Link href={`/library/${prompt.id}`} className="block">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.2,
          delay: prefersReducedMotion ? 0 : index * 0.03,
          ease: EASE_OUT,
        }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
        className={cn(
          "group relative rounded-2xl border bg-card overflow-hidden",
          "transition-shadow duration-200",
          viewMode === "list"
            ? "flex items-center gap-4 p-3 hover:bg-accent/50"
            : "flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:z-10",
          !is_seen && "ring-2 ring-primary/50"
        )}
      >
      {/* New badge */}
      {!is_seen && (
        <Badge className="absolute top-3 right-3 z-10 text-[10px]">New</Badge>
      )}

      {/* Image thumbnails (grid view only) */}
      {viewMode === "grid" && hasImages && (
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {prompt.images!.length === 1 ? (
            <Image
              src={prompt.images![0].url}
              alt=""
              fill
              className="object-cover"
            />
          ) : prompt.images!.length === 2 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
              {prompt.images!.slice(0, 2).map((img) => (
                <div key={img.id} className="relative">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 grid grid-cols-3 gap-0.5">
              {prompt.images!.slice(0, 3).map((img) => (
                <div key={img.id} className="relative">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1 min-w-0",
        viewMode === "list" ? "flex items-center gap-4" : "p-4"
      )}>
        <div className={cn("flex-1 min-w-0", viewMode === "list" && "flex items-center gap-4")}>
          {/* Header */}
          <div className={cn(viewMode === "list" ? "flex items-center gap-2 min-w-0" : "mb-1.5")}>
            <h3 className="font-semibold tracking-tight truncate">{prompt.name}</h3>
          </div>

          {/* Sharer info */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Users className="size-3" />
            <span>From {sharer.username || "Unknown"}</span>
          </div>

          {/* Message */}
          {message && viewMode === "grid" && (
            <p className="text-sm text-muted-foreground italic mb-2 line-clamp-2 leading-tight">
              "{message}"
            </p>
          )}

          {/* Prompt preview */}
          <p
            className={cn(
              "text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-2.5 py-2 leading-relaxed",
              viewMode === "grid" ? "line-clamp-2" : "line-clamp-1 flex-1"
            )}
          >
            {prompt.prompt_text}
          </p>
        </div>
      </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-1",
            viewMode === "grid"
              ? "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              : "",
            !is_seen && viewMode === "grid" && "right-16"
          )}
          onClick={(e) => e.preventDefault()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  onUseInCreate();
                }}
              >
                <ExternalLink className="size-3.5 mr-1" />
                Use
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use in Create</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => {
                  e.preventDefault();
                  onCopy();
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy prompt</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </Link>
  );
}
