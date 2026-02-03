"use client";

import * as React from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/command";
import { useCreate } from "./create-context";
import type { Tag } from "@/types/generation";

interface TagInputProps {
  imageId: string;
  className?: string;
}

export function TagInput({ imageId, className }: TagInputProps) {
  const {
    tags,
    getImageTags,
    addTagToImage,
    removeTagFromImage,
    createAndAddTag,
    loadImageOrganization,
  } = useCreate();

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Load image organization data when component mounts
  React.useEffect(() => {
    loadImageOrganization(imageId);
  }, [imageId, loadImageOrganization]);

  const imageTags = getImageTags(imageId);
  const availableTags = tags.filter(
    (tag) => !imageTags.some((t) => t.id === tag.id)
  );

  const handleAddTag = async (tag: Tag) => {
    await addTagToImage(imageId, tag.id);
    setOpen(false);
    setInputValue("");
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromImage(imageId, tagId);
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim()) return;

    setIsCreating(true);
    await createAndAddTag(imageId, inputValue.trim());
    setInputValue("");
    setOpen(false);
    setIsCreating(false);
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption =
    inputValue.trim() &&
    !tags.some(
      (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
    );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Existing tags */}
      <div className="flex flex-wrap gap-1.5">
        {imageTags.length === 0 ? (
          <span className="text-xs text-muted-foreground">No tags</span>
        ) : (
          imageTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1 text-xs font-mono"
              style={
                tag.color
                  ? {
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color,
                    }
                  : undefined
              }
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                aria-label={`Remove tag ${tag.name}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add tag button with popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs font-mono"
          >
            <Plus className="size-3" aria-hidden="true" />
            Add tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create tag..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {showCreateOption ? (
                  <button
                    type="button"
                    className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                    onClick={handleCreateTag}
                    disabled={isCreating}
                  >
                    <TagIcon className="size-4" aria-hidden="true" />
                    Create "{inputValue.trim()}"
                  </button>
                ) : (
                  "No tags found"
                )}
              </CommandEmpty>
              {filteredTags.length > 0 && (
                <CommandGroup heading="Available tags">
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleAddTag(tag)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="size-3 rounded-full border"
                        style={{
                          backgroundColor: tag.color || "transparent",
                          borderColor: tag.color || "currentColor",
                        }}
                      />
                      <span className="font-mono text-xs">{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {showCreateOption && filteredTags.length > 0 && (
                <CommandGroup heading="Create new">
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={handleCreateTag}
                    className="flex items-center gap-2"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    <span className="font-mono text-xs">
                      Create "{inputValue.trim()}"
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
