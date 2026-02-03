"use client";

import * as React from "react";
import { Check, FolderPlus, Folder, Plus } from "lucide-react";
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
  CommandSeparator,
} from "@/components/ui/command";
import { useCreate } from "./create-context";
import type { Collection } from "@/types/generation";

interface CollectionSelectorProps {
  imageId: string;
  className?: string;
}

export function CollectionSelector({ imageId, className }: CollectionSelectorProps) {
  const {
    collections,
    getImageCollections,
    addToCollection,
    removeFromCollection,
    createCollection,
    loadImageOrganization,
  } = useCreate();

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");

  // Load image organization data when component mounts
  React.useEffect(() => {
    loadImageOrganization(imageId);
  }, [imageId, loadImageOrganization]);

  const imageCollections = getImageCollections(imageId);
  const imageCollectionIds = new Set(imageCollections.map((c) => c.id));

  const handleToggleCollection = async (collection: Collection) => {
    if (imageCollectionIds.has(collection.id)) {
      await removeFromCollection(imageId, collection.id);
    } else {
      await addToCollection(imageId, collection.id);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    const collection = await createCollection(newCollectionName.trim());
    if (collection) {
      await addToCollection(imageId, collection.id);
    }
    setNewCollectionName("");
    setShowCreateForm(false);
    setIsCreating(false);
  };

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Current collections */}
      <div className="flex flex-wrap gap-1.5">
        {imageCollections.length === 0 ? (
          <span className="text-xs text-muted-foreground">Not in any collection</span>
        ) : (
          imageCollections.map((collection) => (
            <Badge
              key={collection.id}
              variant="outline"
              className="gap-1.5 text-xs font-mono"
              style={
                collection.color
                  ? {
                      borderColor: collection.color,
                      color: collection.color,
                    }
                  : undefined
              }
            >
              <Folder className="size-3" aria-hidden="true" />
              {collection.name}
            </Badge>
          ))
        )}
      </div>

      {/* Add to collection button with popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs font-mono"
          >
            <FolderPlus className="size-3" aria-hidden="true" />
            {imageCollections.length > 0 ? "Manage collections" : "Add to collection"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          {showCreateForm ? (
            <div className="p-3 space-y-3">
              <div className="text-sm font-medium">Create new collection</div>
              <Input
                placeholder="Collection name..."
                aria-label="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCollection();
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput
                placeholder="Search collections..."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                <CommandEmpty>No collections found</CommandEmpty>
                {filteredCollections.length > 0 && (
                  <CommandGroup heading="Collections">
                    {filteredCollections.map((collection) => {
                      const isInCollection = imageCollectionIds.has(collection.id);
                      return (
                        <CommandItem
                          key={collection.id}
                          value={collection.name}
                          onSelect={() => handleToggleCollection(collection)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={cn(
                              "size-4 rounded border flex items-center justify-center",
                              isInCollection
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border"
                            )}
                          >
                            {isInCollection && (
                              <Check className="size-3" aria-hidden="true" />
                            )}
                          </div>
                          <div
                            className="size-3 rounded-sm"
                            style={{
                              backgroundColor: collection.color || "var(--muted)",
                            }}
                          />
                          <span className="font-mono text-xs flex-1 truncate">
                            {collection.name}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setShowCreateForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    <span className="text-xs">Create new collection</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
