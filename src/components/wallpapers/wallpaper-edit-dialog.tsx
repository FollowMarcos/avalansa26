'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WallpaperWithDetails } from '@/types/wallpaper';

interface WallpaperEditDialogProps {
  wallpaper: WallpaperWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partial<WallpaperWithDetails>) => void;
}

export function WallpaperEditDialog({
  wallpaper,
  open,
  onOpenChange,
  onSaved,
}: WallpaperEditDialogProps) {
  const [title, setTitle] = useState(wallpaper.title);
  const [description, setDescription] = useState(wallpaper.description || '');
  const [isPublic, setIsPublic] = useState(wallpaper.is_public);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/wallpapers/${wallpaper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSaved({
          ...data.wallpaper,
          tags: wallpaper.tags,
          user: wallpaper.user,
        });
        onOpenChange(false);
        toast.success('Wallpaper updated');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update wallpaper');
      }
    } catch {
      toast.error('Failed to update wallpaper');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-vt323 text-2xl uppercase tracking-tight">
            Edit Wallpaper
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wp-title" className="font-lato text-sm font-medium">
              Title
            </Label>
            <Input
              id="wp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wp-desc" className="font-lato text-sm font-medium">
              Description
            </Label>
            <textarea
              id="wp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-lato placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.02]">
            <div>
              <Label className="font-lato font-semibold text-sm">Public</Label>
              <p className="text-[11px] text-muted-foreground font-lato mt-0.5">
                Visible in the community wallpapers feed
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-vt323 text-base uppercase"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="rounded-xl gap-2 font-vt323 text-base uppercase"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
