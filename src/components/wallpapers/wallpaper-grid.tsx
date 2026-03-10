'use client';

import { useCallback, useEffect, useRef } from 'react';
import { WallpaperCard } from './wallpaper-card';
import type { WallpaperWithDetails } from '@/types/wallpaper';
import { Loader } from '@/components/ui/loader';

interface WallpaperGridProps {
  wallpapers: WallpaperWithDetails[];
  likedIds?: Set<string>;
  isOwner?: boolean;
  onLike?: (id: string) => void;
  onDownload?: (id: string) => void;
  onEdit?: (wallpaper: WallpaperWithDetails) => void;
  onDelete?: (wallpaper: WallpaperWithDetails) => void;
  onClick?: (wallpaper: WallpaperWithDetails) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function WallpaperGrid({
  wallpapers,
  likedIds,
  isOwner = false,
  onLike,
  onDownload,
  onEdit,
  onDelete,
  onClick,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: WallpaperGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoading) {
        onLoadMore?.();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, onLoadMore]);

  if (wallpapers.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-dashed border-primary/20 flex items-center justify-center mb-4">
          <span className="font-vt323 text-2xl text-primary/40">?</span>
        </div>
        <p className="font-vt323 text-lg text-muted-foreground uppercase tracking-wider">
          No wallpapers found
        </p>
        <p className="font-lato text-sm text-muted-foreground/60 mt-1">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wallpapers.map((wallpaper, index) => (
          <WallpaperCard
            key={wallpaper.id}
            wallpaper={wallpaper}
            isLiked={likedIds?.has(wallpaper.id)}
            isOwner={isOwner}
            onLike={onLike}
            onDownload={onDownload}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {onLoadMore && (
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
