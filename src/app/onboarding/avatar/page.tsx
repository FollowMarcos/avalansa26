import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';
import { AvatarForm } from '@/components/onboarding/avatar-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Choose Avatar',
};

export default async function AvatarPage() {
    const user = await getUser();

    if (!user) {
        redirect('/');
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

    // Require username before avatar
    if (!profile?.username) {
        redirect('/onboarding/username');
    }

    return (
        <div className="max-w-md mx-auto w-full">
            <h1 className="text-2xl font-bold text-center mb-2">
                Pick your look
            </h1>
            <p className="text-muted-foreground text-center mb-8">
                How do you want to appear on Avalansa?
            </p>
            <AvatarForm initialAvatarUrl={profile?.avatar_url} />
        </div>
    );
}
