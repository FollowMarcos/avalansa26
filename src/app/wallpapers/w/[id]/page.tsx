import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { WallpaperDetailPage } from '@/components/wallpapers/wallpaper-detail-page';
import { getWallpaperById } from '@/utils/supabase/wallpapers';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const wallpaper = await getWallpaperById(id);

  if (!wallpaper) {
    return { title: 'Wallpaper Not Found' };
  }

  return {
    title: `${wallpaper.title} | Avalansa Wallpapers`,
    description: wallpaper.description || `${wallpaper.width}x${wallpaper.height} wallpaper by ${wallpaper.user?.name || wallpaper.user?.username}`,
    openGraph: {
      title: wallpaper.title,
      description: wallpaper.description || `${wallpaper.width}x${wallpaper.height} wallpaper`,
      images: [
        {
          url: wallpaper.image_url,
          width: wallpaper.width,
          height: wallpaper.height,
          alt: wallpaper.title,
        },
      ],
    },
  };
}

export default async function WallpaperPage({ params }: PageProps) {
  const { id } = await params;
  const [wallpaper, supabase] = await Promise.all([
    getWallpaperById(id),
    createClient(),
  ]);

  if (!wallpaper) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-5xl mx-auto px-6 pt-24 pb-20">
        <WallpaperDetailPage wallpaper={wallpaper} currentUserId={currentUserId} />
      </main>
    </PageShell>
  );
}
