'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WallpaperDeleteDialogProps {
  wallpaperId: string;
  wallpaperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function WallpaperDeleteDialog({
  wallpaperId,
  wallpaperTitle,
  open,
  onOpenChange,
  onDeleted,
}: WallpaperDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/wallpapers/${wallpaperId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Wallpaper deleted');
        onDeleted();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete wallpaper');
      }
    } catch {
      toast.error('Failed to delete wallpaper');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-vt323 text-2xl uppercase tracking-tight">
            Delete Wallpaper
          </AlertDialogTitle>
          <AlertDialogDescription className="font-lato text-sm">
            Are you sure you want to delete &ldquo;{wallpaperTitle}&rdquo;? This will permanently
            remove the wallpaper and all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-xl font-vt323 text-base uppercase"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl gap-2 font-vt323 text-base uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
