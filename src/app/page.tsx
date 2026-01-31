import { createClient } from '@/utils/supabase/server';
import { LandingPage } from '@/components/home/landing-page';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return <LandingPage user={user} isAdmin={isAdmin} />;
}
