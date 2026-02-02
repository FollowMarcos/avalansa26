import { createClient } from '@/utils/supabase/client';
import type { Profile } from '@/types/database';

export async function searchUsers(query: string): Promise<Profile[]> {
    if (!query || query.length < 2) return [];

    // Sanitize input - escape special SQL ILIKE characters to prevent injection
    // Escape: % (wildcard), _ (single char wildcard), , (query separator)
    const sanitizedQuery = query.replace(/[%_,]/g, '\\$&');

    const supabase = createClient();
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
        .limit(10);

    return data || [];
}
