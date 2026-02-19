import { createClient } from '@/utils/supabase/client';

/** Public-safe subset of profile data returned by user search. */
export interface UserSearchResult {
    id: string;
    username: string | null;
    avatar_url: string | null;
    name: string | null;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.length < 2) return [];

    // Sanitize input - escape special SQL ILIKE characters to prevent injection
    // Escape: % (wildcard), _ (single char wildcard), , (query separator)
    const sanitizedQuery = query.replace(/[%_,]/g, '\\$&');

    const supabase = createClient();
    const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, name')
        .or(`username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
        .limit(10);

    return data || [];
}
