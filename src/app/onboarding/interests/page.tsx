import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';
import { InterestsForm } from '@/components/onboarding/interests-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Interests',
};

export default async function InterestsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, interests')
    .eq('id', user.id)
    .single();

  // Require username before interests
  if (!profile?.username) {
    redirect('/onboarding/username');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-2">
        What are you interested in?
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        Add some tags to help us personalize your experience
      </p>
      <InterestsForm initialInterests={profile?.interests ?? []} />
    </div>
  );
}
