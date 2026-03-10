'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WallpaperGrid } from './wallpaper-grid';
import { WallpaperFilters } from './wallpaper-filters';
import type {
  WallpaperWithDetails,
  WallpaperSortOption,
  ResolutionFilter,
  WallpaperTag,
  PaginatedWallpapers,
} from '@/types/wallpaper';
import { toast } from 'sonner';

interface WallpaperBrowsePageProps {
  initialData: PaginatedWallpapers;
  trendingTags: WallpaperTag[];
  likedIds: Set<string>;
}

export function WallpaperBrowsePage({
  initialData,
  trendingTags,
  likedIds: initialLikedIds,
}: WallpaperBrowsePageProps) {
  const router = useRouter();
  const [wallpapers, setWallpapers] = useState(initialData.wallpapers);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [page, setPage] = useState(initialData.page);
  const [isLoading, setIsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState(initialLikedIds);

  // Filter state
  const [sort, setSort] = useState<WallpaperSortOption>('newest');
  const [resolution, setResolution] = useState<ResolutionFilter | undefined>();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | undefined>();

  const fetchWallpapers = useCallback(async (
    newPage: number,
    append: boolean,
    overrides?: {
      sort?: WallpaperSortOption;
      resolution?: ResolutionFilter | undefined;
      search?: string;
      tag?: string | undefined;
    }
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(newPage));
      params.set('limit', '20');

      const s = overrides?.sort ?? sort;
      const r = overrides?.resolution ?? resolution;
      const q = overrides?.search ?? search;
      const t = overrides?.tag ?? activeTag;

      if (s) params.set('sort', s);
      if (r) params.set('resolution', r);
      if (q) params.set('search', q);
      if (t) params.set('tag', t);

      const res = await fetch(`/api/wallpapers?${params.toString()}`);

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
  }, [sort, resolution, search, activeTag]);

  const handleSortChange = (newSort: WallpaperSortOption) => {
    setSort(newSort);
    fetchWallpapers(1, false, { sort: newSort });
  };

  const handleResolutionChange = (newRes: ResolutionFilter | undefined) => {
    setResolution(newRes);
    fetchWallpapers(1, false, { resolution: newRes });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    const timer = setTimeout(() => {
      fetchWallpapers(1, false, { search: newSearch });
    }, 500);
    return () => clearTimeout(timer);
  };

  const handleTagClick = (tagSlug: string) => {
    const newTag = activeTag === tagSlug ? undefined : tagSlug;
    setActiveTag(newTag);
    fetchWallpapers(1, false, { tag: newTag });
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="font-vt323 text-5xl lg:text-6xl text-foreground uppercase tracking-tight">
          Wallpapers
        </h1>
        <p className="font-lato text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse and download high-resolution wallpapers from the community.
        </p>
        <Link href="/wallpapers/upload">
          <Button className="rounded-xl gap-2 font-vt323 text-lg uppercase mt-2">
            <Upload className="w-4 h-4" />
            Upload Wallpaper
          </Button>
        </Link>
      </div>

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {trendingTags.slice(0, 12).map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-vt323 uppercase tracking-wider transition-all ${
                activeTag === tag.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/5 text-primary/80 hover:bg-primary/10 border border-primary/10'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <WallpaperFilters
        currentSort={sort}
        currentResolution={resolution}
        currentSearch={search}
        onSortChange={handleSortChange}
        onResolutionChange={handleResolutionChange}
        onSearchChange={handleSearchChange}
      />

      {/* Grid */}
      <WallpaperGrid
        wallpapers={wallpapers}
        likedIds={likedIds}
        onLike={handleLike}
        onDownload={handleDownload}
        onClick={handleClick}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={isLoading}
      />
    </div>
  );
}
