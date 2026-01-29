'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  Profile,
  UserRole,
  AdminStats,
  GetProfilesOptions,
  PaginatedProfiles,
} from '@/types/database';

/**
 * Verify the current user is an admin
 * @returns True if admin, false otherwise
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
 * Get all profiles with pagination and filtering (admin only)
 */
export async function getAllProfiles(
  options: GetProfilesOptions = {}
): Promise<PaginatedProfiles> {
  const { page = 1, limit = 10, search = '', role = 'all', status = 'all' } = options;

  if (!(await isCurrentUserAdmin())) {
    return { profiles: [], total: 0, page: 1, totalPages: 0 };
  }

  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase.from('profiles').select('*', { count: 'exact' });

  // Apply search filter
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  // Apply role filter
  if (role !== 'all') {
    query = query.eq('role', role);
  }

  // Apply status filter
  if (status === 'completed') {
    query = query.eq('onboarding_completed', true);
  } else if (status === 'onboarding') {
    query = query.eq('onboarding_completed', false);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching profiles:', error.message);
    return { profiles: [], total: 0, page: 1, totalPages: 0 };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    profiles: data ?? [],
    total,
    page,
    totalPages,
  };
}

/**
 * Get admin dashboard statistics (admin only)
 */
export async function getAdminStats(): Promise<AdminStats> {
  if (!(await isCurrentUserAdmin())) {
    return { totalUsers: 0, activeUsers: 0, newUsers: 0, adminUsers: 0 };
  }

  const supabase = await createClient();

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get active users (onboarding completed)
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completed', true);

  // Get new users (created in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get admin users count
  const { count: adminUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    newUsers: newUsers ?? 0,
    adminUsers: adminUsers ?? 0,
  };
}

/**
 * Update a user's role (admin only)
 * @param userId - The user's ID
 * @param newRole - The new role to assign
 * @returns The updated profile or null on error
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<Profile | null> {
  if (!(await isCurrentUserAdmin())) {
    console.error('Unauthorized: Only admins can update user roles');
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error.message);
    return null;
  }

  return data;
}
