import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { UserWallpaperGallery } from '@/components/wallpapers/user-wallpaper-gallery';
import { getProfileByUsername } from '@/utils/supabase/profiles';
import { getCurrentProfile } from '@/utils/supabase/profiles';
import {
  getUserWallpapers,
  getUserWallpaperCollections,
  getUserLikedWallpaperIds,
} from '@/utils/supabase/wallpapers';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { title: 'User Not Found' };
  }

  const displayName = profile.name || profile.username || username;

  return {
    title: `${displayName}'s Wallpapers | Avalansa`,
    description: `Browse and download wallpapers by ${displayName} on Avalansa.`,
    openGraph: {
      title: `${displayName}'s Wallpapers`,
      description: `Browse wallpapers by ${displayName}`,
    },
  };
}

export default async function UserWallpapersPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const currentProfile = await getCurrentProfile();
  const isOwner = currentProfile?.id === profile.id;

  const [wallpaperData, collections] = await Promise.all([
    getUserWallpapers(username, { page: 1, limit: 20 }),
    isOwner ? getUserWallpaperCollections(profile.id) : Promise.resolve([]),
  ]);

  // Get liked wallpaper IDs for the current user
  const wallpaperIds = wallpaperData.wallpapers.map((w) => w.id);
  const likedIds = await getUserLikedWallpaperIds(wallpaperIds);

  const displayName = profile.name || profile.username || username;

  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-7xl mx-auto px-6 pt-24 pb-20">
        <UserWallpaperGallery
          initialData={wallpaperData}
          username={username}
          displayName={displayName}
          isOwner={isOwner}
          collections={collections}
          likedIds={likedIds}
        />
      </main>
    </PageShell>
  );
}
