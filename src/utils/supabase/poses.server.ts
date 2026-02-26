'use server';

import { createClient } from '@/utils/supabase/server';

export interface SavedPose {
  id: string;
  user_id: string;
  name: string;
  joints: Array<{ id: string; x: number; y: number }>;
  image_path: string;
  image_url: string;
  created_at: string;
}

/**
 * Save a new pose to the user's library.
 */
export async function savePose(data: {
  name: string;
  joints: Array<{ id: string; x: number; y: number }>;
  image_path: string;
  image_url: string;
}): Promise<SavedPose | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pose, error } = await supabase
    .from('saved_poses')
    .insert({
      user_id: user.id,
      name: data.name,
      joints: data.joints,
      image_path: data.image_path,
      image_url: data.image_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving pose:', error.message);
    return null;
  }

  return pose as SavedPose;
}

/**
 * Get all saved poses for the current user (newest first).
 */
export async function getSavedPoses(): Promise<SavedPose[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_poses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching poses:', error.message);
    return [];
  }

  return (data ?? []) as SavedPose[];
}

/**
 * Delete a saved pose by ID.
 */
export async function deleteSavedPose(poseId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_poses')
    .delete()
    .eq('id', poseId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting pose:', error.message);
    return false;
  }

  return true;
}
