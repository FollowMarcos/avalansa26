import { PageShell } from '@/components/layout/page-shell';
import { Lock, Users, Ghost } from 'lucide-react';

interface ProfileAccessDeniedProps {
  reason: 'stealth' | 'authenticated' | 'restricted';
}

const MESSAGES: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  stealth: {
    icon: <Ghost className="w-10 h-10 text-purple-500" />,
    title: 'Profile Hidden',
    description: 'This user has set their profile to stealth mode.',
  },
  authenticated: {
    icon: <Lock className="w-10 h-10 text-primary" />,
    title: 'Sign In Required',
    description: 'This profile is only visible to logged-in members of the community.',
  },
  restricted: {
    icon: <Users className="w-10 h-10 text-orange-500" />,
    title: 'Restricted Access',
    description: 'This profile is only visible to specific users selected by the owner.',
  },
};

export function ProfileAccessDenied({ reason }: ProfileAccessDeniedProps) {
  const msg = MESSAGES[reason];

  return (
    <PageShell contentClassName="relative min-h-screen">
      <main className="container max-w-md mx-auto px-6 pt-40 pb-20 text-center">
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto">
            {msg.icon}
          </div>
          <div className="space-y-2">
            <h1 className="font-vt323 text-3xl text-foreground uppercase tracking-tight">
              {msg.title}
            </h1>
            <p className="font-lato text-muted-foreground">
              {msg.description}
            </p>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
