'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  CanvasShare,
  CanvasShareInsert,
  CanvasShareUpdate,
  SharedCanvasResponse,
} from '@/types/share';

/**
 * Create a new share link for a canvas
 */
export async function createShare(
  data: Omit<CanvasShareInsert, 'user_id'>
): Promise<CanvasShare | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: share, error } = await supabase
    .from('canvas_shares')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating share:', error.message);
    return null;
  }

  return share;
}

/**
 * Get a share by ID (for the owner)
 */
export async function getShare(shareId: string): Promise<CanvasShare | null> {
  const supabase = await createClient();

  const { data: share, error } = await supabase
    .from('canvas_shares')
    .select('*')
    .eq('id', shareId)
    .single();

  if (error) {
    console.error('Error fetching share:', error.message);
    return null;
  }

  return share;
}

/**
 * Get all shares for the current user
 */
export async function getUserShares(): Promise<CanvasShare[]> {
  const supabase = await createClient();

  const { data: shares, error } = await supabase
    .from('canvas_shares')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user shares:', error.message);
    return [];
  }

  return shares ?? [];
}

/**
 * Get all shares for a specific canvas
 */
export async function getCanvasShares(canvasId: string): Promise<CanvasShare[]> {
  const supabase = await createClient();

  const { data: shares, error } = await supabase
    .from('canvas_shares')
    .select('*')
    .eq('canvas_id', canvasId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching canvas shares:', error.message);
    return [];
  }

  return shares ?? [];
}

/**
 * Update a share
 */
export async function updateShare(
  shareId: string,
  data: CanvasShareUpdate
): Promise<CanvasShare | null> {
  const supabase = await createClient();

  const { data: share, error } = await supabase
    .from('canvas_shares')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', shareId)
    .select()
    .single();

  if (error) {
    console.error('Error updating share:', error.message);
    return null;
  }

  return share;
}

/**
 * Delete a share
 */
export async function deleteShare(shareId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('canvas_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    console.error('Error deleting share:', error.message);
    return false;
  }

  return true;
}

/**
 * Get a shared canvas by token (public access - no auth required)
 * This uses the security definer function to bypass RLS
 */
export async function getSharedCanvas(
  token: string
): Promise<SharedCanvasResponse | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc('get_shared_canvas', { p_token: token });

  if (error) {
    console.error('Error fetching shared canvas:', error.message);
    return null;
  }

  return data as SharedCanvasResponse | null;
}

/**
 * Generate the full share URL for a share token
 */
export async function getShareUrl(token: string): Promise<string> {
  // Get the base URL from environment or default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/share/${token}`;
}
