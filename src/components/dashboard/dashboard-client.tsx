'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  ChevronRight,
  Filter,
  Download,
  ArrowUpRight,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Profile, AdminStats, UserRole } from '@/types/database';
import { getAllProfiles, updateUserRole } from '@/utils/supabase/admin';
import { DockManager } from './dock-manager';

interface DashboardClientProps {
  initialProfiles: Profile[];
  initialStats: AdminStats;
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

const STATS_CONFIG = [
  {
    key: 'totalUsers' as const,
    label: 'Total Users',
    icon: Users,
    color: 'text-primary',
  },
  {
    key: 'activeUsers' as const,
    label: 'Active Users',
    icon: UserCheck,
    color: 'text-emerald-500',
  },
  {
    key: 'newUsers' as const,
    label: 'New Users (30d)',
    icon: UserPlus,
    color: 'text-amber-500',
  },
  {
    key: 'adminUsers' as const,
    label: 'Admin Users',
    icon: ShieldCheck,
    color: 'text-blue-500',
  },
];

function getInitials(name: string | null, username: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return '??';
}

function getUserStatus(profile: Profile): 'completed' | 'onboarding' {
  return profile.onboarding_completed ? 'completed' : 'onboarding';
}

export function DashboardClient({
  initialProfiles,
  initialStats,
  initialTotal,
  initialPage,
  initialTotalPages,
}: DashboardClientProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Use local state for instant switching, initialized from URL
  const [activeTab, setActiveTabState] = useState<'users' | 'dock'>(
    tabParam === 'dock' ? 'dock' : 'users'
  );

  // Sync URL changes to local state (for sidebar navigation)
  useEffect(() => {
    const newTab = tabParam === 'dock' ? 'dock' : 'users';
    if (newTab !== activeTab) {
      setActiveTabState(newTab);
    }
  }, [tabParam]);

  // Update URL shallowly without triggering navigation
  const setActiveTab = (tab: 'users' | 'dock') => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isPending, startTransition] = useTransition();

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter(
      (profile) =>
        profile.name?.toLowerCase().includes(query) ||
        profile.username?.toLowerCase().includes(query)
    );
  }, [searchQuery, profiles]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
    );

    // Update stats optimistically
    setStats((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers + (newRole === 'admin' ? 1 : -1),
    }));

    startTransition(async () => {
      const updated = await updateUserRole(userId, newRole);
      if (!updated) {
        // Revert on failure
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === userId
              ? { ...p, role: newRole === 'admin' ? 'user' : 'admin' }
              : p
          )
        );
        setStats((prev) => ({
          ...prev,
          adminUsers: prev.adminUsers + (newRole === 'admin' ? -1 : 1),
        }));
      }
    });
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    startTransition(async () => {
      const result = await getAllProfiles({ page: newPage, limit: 10 });
      setProfiles(result.profiles);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // For server-side search, uncomment below:
    // startTransition(async () => {
    //   const result = await getAllProfiles({ page: 1, limit: 10, search: query });
    //   setProfiles(result.profiles);
    //   setPage(result.page);
    //   setTotal(result.total);
    //   setTotalPages(result.totalPages);
    // });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pt-6 lg:p-8 space-y-8 max-w-[2000px]">
      {/* Header & Breadcrumbs */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <span className="hover:text-primary cursor-pointer transition-colors">
            Home
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Welcome back to Avalansa Admin. Here&apos;s what&apos;s happening
              today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="h-9 gap-2 bg-primary text-primary-foreground hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
            <div className="h-9 w-px bg-border mx-2" />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CONFIG.map((stat, idx) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="p-2 rounded-xl bg-background border border-border group-hover:border-primary/30 transition-colors">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats[stat.key].toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center">
                    <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    from database
                  </span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content: User Table or Dock Manager */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
        <CardHeader className="px-6 py-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {activeTab === 'users' ? 'User Management' : 'Site Dock Management'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'users'
                  ? 'A complete directory of all registered users and their current status.'
                  : 'Manage the navigation dock, rearrange icons, and configure dropdowns.'}
              </CardDescription>
            </div>

            <div className="flex bg-muted/50 p-1 rounded-lg self-start md:self-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === 'users' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('dock')}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === 'dock' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Site Dock
              </button>
            </div>

            {activeTab === 'users' && (
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, username..."
                    className="pl-9 bg-background/50 border-border focus:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-border hover:bg-muted"
                  aria-label="Filter users"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {activeTab === 'users' ? (
          <div className="relative">
            {isPending && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <Table className="relative">
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[80px]">User</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Joined Date
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredProfiles.map((profile) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={profile.id}
                      className="group border-border/40 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell>
                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                          <AvatarImage src={profile.avatar_url ?? ''} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {getInitials(profile.name, profile.username)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile.name ?? 'No name'}
                        <div className="md:hidden text-xs text-muted-foreground font-normal mt-0.5">
                          @{profile.username ?? 'no-username'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">
                          @{profile.username ?? 'no-username'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`capitalize font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full ${profile.role === 'admin'
                            ? 'bg-primary/15 text-primary border border-primary/20'
                            : 'bg-muted text-muted-foreground border border-border'
                            }`}
                        >
                          {profile.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getUserStatus(profile) === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                              }`}
                          />
                          <span className="text-xs capitalize text-muted-foreground font-medium">
                            {getUserStatus(profile)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-card border-border shadow-xl"
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => {
                                if (profile.username) {
                                  window.open(`/u/${profile.username}`, '_blank');
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />{' '}
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                              Management
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                handleRoleChange(
                                  profile.id,
                                  profile.role === 'admin' ? 'user' : 'admin'
                                )
                              }
                            >
                              <UserCog className="w-4 h-4 text-muted-foreground" />
                              Switch to {profile.role === 'admin' ? 'User' : 'Admin'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>

            {filteredProfiles.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <div className="bg-muted/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery
                    ? 'No users found matching your search.'
                    : 'No users found.'}
                </p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="text-primary"
                  >
                    Clear search query
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <DockManager />
          </div>
        )}

        {/* Pagination Footer - Only show if in Users tab */}
        {activeTab === 'users' && (
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-semibold text-foreground">
                {filteredProfiles.length}
              </span>{' '}
              of <span className="font-semibold text-foreground">{total}</span>{' '}
              users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                className="h-8 px-3 text-xs"
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isPending}
                className="h-8 px-3 text-xs border-primary/20 text-primary"
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 hidden md:block">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full shadow-2xl bg-primary hover:scale-105 transition-transform"
          aria-label="Toggle dashboard view"
        >
          <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
