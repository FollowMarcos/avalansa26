'use client';

import { useState, useMemo, useTransition } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Filter,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
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
import type { Profile, UserRole } from '@/types/database';
import { getAllProfiles, updateUserRole } from '@/utils/supabase/admin';

interface UsersManagerProps {
  initialProfiles: Profile[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

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

export function UsersManager({
  initialProfiles,
  initialTotal,
  initialPage,
  initialTotalPages,
}: UsersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
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
  };

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
      <CardHeader className="px-6 py-6 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>
              A complete directory of all registered users and their current
              status.
            </CardDescription>
          </div>
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
        </div>
      </CardHeader>

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
              <TableHead className="hidden xl:table-cell">Joined Date</TableHead>
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
                      className={cn(
                        'capitalize font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full',
                        profile.role === 'admin'
                          ? 'bg-primary/15 text-primary border border-primary/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      )}
                    >
                      {profile.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          getUserStatus(profile) === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        )}
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
                          <Eye className="w-4 h-4 text-muted-foreground" /> View
                          Profile
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

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">
            {filteredProfiles.length}
          </span>{' '}
          of <span className="font-semibold text-foreground">{total}</span> users
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
    </Card>
  );
}
