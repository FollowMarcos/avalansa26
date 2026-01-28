import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';
import { CompletionCard } from '@/components/onboarding/completion-card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup Complete',
};

export default async function CompletePage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, onboarding_completed')
    .eq('id', user.id)
    .single();

  // If not completed, redirect to start
  if (!profile?.onboarding_completed) {
    redirect('/onboarding/username');
  }

  return <CompletionCard name={profile.name} username={profile.username} />;
}
