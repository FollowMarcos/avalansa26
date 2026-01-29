import { createClient } from '@/utils/supabase/server';
import { LandingPage } from '@/components/home/landing-page';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <LandingPage user={user} />;
}
