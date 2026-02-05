"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  Character,
  CharacterFolder,
  CharacterTag,
  CharacterImage,
} from "@/types/character";
import {
  getCharactersWithPreviewImages,
  getCharacterFolders,
  getCharacterTags,
  deleteCharacter,
  toggleCharacterFavorite,
  createCharacterFolder,
  createCharacterTag,
  saveCharacter,
  addCharacterToFolder,
  addTagToCharacter,
  uploadCharacterImage,
  deleteCharacterImage,
  getCharacterCount,
} from "@/utils/supabase/characters.server";
import {
  Users,
  Search,
  X,
  Folder,
  FolderPlus,
  Heart,
  Clock,
  Sparkles,
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Trash2,
  Copy,
  MoreHorizontal,
  ExternalLink,
  ImagePlus,
  User,
  Pencil,
  Tag,
  ChevronDown,
  Check,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type ViewMode = "grid" | "list";
type FilterSection = "all" | "favorites" | "recent" | string;

export function CharacterLibraryPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Data state
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const [folders, setFolders] = React.useState<CharacterFolder[]>([]);
  const [tags, setTags] = React.useState<CharacterTag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalCount, setTotalCount] = React.useState(0);

  // UI state
  const [activeSection, setActiveSection] = React.useState<FilterSection>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [newFolderDialogOpen, setNewFolderDialogOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);

  // Add character dialog state
  const [addCharacterDialogOpen, setAddCharacterDialogOpen] = React.useState(false);
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null);
  const [newCharacterName, setNewCharacterName] = React.useState("");
  const [newCharacterDescription, setNewCharacterDescription] = React.useState("");
  const [newPromptTemplate, setNewPromptTemplate] = React.useState("");
  const [newNegativePrompt, setNewNegativePrompt] = React.useState("");
  const [selectedFolderIds, setSelectedFolderIds] = React.useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [isSavingCharacter, setIsSavingCharacter] = React.useState(false);
  const [newCharacterImages, setNewCharacterImages] = React.useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [characterToDelete, setCharacterToDelete] = React.useState<Character | null>(null);

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [charactersData, foldersData, tagsData, count] = await Promise.all([
        getCharactersWithPreviewImages(200, 0, 3),
        getCharacterFolders(),
        getCharacterTags(),
        getCharacterCount(),
      ]);
      setCharacters(charactersData);
      setFolders(foldersData);
      setTags(tagsData);
      setTotalCount(count);
    } catch (error) {
      console.error("Failed to load characters:", error);
      toast.error("Failed to load characters");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter characters based on search and section
  const filteredCharacters = React.useMemo(() => {
    let filtered = characters;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.prompt_template.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    if (activeSection === "favorites") {
      filtered = filtered.filter((c) => c.is_favorite);
    } else if (activeSection === "recent") {
      filtered = [...filtered]
        .filter((c) => c.use_count > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 20);
    }

    return filtered;
  }, [characters, searchQuery, activeSection]);

  const favoriteCount = characters.filter((c) => c.is_favorite).length;

  // Handlers
  const handleDeleteCharacter = async (character: Character) => {
    setCharacterToDelete(character);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!characterToDelete) return;

    const success = await deleteCharacter(characterToDelete.id);
    if (success) {
      setCharacters((prev) => prev.filter((c) => c.id !== characterToDelete.id));
      toast.success("Character deleted");
    } else {
      toast.error("Failed to delete character");
    }
    setDeleteConfirmOpen(false);
    setCharacterToDelete(null);
  };

  const handleToggleFavorite = async (characterId: string, isFavorite: boolean) => {
    await toggleCharacterFavorite(characterId, isFavorite);
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, is_favorite: isFavorite } : c
      )
    );
  };

  const handleCopyPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      toast.success("Prompt copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folder = await createCharacterFolder({ name: newFolderName.trim() });
      if (folder) {
        setFolders((prev) => [...prev, folder]);
        setNewFolderName("");
        setNewFolderDialogOpen(false);
        toast.success("Folder created");
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const openAddDialog = (character?: Character) => {
    if (character) {
      setEditingCharacter(character);
      setNewCharacterName(character.name);
      setNewCharacterDescription(character.description || "");
      setNewPromptTemplate(character.prompt_template);
      setNewNegativePrompt(character.negative_prompt || "");
    } else {
      setEditingCharacter(null);
      setNewCharacterName("");
      setNewCharacterDescription("");
      setNewPromptTemplate("");
      setNewNegativePrompt("");
    }
    setSelectedFolderIds([]);
    setSelectedTagIds([]);
    setNewCharacterImages([]);
    setImagePreviewUrls([]);
    setAddCharacterDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
    }

    if (validFiles.length > 0) {
      setNewCharacterImages((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls((prev) => [...prev, ...newPreviews]);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImagePreview = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setNewCharacterImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!newPromptTemplate.trim()) {
      toast.error("Please enter a prompt template");
      return;
    }

    setIsSavingCharacter(true);
    try {
      const savedCharacter = await saveCharacter({
        name: newCharacterName.trim(),
        description: newCharacterDescription.trim() || undefined,
        prompt_template: newPromptTemplate.trim(),
        negative_prompt: newNegativePrompt.trim() || undefined,
      });

      if (savedCharacter) {
        // Add to folders
        if (selectedFolderIds.length > 0) {
          await Promise.all(
            selectedFolderIds.map((folderId) =>
              addCharacterToFolder(savedCharacter.id, folderId)
            )
          );
        }

        // Add tags
        if (selectedTagIds.length > 0) {
          await Promise.all(
            selectedTagIds.map((tagId) =>
              addTagToCharacter(savedCharacter.id, tagId)
            )
          );
        }

        // Upload images
        if (newCharacterImages.length > 0) {
          for (const file of newCharacterImages) {
            const formData = new FormData();
            formData.append("file", file);
            await uploadCharacterImage(savedCharacter.id, formData);
          }
        }

        // Reload to get updated data
        await loadData();
        setAddCharacterDialogOpen(false);
        toast.success(editingCharacter ? "Character updated" : "Character created");
      }
    } catch (error) {
      console.error("Failed to save character:", error);
      toast.error("Failed to save character");
    } finally {
      setIsSavingCharacter(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-5" aria-hidden="true" />
              <h1 className="text-lg font-semibold font-mono">Characters</h1>
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-auto font-mono">
                  {totalCount}
                </Badge>
              )}
            </div>
            <Button
              onClick={() => openAddDialog()}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              New Character
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* All */}
              <button
                onClick={() => setActiveSection("all")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  activeSection === "all"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                All Characters
                <span className="ml-auto text-xs text-muted-foreground">
                  {characters.length}
                </span>
              </button>

              {/* Favorites */}
              <button
                onClick={() => setActiveSection("favorites")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  activeSection === "favorites"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Heart className="size-4" aria-hidden="true" />
                Favorites
                {favoriteCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {favoriteCount}
                  </span>
                )}
              </button>

              {/* Recent */}
              <button
                onClick={() => setActiveSection("recent")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  activeSection === "recent"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Clock className="size-4" aria-hidden="true" />
                Recently Used
              </button>

              {/* Folders */}
              {folders.length > 0 && (
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Folders
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => setNewFolderDialogOpen(true)}
                        >
                          <FolderPlus className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create folder</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-0.5">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setActiveSection(folder.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 truncate",
                          activeSection === folder.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Folder
                          className="size-4 shrink-0"
                          style={{ color: folder.color || undefined }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {folders.length === 0 && (
                <div className="pt-4 mt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => setNewFolderDialogOpen(true)}
                  >
                    <FolderPlus className="size-4" aria-hidden="true" />
                    Create folder
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-border flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Loading characters...</p>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Users className="size-12 text-muted-foreground/30 mb-4" aria-hidden="true" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery ? "No characters found" : "No characters yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create your first character to get started"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => openAddDialog()} className="gap-2">
                      <Plus className="size-4" aria-hidden="true" />
                      Create Character
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredCharacters.map((character) => (
                      <CharacterGridCard
                        key={character.id}
                        character={character}
                        onToggleFavorite={handleToggleFavorite}
                        onCopyPrompt={handleCopyPrompt}
                        onEdit={() => openAddDialog(character)}
                        onDelete={() => handleDeleteCharacter(character)}
                        onClick={() => router.push(`/characters/${character.id}`)}
                        prefersReducedMotion={prefersReducedMotion ?? false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredCharacters.map((character) => (
                      <CharacterListItem
                        key={character.id}
                        character={character}
                        onToggleFavorite={handleToggleFavorite}
                        onCopyPrompt={handleCopyPrompt}
                        onEdit={() => openAddDialog(character)}
                        onDelete={() => handleDeleteCharacter(character)}
                        onClick={() => router.push(`/characters/${character.id}`)}
                        prefersReducedMotion={prefersReducedMotion ?? false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        {/* New Folder Dialog */}
        <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
              <DialogDescription>
                Create a folder to organize your characters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder name</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="My Characters"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewFolderDialogOpen(false)}
                disabled={isCreatingFolder}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Character Dialog */}
        <Dialog open={addCharacterDialogOpen} onOpenChange={setAddCharacterDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCharacter ? "Edit Character" : "Create Character"}
              </DialogTitle>
              <DialogDescription>
                {editingCharacter
                  ? "Update your character's details"
                  : "Create a new character with reference images and prompt template"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="character-name">Name</Label>
                <Input
                  id="character-name"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="Character name"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="character-description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="character-description"
                  value={newCharacterDescription}
                  onChange={(e) => setNewCharacterDescription(e.target.value)}
                  placeholder="Brief description of this character"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Reference Images */}
              <div className="space-y-2">
                <Label>
                  Reference Images{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>

                {imagePreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group size-16 rounded-lg border overflow-hidden bg-muted"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full"
                >
                  <ImagePlus className="size-4 mr-2" />
                  Add Reference Images
                </Button>
              </div>

              {/* Prompt Template */}
              <div className="space-y-2">
                <Label htmlFor="prompt-template">Prompt Template</Label>
                <Textarea
                  id="prompt-template"
                  value={newPromptTemplate}
                  onChange={(e) => setNewPromptTemplate(e.target.value)}
                  placeholder="The base prompt for this character..."
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negative-prompt">
                  Negative Prompt{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="negative-prompt"
                  value={newNegativePrompt}
                  onChange={(e) => setNewNegativePrompt(e.target.value)}
                  placeholder="Things to avoid..."
                  rows={2}
                  className="resize-none font-mono text-sm"
                />
              </div>

              {/* Folders */}
              {folders.length > 0 && (
                <div className="space-y-2">
                  <Label>Folder</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedFolderIds.length > 0 ? (
                          <span className="truncate">
                            {selectedFolderIds
                              .map((id) => folders.find((f) => f.id === id)?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Select folders...</span>
                        )}
                        <ChevronDown className="size-4 ml-2 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search folders..." />
                        <CommandList>
                          <CommandEmpty>No folders found.</CommandEmpty>
                          <CommandGroup>
                            {folders.map((folder) => (
                              <CommandItem
                                key={folder.id}
                                onSelect={() => toggleFolder(folder.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    selectedFolderIds.includes(folder.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Folder
                                  className="mr-2 size-4"
                                  style={{ color: folder.color || undefined }}
                                />
                                {folder.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedTagIds.length > 0 ? (
                          <span className="truncate">
                            {selectedTagIds
                              .map((id) => tags.find((t) => t.id === id)?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Select tags...</span>
                        )}
                        <ChevronDown className="size-4 ml-2 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {tags.map((tag) => (
                              <CommandItem
                                key={tag.id}
                                onSelect={() => toggleTag(tag.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    selectedTagIds.includes(tag.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Tag
                                  className="mr-2 size-4"
                                  style={{ color: tag.color || undefined }}
                                />
                                {tag.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddCharacterDialogOpen(false)}
                disabled={isSavingCharacter}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCharacter}
                disabled={
                  !newCharacterName.trim() ||
                  !newPromptTemplate.trim() ||
                  isSavingCharacter
                }
              >
                {isSavingCharacter ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCharacter ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Character?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{characterToDelete?.name}&quot; and all
                associated reference images. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// ============================================
// Character Grid Card
// ============================================

interface CharacterGridCardProps {
  character: Character;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onCopyPrompt: (prompt: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

function CharacterGridCard({
  character,
  onToggleFavorite,
  onCopyPrompt,
  onEdit,
  onDelete,
  onClick,
  prefersReducedMotion,
}: CharacterGridCardProps) {
  const avatarImage =
    character.primary_image?.url ||
    (character.images && character.images.length > 0
      ? character.images[0].url
      : null);

  const imageCount = character.images?.length ?? 0;

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="group relative rounded-xl border bg-card overflow-hidden cursor-pointer hover:border-foreground/20 hover:shadow-md transition-all"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-muted">
        {avatarImage ? (
          <Image
            src={avatarImage}
            alt={character.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="size-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Favorite button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(character.id, !character.is_favorite);
          }}
        >
          <Heart
            className={cn(
              "size-4",
              character.is_favorite && "fill-red-500 text-red-500"
            )}
          />
        </Button>

        {/* Image count badge */}
        {imageCount > 1 && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 gap-1 backdrop-blur-sm bg-background/80"
          >
            <ImagePlus className="size-3" />
            {imageCount}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{character.name}</h3>
            {character.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {character.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyPrompt(character.prompt_template);
                }}
              >
                <Copy className="size-4 mr-2" />
                Copy Prompt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          {character.use_count > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sparkles className="size-2.5" />
              {character.use_count} uses
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Character List Item
// ============================================

interface CharacterListItemProps {
  character: Character;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onCopyPrompt: (prompt: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

function CharacterListItem({
  character,
  onToggleFavorite,
  onCopyPrompt,
  onEdit,
  onDelete,
  onClick,
  prefersReducedMotion,
}: CharacterListItemProps) {
  const avatarImage =
    character.primary_image?.url ||
    (character.images && character.images.length > 0
      ? character.images[0].url
      : null);

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 p-3 rounded-xl border bg-card cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="size-12 rounded-lg border">
        {avatarImage ? (
          <AvatarImage src={avatarImage} alt={character.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="rounded-lg">
          <User className="size-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{character.name}</h3>
          {character.is_favorite && (
            <Heart className="size-3 text-red-500 fill-red-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 font-mono mt-0.5">
          {character.prompt_template}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 shrink-0">
        {character.use_count > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Sparkles className="size-2.5" />
            {character.use_count}
          </Badge>
        )}
        {(character.images?.length ?? 0) > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <ImagePlus className="size-2.5" />
            {character.images?.length}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(character.id, !character.is_favorite);
              }}
            >
              <Heart
                className={cn(
                  "size-4",
                  character.is_favorite && "fill-red-500 text-red-500"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {character.is_favorite ? "Remove from favorites" : "Add to favorites"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopyPrompt(character.prompt_template);
              }}
            >
              <Copy className="size-4 mr-2" />
              Copy Prompt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
