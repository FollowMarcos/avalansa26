import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';
import { BioForm } from '@/components/onboarding/bio-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Bio',
};

export default async function BioPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio')
    .eq('id', user.id)
    .single();

  // Require username before bio
  if (!profile?.username) {
    redirect('/onboarding/username');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-2">
        Tell us about yourself
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        Add a short bio to let others know who you are
      </p>
      <BioForm initialBio={profile?.bio ?? ''} />
    </div>
  );
}
