"use client";

import * as React from "react";
import { useXPreview } from "./x-preview-context";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "./icons";
import { X, ChevronLeft, ChevronRight, Upload } from "lucide-react";

export function PostComposer() {
  const {
    post,
    updateAuthor,
    updateContent,
    updateStats,
    addImages,
    removeImage,
    moveImage,
  } = useXPreview();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Author
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={post.author.name}
              onChange={(e) => updateAuthor("name", e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="handle"
                value={post.author.handle}
                onChange={(e) => updateAuthor("handle", e.target.value)}
                placeholder="handle"
                className="pl-7"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="verified">Verified Badge</Label>
          <Switch
            id="verified"
            checked={post.author.verified}
            onCheckedChange={(checked) => updateAuthor("verified", checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label htmlFor="content" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Content
        </Label>
        <Textarea
          id="content"
          value={post.content}
          onChange={(e) => updateContent(e.target.value)}
          placeholder="What's happening?"
          className="min-h-[120px] resize-none"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Images ({post.images.length}/4)
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
            aria-label="Upload images"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={post.images.length >= 4}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Images
          </Button>
        </div>

        {post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.images.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-video rounded-lg overflow-hidden border border-border group"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => moveImage(image.id, "left")}
                    disabled={index === 0}
                    aria-label="Move image left"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => removeImage(image.id)}
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => moveImage(image.id, "right")}
                    disabled={index === post.images.length - 1}
                    aria-label="Move image right"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {post.images.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full aspect-video rounded-lg border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-2",
              "text-muted-foreground hover:border-primary hover:text-foreground",
              "transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label="Click to add images"
          >
            <ImageIcon size={32} aria-hidden="true" />
            <span className="text-sm">Click to add images</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Engagement Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="views">Views</Label>
            <Input
              id="views"
              type="number"
              min={0}
              value={post.stats.views}
              onChange={(e) =>
                updateStats("views", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="likes">Likes</Label>
            <Input
              id="likes"
              type="number"
              min={0}
              value={post.stats.likes}
              onChange={(e) =>
                updateStats("likes", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reposts">Reposts</Label>
            <Input
              id="reposts"
              type="number"
              min={0}
              value={post.stats.reposts}
              onChange={(e) =>
                updateStats("reposts", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="replies">Replies</Label>
            <Input
              id="replies"
              type="number"
              min={0}
              value={post.stats.replies}
              onChange={(e) =>
                updateStats("replies", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmarks">Bookmarks</Label>
            <Input
              id="bookmarks"
              type="number"
              min={0}
              value={post.stats.bookmarks}
              onChange={(e) =>
                updateStats("bookmarks", parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
