"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/validations/color";
import type { Ava, AvaFolder, AvaTag } from "@/types/ava";
import {
  Bot,
  Folder,
  Tag,
  X,
  Plus,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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

interface CreateAvaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAva?: Ava | null;
  folders: AvaFolder[];
  tags: AvaTag[];
  onSave: (data: {
    name: string;
    description?: string;
    instructions: string;
    avatarUrl?: string;
    folderIds: string[];
    tagIds: string[];
  }) => Promise<void>;
  onCreateFolder: (name: string) => Promise<AvaFolder | null>;
  onCreateTag: (name: string) => Promise<AvaTag | null>;
}

export function CreateAvaDialog({
  open,
  onOpenChange,
  editingAva,
  folders,
  tags,
  onSave,
  onCreateFolder,
  onCreateTag,
}: CreateAvaDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [selectedFolders, setSelectedFolders] = React.useState<string[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [newTagName, setNewTagName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);

  // Pre-populate when editing
  React.useEffect(() => {
    if (open && editingAva) {
      setName(editingAva.name);
      setDescription(editingAva.description || "");
      setInstructions(editingAva.instructions);
    }
  }, [open, editingAva]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setInstructions("");
      setSelectedFolders([]);
      setSelectedTags([]);
      setNewFolderName("");
      setNewTagName("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!instructions.trim()) {
      toast.error("Please enter instructions");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim(),
        folderIds: selectedFolders,
        tagIds: selectedTags,
      });
      toast.success(editingAva ? "Ava updated" : "Ava created");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save ava:", error);
      toast.error("Failed to save Ava");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" aria-hidden="true" />
            {editingAva ? "Edit Ava" : "Create Ava"}
          </DialogTitle>
          <DialogDescription>
            {editingAva
              ? "Update your Ava\u2019s instructions and settings"
              : "Create a custom AI prompt generator with your own instructions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="ava-name">Name</Label>
            <Input
              id="ava-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cinematic Realism…"
              autoFocus
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="ava-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="ava-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this Ava do?"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="ava-instructions">Instructions</Label>
            <Textarea
              id="ava-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are an expert at creating cinematic photography prompts. When the user provides a description or image, generate a detailed image generation prompt that includes lighting, composition, lens details, and atmosphere…"
              rows={6}
              className="resize-none font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              These instructions tell the AI how to generate prompts from your
              input. Be specific about style, tone, and what details to include.
            </p>
          </div>

          {/* Folders */}
          {!editingAva && (
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
                      <span className="text-muted-foreground">Select folders…</span>
                    )}
                    <ChevronDown className="size-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search folders…" />
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
                              style={{ color: safeColor(folder.color) }}
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
                            aria-label="New folder name"
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
                            aria-label={isCreatingFolder ? "Creating folder…" : "Create folder"}
                          >
                            {isCreatingFolder ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Plus className="size-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

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
                          backgroundColor: safeColor(folder.color)
                            ? `${safeColor(folder.color)}20`
                            : undefined,
                        }}
                      >
                        <Folder className="size-3" aria-hidden="true" />
                        {folder.name}
                        <button
                          onClick={() => toggleFolder(id)}
                          className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
                          aria-label={`Remove folder ${folder.name}`}
                        >
                          <X className="size-2.5" aria-hidden="true" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {!editingAva && (
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
                      <span className="text-muted-foreground">Select tags…</span>
                    )}
                    <ChevronDown className="size-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags…" />
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
                              style={{ color: safeColor(tag.color) }}
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
                            aria-label="New tag name"
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
                            aria-label={isCreatingTag ? "Creating tag…" : "Create tag"}
                          >
                            {isCreatingTag ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Plus className="size-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

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
                          backgroundColor: safeColor(tag.color) ? `${safeColor(tag.color)}20` : undefined,
                        }}
                      >
                        <Tag className="size-3" aria-hidden="true" />
                        {tag.name}
                        <button
                          onClick={() => toggleTag(id)}
                          className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
                          aria-label={`Remove tag ${tag.name}`}
                        >
                          <X className="size-2.5" aria-hidden="true" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
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
            disabled={isSaving || !name.trim() || !instructions.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Bot className="size-4 mr-2" />
                {editingAva ? "Update Ava" : "Create Ava"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
