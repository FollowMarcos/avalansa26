import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/auth';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Complete your profile setup.',
  robots: {
    index: false,
    follow: false,
  },
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <OnboardingProgress />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
