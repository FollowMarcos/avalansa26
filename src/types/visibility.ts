export type ProfileVisibility = 'public' | 'authenticated' | 'stealth' | 'restricted';

export interface UserSearchResult {
    id: string;
    username: string;
    name: string | null;
    avatar_url: string | null;
}
