import { createClient } from '@/utils/supabase/server';
import { LandingPage } from '@/components/home/landing-page';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user profile for avatar and name (uses profile data, not Google metadata)
  let isAdmin = false;
  let profileAvatarUrl: string | null = null;
  let profileName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, avatar_url, name')
      .eq('id', user.id)
      .single();

    isAdmin = profile?.role === 'admin';
    profileAvatarUrl = profile?.avatar_url ?? null;
    profileName = profile?.name ?? null;
  }

  return (
    <LandingPage
      user={user}
      isAdmin={isAdmin}
      profileAvatarUrl={profileAvatarUrl}
      profileName={profileName}
    />
  );
}
