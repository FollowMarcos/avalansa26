'use server';

import { createClient } from '@/utils/supabase/server';
import type { CreateSettings, CreateSettingsUpdate } from '@/types/create-settings';

// Settings singleton ID (fixed UUID for single-row table)
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Verify the current user is an admin
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
 * Get current create settings (for all authenticated users)
 */
export async function getCreateSettings(): Promise<CreateSettings | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('create_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single();

  if (error) {
    console.error('Error fetching create settings:', error.message);
    return null;
  }

  return data;
}

/**
 * Update create settings (admin only)
 */
export async function updateCreateSettings(
  updates: CreateSettingsUpdate
): Promise<CreateSettings | null> {
  if (!(await isCurrentUserAdmin())) {
    console.error('Unauthorized: Only admins can update create settings');
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('create_settings')
    .update({
      ...updates,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SETTINGS_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating create settings:', error.message);
    return null;
  }

  return data;
}

/**
 * Toggle maintenance mode (admin only)
 */
export async function toggleMaintenanceMode(
  enabled: boolean,
  message?: string
): Promise<boolean> {
  const result = await updateCreateSettings({
    maintenance_mode: enabled,
    maintenance_message: message ?? null,
  });
  return result !== null;
}
