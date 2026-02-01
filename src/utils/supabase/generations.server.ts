'use server';

import { createClient } from '@/utils/supabase/server';
import type { Generation, GenerationInsert } from '@/types/generation';

/**
 * Save a new generation to history
 */
export async function saveGeneration(
  data: GenerationInsert
): Promise<Generation | null> {
  const supabase = await createClient();

  const { data: generation, error } = await supabase
    .from('generations')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error saving generation:', error.message);
    return null;
  }

  return generation;
}

/**
 * Get user's generation history (paginated, newest first)
 */
export async function getGenerationHistory(
  limit: number = 50,
  offset: number = 0
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching generation history:', error.message);
    return [];
  }

  return generations ?? [];
}

/**
 * Get a single generation by ID
 */
export async function getGeneration(id: string): Promise<Generation | null> {
  const supabase = await createClient();

  const { data: generation, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching generation:', error.message);
    return null;
  }

  return generation;
}

/**
 * Delete a generation by ID
 */
export async function deleteGeneration(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting generation:', error.message);
    return false;
  }

  return true;
}

/**
 * Clear all user's generations
 */
export async function clearGenerationHistory(): Promise<boolean> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing generation history:', error.message);
    return false;
  }

  return true;
}

/**
 * Get count of user's generations
 */
export async function getGenerationCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting generations:', error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get generations for a specific session
 */
export async function getGenerationsBySession(
  sessionId: string
): Promise<Generation[]> {
  const supabase = await createClient();

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching session generations:', error.message);
    return [];
  }

  return generations ?? [];
}

/**
 * Delete all generations in a session
 */
export async function deleteGenerationsBySession(
  sessionId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error deleting session generations:', error.message);
    return false;
  }

  return true;
}
