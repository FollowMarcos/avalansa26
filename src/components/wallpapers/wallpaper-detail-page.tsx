'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WallpaperDetail } from './wallpaper-detail';
import { WallpaperEditDialog } from './wallpaper-edit-dialog';
import { WallpaperDeleteDialog } from './wallpaper-delete-dialog';
import type { WallpaperWithDetails } from '@/types/wallpaper';
import { toast } from 'sonner';

interface WallpaperDetailPageProps {
  wallpaper: WallpaperWithDetails;
  currentUserId?: string | null;
}

export function WallpaperDetailPage({ wallpaper: initial, currentUserId }: WallpaperDetailPageProps) {
  const router = useRouter();
  const [wallpaper, setWallpaper] = useState(initial);
  const [isLiked, setIsLiked] = useState(initial.is_liked ?? false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = !!(currentUserId && currentUserId === wallpaper.user_id);

  // Track view on mount via the API route (which handles IP-based debouncing)
  useEffect(() => {
    fetch(`/api/wallpapers/${initial.id}`).catch(() => {});
  }, [initial.id]);

  const handleLike = async () => {
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setWallpaper((prev) => ({
      ...prev,
      like_count: prev.like_count + (wasLiked ? -1 : 1),
    }));

    try {
      const res = await fetch(`/api/wallpapers/${wallpaper.id}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setWallpaper((prev) => ({ ...prev, like_count: data.like_count }));
      } else {
        // Revert on failure
        setIsLiked(wasLiked);
        setWallpaper((prev) => ({
          ...prev,
          like_count: prev.like_count + (wasLiked ? 1 : -1),
        }));
        toast.error('Failed to update like');
      }
    } catch {
      setIsLiked(wasLiked);
      setWallpaper((prev) => ({
        ...prev,
        like_count: prev.like_count + (wasLiked ? 1 : -1),
      }));
      toast.error('Failed to update like');
    }
  };

  const handleSaved = (updated: Partial<WallpaperWithDetails>) => {
    setWallpaper((prev) => ({ ...prev, ...updated }));
  };

  const handleDeleted = () => {
    router.push('/wallpapers');
  };

  return (
    <>
      <WallpaperDetail
        wallpaper={wallpaper}
        isLiked={isLiked}
        isOwner={isOwner}
        onLike={handleLike}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {isOwner && (
        <>
          <WallpaperEditDialog
            wallpaper={wallpaper}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={handleSaved}
          />
          <WallpaperDeleteDialog
            wallpaperId={wallpaper.id}
            wallpaperTitle={wallpaper.title}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={handleDeleted}
          />
        </>
      )}
    </>
  );
}
