'use server';

import { createClient } from '@/utils/supabase/server';
import type { ChatPermission, ChatPermissionType } from '@/types/chat';

/**
 * Verify the current user is an admin.
 */
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Check if the current user can manage channels (admin OR has manage_channels permission).
 */
export async function canManageChannels(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Check admin first
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') return true;

  // Check chat permission
  const { data: perm } = await supabase
    .from('chat_permissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('permission', 'manage_channels')
    .maybeSingle();

  return !!perm;
}

/**
 * Get all chat permissions (admin only).
 */
export async function getAllPermissions(): Promise<ChatPermission[]> {
  if (!(await isCurrentUserAdmin())) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_permissions')
    .select(`
      *,
      user:profiles!chat_permissions_user_id_fkey(id, username, avatar_url),
      granted_by_user:profiles!chat_permissions_granted_by_fkey(username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching chat permissions:', error.message);
    return [];
  }

  return (data ?? []) as ChatPermission[];
}

/**
 * Get permissions for the current user.
 */
export async function getMyPermissions(): Promise<ChatPermissionType[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Admin has all permissions implicitly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') return ['manage_channels'];

  const { data, error } = await supabase
    .from('chat_permissions')
    .select('permission')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching my permissions:', error.message);
    return [];
  }

  return (data ?? []).map((p) => p.permission as ChatPermissionType);
}

/**
 * Grant a permission to a user (admin only).
 */
export async function grantPermission(
  userId: string,
  permission: ChatPermissionType
): Promise<ChatPermission | null> {
  if (!(await isCurrentUserAdmin())) {
    console.error('Unauthorized: Only admins can grant chat permissions');
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('chat_permissions')
    .upsert(
      {
        user_id: userId,
        permission,
        granted_by: user.id,
      },
      { onConflict: 'user_id,permission' }
    )
    .select(`
      *,
      user:profiles!chat_permissions_user_id_fkey(id, username, avatar_url),
      granted_by_user:profiles!chat_permissions_granted_by_fkey(username)
    `)
    .single();

  if (error) {
    console.error('Error granting permission:', error.message);
    return null;
  }

  return data as ChatPermission;
}

/**
 * Revoke a permission from a user (admin only).
 */
export async function revokePermission(
  userId: string,
  permission: ChatPermissionType
): Promise<boolean> {
  if (!(await isCurrentUserAdmin())) {
    console.error('Unauthorized: Only admins can revoke chat permissions');
    return false;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('permission', permission);

  if (error) {
    console.error('Error revoking permission:', error.message);
    return false;
  }

  return true;
}
