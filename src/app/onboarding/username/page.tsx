import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';
import { UsernameForm } from '@/components/onboarding/username-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose Username',
};

export default async function UsernamePage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-2">
        Choose your username
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        This will be your unique identifier on the platform
      </p>
      <UsernameForm initialUsername={profile?.username ?? ''} />
    </div>
  );
}
