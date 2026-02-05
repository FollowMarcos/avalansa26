"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Character, CharacterFolder, CharacterTag, CharacterImage } from "@/types/character";
import type { GenerationSettings } from "@/types/generation";
import {
  User,
  Folder,
  Tag,
  X,
  Plus,
  ChevronDown,
  Check,
  Loader2,
  Upload,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaveCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, editing existing character */
  character?: Character | null;
  /** Current prompt text to pre-fill */
  promptTemplate?: string;
  /** Current negative prompt to pre-fill */
  negativePrompt?: string;
  /** Current settings to pre-fill */
  settings?: Partial<GenerationSettings>;
  folders: CharacterFolder[];
  tags: CharacterTag[];
  onSave: (data: {
    name: string;
    description?: string;
    promptTemplate: string;
    negativePrompt?: string;
    settings?: Partial<GenerationSettings>;
    folderIds: string[];
    tagIds: string[];
  }) => Promise<Character | null>;
  onCreateFolder: (name: string) => Promise<CharacterFolder | null>;
  onCreateTag: (name: string) => Promise<CharacterTag | null>;
  onAddImage?: (characterId: string, file: File) => Promise<CharacterImage | null>;
  onRemoveImage?: (imageId: string) => Promise<boolean>;
}

export function SaveCharacterDialog({
  open,
  onOpenChange,
  character,
  promptTemplate: initialPrompt,
  negativePrompt: initialNegativePrompt,
  settings,
  folders,
  tags,
  onSave,
  onCreateFolder,
  onCreateTag,
  onAddImage,
  onRemoveImage,
}: SaveCharacterDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [promptTemplate, setPromptTemplate] = React.useState("");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [selectedFolders, setSelectedFolders] = React.useState<string[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<CharacterImage[]>([]);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);

  // UI state
  const [isSaving, setIsSaving] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [newTagName, setNewTagName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  const isEditing = !!character;

  // Initialize form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (character) {
        // Editing existing character
        setName(character.name);
        setDescription(character.description || "");
        setPromptTemplate(character.prompt_template);
        setNegativePrompt(character.negative_prompt || "");
        setImages(character.images || []);
      } else {
        // Creating new character
        setName("");
        setDescription("");
        setPromptTemplate(initialPrompt || "");
        setNegativePrompt(initialNegativePrompt || "");
        setImages([]);
      }
      setSelectedFolders([]);
      setSelectedTags([]);
      setPendingFiles([]);
      setNewFolderName("");
      setNewTagName("");
    }
  }, [open, character, initialPrompt, initialNegativePrompt]);

  // Auto-suggest name from prompt
  React.useEffect(() => {
    if (open && !name && !character && promptTemplate) {
      const suggestedName = promptTemplate
        .split(/[,.!?\n]/)[0]
        .trim()
        .slice(0, 50);
      setName(suggestedName || "New Character");
    }
  }, [open, promptTemplate, name, character]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!promptTemplate.trim()) {
      toast.error("Please enter a prompt template");
      return;
    }

    setIsSaving(true);
    try {
      const savedCharacter = await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        promptTemplate: promptTemplate.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        settings,
        folderIds: selectedFolders,
        tagIds: selectedTags,
      });

      if (savedCharacter) {
        // Upload pending images for new character
        if (pendingFiles.length > 0 && onAddImage) {
          setIsUploadingImage(true);
          for (const file of pendingFiles) {
            await onAddImage(savedCharacter.id, file);
          }
          setIsUploadingImage(false);
        }

        toast.success(isEditing ? "Character updated" : "Character saved");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to save character:", error);
      toast.error("Failed to save character");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folder = await onCreateFolder(newFolderName.trim());
      if (folder) {
        setSelectedFolders((prev) => [...prev, folder.id]);
        setNewFolderName("");
        toast.success("Folder created");
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreatingTag(true);
    try {
      const tag = await onCreateTag(newTagName.trim());
      if (tag) {
        setSelectedTags((prev) => [...prev, tag.id]);
        setNewTagName("");
        toast.success("Tag created");
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
    }

    if (validFiles.length > 0) {
      if (isEditing && character && onAddImage) {
        // Upload immediately for existing character
        setIsUploadingImage(true);
        Promise.all(validFiles.map((file) => onAddImage(character.id, file)))
          .then((newImages) => {
            const uploaded = newImages.filter(Boolean) as CharacterImage[];
            setImages((prev) => [...prev, ...uploaded]);
            toast.success(`${uploaded.length} image(s) uploaded`);
          })
          .finally(() => setIsUploadingImage(false));
      } else {
        // Queue for upload after save
        setPendingFiles((prev) => [...prev, ...validFiles]);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (isEditing && onRemoveImage) {
      const success = await onRemoveImage(imageId);
      if (success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image removed");
      }
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="size-4" aria-hidden="true" />
            {isEditing ? "Edit Character" : "Save Character"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this character's details"
              : "Save this character for consistent generation"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="character-name">Name</Label>
            <Input
              id="character-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              autoFocus
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="character-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="character-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

            {/* Existing images */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group size-16 rounded-lg border overflow-hidden bg-muted"
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    {img.is_primary && (
                      <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-primary flex items-center justify-center">
                        <Star className="size-2.5 text-primary-foreground fill-current" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending files preview */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group size-16 rounded-lg border overflow-hidden bg-muted"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt=""
                      fill
                      className="object-cover opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge variant="secondary" className="text-[10px]">
                        Pending
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(index)}
                      className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="w-full"
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Add Reference Images
                </>
              )}
            </Button>
          </div>

          {/* Prompt Template */}
          <div className="space-y-2">
            <Label htmlFor="prompt-template">Prompt Template</Label>
            <Textarea
              id="prompt-template"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
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
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid..."
              rows={2}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Folders */}
          <div className="space-y-2">
            <Label>
              Folder{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedFolders.length > 0 ? (
                    <span className="truncate">
                      {selectedFolders
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
                              selectedFolders.includes(folder.id)
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
                    <CommandSeparator />
                    <CommandGroup>
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="New folder name"
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateFolder();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim() || isCreatingFolder}
                          className="h-8 px-2"
                        >
                          {isCreatingFolder ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </Button>
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected folders badges */}
            {selectedFolders.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedFolders.map((id) => {
                  const folder = folders.find((f) => f.id === id);
                  if (!folder) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pr-1"
                      style={{
                        backgroundColor: folder.color
                          ? `${folder.color}20`
                          : undefined,
                      }}
                    >
                      <Folder className="size-3" />
                      {folder.name}
                      <button
                        onClick={() => toggleFolder(id)}
                        className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>
              Tags{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedTags.length > 0 ? (
                    <span className="truncate">
                      {selectedTags
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
                              selectedTags.includes(tag.id)
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
                    <CommandSeparator />
                    <CommandGroup>
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <Input
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="New tag name"
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateTag();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCreateTag}
                          disabled={!newTagName.trim() || isCreatingTag}
                          className="h-8 px-2"
                        >
                          {isCreatingTag ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </Button>
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected tags badges */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((id) => {
                  const tag = tags.find((t) => t.id === id);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pr-1"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      }}
                    >
                      <Tag className="size-3" />
                      {tag.name}
                      <button
                        onClick={() => toggleTag(id)}
                        className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings preview */}
          {settings && Object.keys(settings).length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Included settings</Label>
              <div className="flex flex-wrap gap-1">
                {settings.aspectRatio && (
                  <Badge variant="outline" className="text-[10px]">
                    {settings.aspectRatio}
                  </Badge>
                )}
                {settings.imageSize && (
                  <Badge variant="outline" className="text-[10px]">
                    {settings.imageSize}
                  </Badge>
                )}
                {settings.model && (
                  <Badge variant="outline" className="text-[10px]">
                    {settings.model}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !promptTemplate.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <User className="size-4 mr-2" />
                {isEditing ? "Update" : "Save"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
