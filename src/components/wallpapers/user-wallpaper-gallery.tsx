'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WallpaperGrid } from './wallpaper-grid';
import { WallpaperFilters } from './wallpaper-filters';
import { WallpaperEditDialog } from './wallpaper-edit-dialog';
import { WallpaperDeleteDialog } from './wallpaper-delete-dialog';
import type {
  WallpaperWithDetails,
  WallpaperSortOption,
  ResolutionFilter,
  WallpaperCollection,
  PaginatedWallpapers,
} from '@/types/wallpaper';
import { toast } from 'sonner';

interface UserWallpaperGalleryProps {
  initialData: PaginatedWallpapers;
  username: string;
  displayName: string;
  isOwner: boolean;
  collections: WallpaperCollection[];
  likedIds: Set<string>;
}

export function UserWallpaperGallery({
  initialData,
  username,
  displayName,
  isOwner,
  collections,
  likedIds: initialLikedIds,
}: UserWallpaperGalleryProps) {
  const router = useRouter();
  const [wallpapers, setWallpapers] = useState(initialData.wallpapers);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [page, setPage] = useState(initialData.page);
  const [isLoading, setIsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState(initialLikedIds);

  // Edit/delete state
  const [editingWallpaper, setEditingWallpaper] = useState<WallpaperWithDetails | null>(null);
  const [deletingWallpaper, setDeletingWallpaper] = useState<WallpaperWithDetails | null>(null);

  // Filter state
  const [sort, setSort] = useState<WallpaperSortOption>('newest');
  const [resolution, setResolution] = useState<ResolutionFilter | undefined>();
  const [collection, setCollection] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const fetchWallpapers = useCallback(async (
    newPage: number,
    append: boolean,
    overrides?: {
      sort?: WallpaperSortOption;
      resolution?: ResolutionFilter | undefined;
      collection?: string | undefined;
      search?: string;
    }
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(newPage));
      params.set('limit', '20');

      const s = overrides?.sort ?? sort;
      const r = overrides?.resolution ?? resolution;
      const c = overrides?.collection ?? collection;
      const q = overrides?.search ?? search;

      if (s) params.set('sort', s);
      if (r) params.set('resolution', r);
      if (c) params.set('collection', c);
      if (q) params.set('search', q);

      const res = await fetch(`/api/wallpapers?user=${username}&${params.toString()}`);

      if (res.ok) {
        const data: PaginatedWallpapers = await res.json();
        setWallpapers(append ? (prev) => [...prev, ...data.wallpapers] : data.wallpapers);
        setHasMore(data.hasMore);
        setPage(data.page);
      }
    } catch {
      toast.error('Failed to load wallpapers');
    } finally {
      setIsLoading(false);
    }
  }, [sort, resolution, collection, search, username]);

  const handleSortChange = (newSort: WallpaperSortOption) => {
    setSort(newSort);
    fetchWallpapers(1, false, { sort: newSort });
  };

  const handleResolutionChange = (newRes: ResolutionFilter | undefined) => {
    setResolution(newRes);
    fetchWallpapers(1, false, { resolution: newRes });
  };

  const handleCollectionChange = (newCol: string | undefined) => {
    setCollection(newCol);
    fetchWallpapers(1, false, { collection: newCol });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    // Debounce search
    const timer = setTimeout(() => {
      fetchWallpapers(1, false, { search: newSearch });
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchWallpapers(page + 1, true);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/wallpapers/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (data.liked) next.add(id);
          else next.delete(id);
          return next;
        });
        setWallpapers((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, like_count: data.like_count } : w
          )
        );
      }
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleDownload = (id: string) => {
    window.open(`/api/wallpapers/${id}/download`, '_blank');
  };

  const handleClick = (wallpaper: WallpaperWithDetails) => {
    router.push(`/wallpapers/w/${wallpaper.id}`);
  };

  const handleSaved = (updated: Partial<WallpaperWithDetails>) => {
    setWallpapers((prev) =>
      prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
    );
    setEditingWallpaper(null);
  };

  const handleDeleted = () => {
    if (deletingWallpaper) {
      setWallpapers((prev) => prev.filter((w) => w.id !== deletingWallpaper.id));
    }
    setDeletingWallpaper(null);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-vt323 text-3xl text-foreground uppercase tracking-tight">
              {displayName}&apos;s Wallpapers
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {initialData.total} wallpaper{initialData.total !== 1 ? 's' : ''}
            </p>
          </div>
          {isOwner && (
            <Link href="/wallpapers/upload">
              <Button className="rounded-xl gap-2 font-vt323 text-lg uppercase">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <WallpaperFilters
          collections={collections}
          currentSort={sort}
          currentResolution={resolution}
          currentCollection={collection}
          currentSearch={search}
          onSortChange={handleSortChange}
          onResolutionChange={handleResolutionChange}
          onCollectionChange={handleCollectionChange}
          onSearchChange={handleSearchChange}
        />

        {/* Grid */}
        <WallpaperGrid
          wallpapers={wallpapers}
          likedIds={likedIds}
          isOwner={isOwner}
          onLike={handleLike}
          onDownload={handleDownload}
          onEdit={setEditingWallpaper}
          onDelete={setDeletingWallpaper}
          onClick={handleClick}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </div>

      {/* Edit Dialog */}
      {editingWallpaper && (
        <WallpaperEditDialog
          wallpaper={editingWallpaper}
          open={!!editingWallpaper}
          onOpenChange={(open) => !open && setEditingWallpaper(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Dialog */}
      {deletingWallpaper && (
        <WallpaperDeleteDialog
          wallpaperId={deletingWallpaper.id}
          wallpaperTitle={deletingWallpaper.title}
          open={!!deletingWallpaper}
          onOpenChange={(open) => !open && setDeletingWallpaper(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
