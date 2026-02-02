'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

interface DashboardHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

const BREADCRUMB_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/users': 'Users',
  '/dashboard/dock': 'Site Dock',
  '/dashboard/apis': 'APIs',
  '/dashboard/create': 'Create',
  '/dashboard/settings': 'Settings',
  '/dashboard/analytics': 'Analytics',
};

export function DashboardHeader({
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const currentLabel = BREADCRUMB_LABELS[pathname] || 'Dashboard';

  return (
    <header className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        <Link
          href="/"
          className="hover:text-primary cursor-pointer transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href="/dashboard"
          className="hover:text-primary cursor-pointer transition-colors"
        >
          Dashboard
        </Link>
        {pathname !== '/dashboard' && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{currentLabel}</span>
          </>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div className="h-9 w-px bg-border mx-2" />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
