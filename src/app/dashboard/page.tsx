import Link from 'next/link';
import { getAdminStats } from '@/utils/supabase/admin';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Dock,
  Server,
  Palette,
  ArrowRight,
} from 'lucide-react';

const QUICK_LINKS = [
  {
    icon: Users,
    label: 'User Management',
    description: 'Manage users, roles, and permissions',
    href: '/dashboard/users',
    color: 'text-primary',
  },
  {
    icon: Dock,
    label: 'Site Dock',
    description: 'Configure navigation and dock items',
    href: '/dashboard/dock',
    color: 'text-emerald-500',
  },
  {
    icon: Server,
    label: 'API Configuration',
    description: 'Manage AI APIs and endpoints',
    href: '/dashboard/apis',
    color: 'text-amber-500',
  },
  {
    icon: Palette,
    label: 'Create Settings',
    description: 'Control image generation features',
    href: '/dashboard/create',
    color: 'text-blue-500',
  },
];

export default async function DashboardOverviewPage() {
  const stats = await getAdminStats();

  return (
    <DashboardPage>
      <DashboardHeader
        title="Dashboard"
        description="Welcome back to Avalansa Admin. Here's what's happening today."
      />

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:bg-card/80 transition-all duration-300 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors">
                      <link.icon className={`w-5 h-5 ${link.color}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-1">{link.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
}
