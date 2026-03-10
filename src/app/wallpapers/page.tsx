import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { WallpaperBrowsePage } from '@/components/wallpapers/wallpaper-browse-page';
import {
  getPublicWallpapers,
  getWallpaperTags,
  getUserLikedWallpaperIds,
} from '@/utils/supabase/wallpapers';

export const metadata: Metadata = {
  title: 'Wallpapers | Avalansa',
  description: 'Browse and download high-resolution wallpapers from the Avalansa community.',
  openGraph: {
    title: 'Wallpapers | Avalansa',
    description: 'Browse and download high-resolution wallpapers from the Avalansa community.',
  },
};

export default async function WallpapersPage() {
  const [wallpaperData, trendingTags] = await Promise.all([
    getPublicWallpapers({ page: 1, limit: 20, sort: 'newest' }),
    getWallpaperTags(),
  ]);

  const wallpaperIds = wallpaperData.wallpapers.map((w) => w.id);
  const likedIds = await getUserLikedWallpaperIds(wallpaperIds);

  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-7xl mx-auto px-6 pt-24 pb-20">
        <WallpaperBrowsePage
          initialData={wallpaperData}
          trendingTags={trendingTags}
          likedIds={likedIds}
        />
      </main>
    </PageShell>
  );
}
