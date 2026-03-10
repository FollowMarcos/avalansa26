'use client';

import { useState, useEffect } from 'react';
import { WallpaperDetail } from './wallpaper-detail';
import type { WallpaperWithDetails } from '@/types/wallpaper';
import { toast } from 'sonner';

interface WallpaperDetailPageProps {
  wallpaper: WallpaperWithDetails;
}

export function WallpaperDetailPage({ wallpaper: initial }: WallpaperDetailPageProps) {
  const [wallpaper, setWallpaper] = useState(initial);
  const [isLiked, setIsLiked] = useState(initial.is_liked ?? false);

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

  return (
    <WallpaperDetail
      wallpaper={wallpaper}
      isLiked={isLiked}
      onLike={handleLike}
    />
  );
}
