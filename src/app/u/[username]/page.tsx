import { notFound } from 'next/navigation';
import { getProfileByUsername } from '@/utils/supabase/profiles';
import { getUserWallpapers } from '@/utils/supabase/wallpapers';
import { checkProfileAccess } from '@/utils/supabase/profile-access';
import { PublicProfile } from '@/components/public-profile';
import { ProfileAccessDenied } from '@/components/profile-access-denied';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;

  const profile = await getProfileByUsername(username.toLowerCase());

  if (!profile || !profile.onboarding_completed) {
    notFound();
  }

  const access = await checkProfileAccess(profile);

  if (!access.allowed) {
    return <ProfileAccessDenied reason={access.reason} />;
  }

  const wallpaperData = await getUserWallpapers(username.toLowerCase(), {
    page: 1,
    limit: 6,
    sort: 'newest',
  });

  return (
    <PublicProfile
      profile={profile}
      recentWallpapers={wallpaperData.wallpapers}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username.toLowerCase());

  if (!profile || !profile.onboarding_completed) {
    return {
      title: 'Profile Not Found',
    };
  }

  const displayName = profile.name || profile.username;

  return {
    title: `${displayName} (@${profile.username}) | Avalansa`,
    description: profile.bio || `Check out ${displayName}'s profile on Avalansa`,
  };
}
