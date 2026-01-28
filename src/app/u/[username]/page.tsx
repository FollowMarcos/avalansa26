import { notFound } from 'next/navigation';
import { getProfileByUsername } from '@/utils/supabase/profiles';
import { PublicProfile } from '@/components/public-profile';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;

  const profile = await getProfileByUsername(username.toLowerCase());

  if (!profile || !profile.onboarding_completed) {
    notFound();
  }

  return <PublicProfile profile={profile} />;
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
