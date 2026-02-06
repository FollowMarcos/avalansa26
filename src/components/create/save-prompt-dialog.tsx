"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { safeColor } from "@/lib/validations/color";
import type { PromptFolder, PromptTag } from "@/types/prompt";
import type { GenerationSettings } from "@/types/generation";
import {
  Bookmark,
  Folder,
  Tag,
  X,
  Plus,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

interface SavePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  negativePrompt?: string;
  settings?: Partial<GenerationSettings>;
  folders: PromptFolder[];
  tags: PromptTag[];
  onSave: (data: {
    name: string;
    description?: string;
    folderIds: string[];
    tagIds: string[];
  }) => Promise<void>;
  onCreateFolder: (name: string) => Promise<PromptFolder | null>;
  onCreateTag: (name: string) => Promise<PromptTag | null>;
}

export function SavePromptDialog({
  open,
  onOpenChange,
  promptText,
  negativePrompt,
  settings,
  folders,
  tags,
  onSave,
  onCreateFolder,
  onCreateTag,
}: SavePromptDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedFolders, setSelectedFolders] = React.useState<string[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [newTagName, setNewTagName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);

  // Auto-suggest name from prompt
  React.useEffect(() => {
    if (open && !name && promptText) {
      const suggestedName = promptText
        .split(/[,.!?\n]/)[0]
        .trim()
        .slice(0, 50);
      setName(suggestedName || "Untitled Prompt");
    }
  }, [open, promptText, name]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
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

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        folderIds: selectedFolders,
        tagIds: selectedTags,
      });
      toast.success("Prompt saved to vault");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      toast.error("Failed to save prompt");
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
            <Bookmark className="size-4" aria-hidden="true" />
            Save to Vault
          </DialogTitle>
          <DialogDescription>
            Save this prompt for quick reuse later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="prompt-name">Name</Label>
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome prompt"
              autoFocus
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="prompt-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="prompt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this prompt for?"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Prompt preview */}
          <div className="space-y-2">
            <Label>Prompt preview</Label>
            <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-3 py-2 max-h-20 overflow-y-auto">
              {promptText || "No prompt text"}
            </div>
            {negativePrompt && (
              <div className="text-xs text-muted-foreground font-mono bg-red-500/10 rounded-lg px-3 py-2 max-h-16 overflow-y-auto">
                <span className="text-red-500">Negative:</span> {negativePrompt}
              </div>
            )}
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
                        backgroundColor: safeColor(folder.color)
                          ? `${safeColor(folder.color)}20`
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
                        backgroundColor: safeColor(tag.color) ? `${safeColor(tag.color)}20` : undefined,
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
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bookmark className="size-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
