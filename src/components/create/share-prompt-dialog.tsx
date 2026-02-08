"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/types/prompt";
import {
  Share2,
  Search,
  X,
  User,
  Send,
  Loader2,
  Check,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserSearchResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface SharePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onShare: (userIds: string[], message?: string) => Promise<void>;
  onSearchUsers: (query: string) => Promise<UserSearchResult[]>;
}

export function SharePromptDialog({
  open,
  onOpenChange,
  prompt,
  onShare,
  onSearchUsers,
}: SharePromptDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<UserSearchResult[]>([]);
  const [message, setMessage] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers([]);
      setMessage("");
    }
  }, [open]);

  // Debounced user search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearchUsers(searchQuery);
        // Filter out already selected users
        const filtered = results.filter(
          (r) => !selectedUsers.some((s) => s.id === r.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("User search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearchUsers, selectedUsers]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least one user to share with");
      return;
    }

    setIsSharing(true);
    try {
      await onShare(
        selectedUsers.map((u) => u.id),
        message.trim() || undefined
      );
      toast.success(
        `Shared with ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to share prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to share prompt");
    } finally {
      setIsSharing(false);
    }
  };

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-4" aria-hidden="true" />
            Share Prompt
          </DialogTitle>
          <DialogDescription>
            Share &quot;{prompt.name}&quot; with other users. They&apos;ll receive a
            copy in their vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Sharing with</Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="gap-1.5 pr-1 h-7"
                  >
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="size-3.5" />
                    )}
                    {user.username || "Unknown"}
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="size-5 rounded-full hover:bg-foreground/10 flex items-center justify-center ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">
              {selectedUsers.length > 0 ? "Add more users" : "Search users"}
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="pl-8"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <ScrollArea className="max-h-40 border rounded-lg">
                <div className="p-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
                        "hover:bg-accent transition-colors"
                      )}
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
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="size-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm">
                        {user.username || "Unknown user"}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">
                No users found matching &quot;{searchQuery}&quot;
              </p>
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for the recipient..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Prompt preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Prompt to share</Label>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{prompt.name}</p>
              <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                {prompt.prompt_text}
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 rounded-lg p-2.5">
            <Users className="size-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <p>
              Recipients will get their own copy of this prompt. Changes they make
              won&apos;t affect your original.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || selectedUsers.length === 0}
          >
            {isSharing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Share
                {selectedUsers.length > 0 && ` (${selectedUsers.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
