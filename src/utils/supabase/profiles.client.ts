import { createClient } from '@/utils/supabase/client';
import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Client-side profile utilities
 * Use these in React components with useEffect or event handlers
 */

/**
 * Get the current user's profile (client-side)
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Get a profile by username (client-side)
 */
export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile by username:', error.message);
    return null;
  }

  return data;
}

/**
 * Update profile (client-side)
 */
export async function updateProfile(
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Check if a username is available (client-side)
 */
export async function checkUsernameAvailable(
  username: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (error && error.code === 'PGRST116') {
    return true; // Username available
  }

  return data === null;
}

