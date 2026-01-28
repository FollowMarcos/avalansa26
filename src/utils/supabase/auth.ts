import { createClient } from '@/utils/supabase/server';

/**
 * Get the current authenticated user (server-side)
 * @returns The user or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
