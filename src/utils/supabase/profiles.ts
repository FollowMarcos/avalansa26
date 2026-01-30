'use server';

import { createClient } from '@/utils/supabase/server';
import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Get the current user's profile
 * @returns The user's profile or null if not found
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

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
 * Get a profile by username (for public profiles)
 * @param username - The unique username
 * @returns The profile or null if not found
 */
export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = await createClient();

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
 * Get a profile by user ID
 * @param userId - The user's UUID
 * @returns The profile or null if not found
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Update the current user's profile
 * @param updates - The fields to update
 * @returns The updated profile or null on error
 */
export async function updateCurrentProfile(
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  // ONLY allow specific fields to be updated by the user themselves
  const { name, bio, avatar_url, interests, username, avatar_history, website, visibility, allowed_viewers } = updates;
  const filteredUpdates: ProfileUpdate = {};

  if (name !== undefined) filteredUpdates.name = name;
  if (bio !== undefined) filteredUpdates.bio = bio;
  if (avatar_url !== undefined) filteredUpdates.avatar_url = avatar_url;
  if (interests !== undefined) filteredUpdates.interests = interests;
  if (username !== undefined) filteredUpdates.username = username;
  if (avatar_history !== undefined) filteredUpdates.avatar_history = avatar_history;
  if (website !== undefined) filteredUpdates.website = website;
  if (visibility !== undefined) filteredUpdates.visibility = visibility;
  if (allowed_viewers !== undefined) filteredUpdates.allowed_viewers = allowed_viewers;

  const { data, error } = await supabase
    .from('profiles')
    .update(filteredUpdates)
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
 * Check if a username is already taken
 * @param username - The username to check
 * @returns True if username is taken, false if available
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (error && error.code === 'PGRST116') {
    // PGRST116 = no rows returned, username is available
    return false;
  }

  return data !== null;
}

/**
 * Check if a profile exists for the current user
 * @returns Boolean indicating if profile exists
 */
export async function profileExists(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  return !error && data !== null;
}

/**
 * Ensure profile exists - creates one if missing (fallback for trigger failures)
 * @returns The profile
 */
export async function ensureProfileExists(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Try to get existing profile first
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Create profile if it doesn't exist (fallback)
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email,
      avatar_url:
        user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error.message);
    return null;
  }

  return newProfile;
}
