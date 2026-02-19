'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  grantPermission,
  revokePermission,
} from '@/utils/supabase/chat-permissions.server';
import { searchUsers } from '@/utils/supabase/users';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Search,
  Loader2,
  User,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ChatPermission } from '@/types/chat';
import type { UserSearchResult } from '@/utils/supabase/users';

interface PermissionsManagerProps {
  initialPermissions: ChatPermission[];
}

export function PermissionsManager({ initialPermissions }: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const permittedUserIds = permissions.map((p) => p.user_id);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        // Filter out users who already have the permission
        setSearchResults(results.filter((u) => !permittedUserIds.includes(u.id)));
      } catch {
        console.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, permittedUserIds]);

  const handleGrant = async (user: UserSearchResult) => {
    setIsGranting(true);
    const result = await grantPermission(user.id, 'manage_channels');

    if (result) {
      setPermissions((prev) => [result, ...prev]);
      setSearchQuery('');
      setSearchResults([]);
      toast.success(`Granted channel management to @${user.username}`);
    } else {
      toast.error('Failed to grant permission');
    }
    setIsGranting(false);
  };

  const handleRevoke = async (userId: string) => {
    const perm = permissions.find((p) => p.user_id === userId);
    const success = await revokePermission(userId, 'manage_channels');

    if (success) {
      setPermissions((prev) => prev.filter((p) => p.user_id !== userId));
      setRevokingUserId(null);
      toast.success(
        `Revoked channel management from @${perm?.user?.username ?? 'user'}`
      );
    } else {
      toast.error('Failed to revoke permission');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Channel Management Permissions</CardTitle>
        </div>
        <CardDescription>
          Grant non-admin users the ability to create, edit, and delete chat channels.
          Only admins can manage these permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users to grant permission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Search results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="border rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleGrant(user)}
                disabled={isGranting}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isGranting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No users found matching &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {/* Permitted users list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Channel Managers ({permissions.length})
          </p>

          {permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No users have been granted channel management permissions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={perm.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      @{perm.user?.username ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Granted{' '}
                      {perm.granted_by_user?.username
                        ? `by @${perm.granted_by_user.username}`
                        : ''}{' '}
                      {new Date(perm.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                    <Shield className="h-3 w-3" />
                    Manage Channels
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => setRevokingUserId(perm.user_id)}
                    aria-label={`Revoke permission from ${perm.user?.username}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokingUserId}
        onOpenChange={(open) => !open && setRevokingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Permission</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer be able to create, edit, or delete chat
              channels. They can still participate in channels they have access to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokingUserId && handleRevoke(revokingUserId)}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
