'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { GoogleSignInButton } from '@/components/google-signin-button';
import { PageShell } from '@/components/layout/page-shell';

interface ToolAuthGateProps {
  children: React.ReactNode;
  toolName: string;
}

export function ToolAuthGate({ children, toolName }: ToolAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return null;
  }

  // Authenticated — render the tool
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated — show sign-in prompt
  return (
    <PageShell contentClassName="bg-transparent">
      <main className="container max-w-lg mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 border border-border">
            <Lock className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to use {toolName}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              This tool is available to Avalansa members. Create a free account to get started.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <GoogleSignInButton />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
