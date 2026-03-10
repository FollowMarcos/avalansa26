'use server';

import { createClient } from '@/utils/supabase/server';
import type { Profile } from '@/types/database';

export type ProfileAccessResult =
  | { allowed: true; currentUserId: string | null }
  | { allowed: false; reason: 'stealth' | 'authenticated' | 'restricted'; currentUserId: string | null };

interface CheckOptions {
  /** When true, bypasses profile visibility if the user has wallpapers_public enabled */
  wallpapersOnly?: boolean;
}

/**
 * Check if the current viewer can access a profile based on its visibility setting.
 *
 * Visibility levels:
 * - public: anyone can view
 * - authenticated: only logged-in users
 * - stealth: only the profile owner
 * - restricted: only the profile owner + users in allowed_viewers
 *
 * If `wallpapersOnly` is true, access is granted when `wallpapers_public` is enabled
 * on the profile, regardless of the profile's main visibility setting.
 */
export async function checkProfileAccess(
  profile: Profile,
  options?: CheckOptions
): Promise<ProfileAccessResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const visibility = profile.visibility ?? 'public';

  // Owner can always view their own profile
  if (currentUserId && currentUserId === profile.id) {
    return { allowed: true, currentUserId };
  }

  // If requesting wallpapers only and the user has opted into public wallpapers,
  // allow access regardless of profile visibility
  if (options?.wallpapersOnly && profile.wallpapers_public !== false) {
    return { allowed: true, currentUserId };
  }

  switch (visibility) {
    case 'public':
      return { allowed: true, currentUserId };

    case 'authenticated':
      if (currentUserId) {
        return { allowed: true, currentUserId };
      }
      return { allowed: false, reason: 'authenticated', currentUserId };

    case 'stealth':
      return { allowed: false, reason: 'stealth', currentUserId };

    case 'restricted': {
      const allowedViewers = profile.allowed_viewers ?? [];
      if (currentUserId && allowedViewers.includes(currentUserId)) {
        return { allowed: true, currentUserId };
      }
      return { allowed: false, reason: 'restricted', currentUserId };
    }

    default:
      return { allowed: true, currentUserId };
  }
}
