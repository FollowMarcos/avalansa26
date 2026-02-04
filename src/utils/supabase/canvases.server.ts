'use server';

import { createClient } from '@/utils/supabase/server';
import type { Canvas, CanvasInsert, CanvasUpdate } from '@/types/canvas';

/**
 * Create a new canvas
 */
export async function createCanvas(
  data: CanvasInsert
): Promise<Canvas | null> {
  const supabase = await createClient();

  const { data: canvas, error } = await supabase
    .from('canvases')
    .insert({
      user_id: data.user_id,
      name: data.name || 'Untitled',
      thumbnail_url: data.thumbnail_url || null,
      nodes: data.nodes || [],
      edges: data.edges || [],
      groups: data.groups || [],
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating canvas:', error.message);
    return null;
  }

  return canvas;
}

/**
 * Get a single canvas by ID
 */
export async function getCanvas(id: string): Promise<Canvas | null> {
  const supabase = await createClient();

  const { data: canvas, error } = await supabase
    .from('canvases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching canvas:', error.message);
    return null;
  }

  return canvas;
}

/**
 * Get all canvases for the current user (sorted by last updated)
 */
export async function getUserCanvases(): Promise<Canvas[]> {
  const supabase = await createClient();

  const { data: canvases, error } = await supabase
    .from('canvases')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching canvases:', error.message);
    return [];
  }

  return canvases ?? [];
}

/**
 * Update an existing canvas
 */
export async function updateCanvas(
  id: string,
  updates: CanvasUpdate
): Promise<Canvas | null> {
  const supabase = await createClient();

  const { data: canvas, error } = await supabase
    .from('canvases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating canvas:', error.message);
    return null;
  }

  return canvas;
}

/**
 * Delete a canvas by ID
 */
export async function deleteCanvas(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('canvases')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting canvas:', error.message);
    return false;
  }

  return true;
}

/**
 * Get the most recently updated canvas for the user
 */
export async function getLatestCanvas(): Promise<Canvas | null> {
  const supabase = await createClient();

  const { data: canvas, error } = await supabase
    .from('canvases')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No canvas found is not an error
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching latest canvas:', error.message);
    return null;
  }

  return canvas;
}
