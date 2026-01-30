import { createClient } from '@/utils/supabase/client';
import type { Profile } from '@/types/database';

export async function searchUsers(query: string): Promise<Profile[]> {
    if (!query || query.length < 2) return [];

    const supabase = createClient();
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);

    return data || [];
}
