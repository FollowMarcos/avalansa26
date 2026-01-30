"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchUsers } from "@/utils/supabase/users";
import type { Profile } from "@/types/database";

interface AllowedViewersProps {
    currentAllowedIds: string[];
    onChange: (ids: string[]) => void;
}

export function AllowedViewers({ currentAllowedIds, onChange }: AllowedViewersProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [allowedProfiles, setAllowedProfiles] = useState<Profile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Load profile details for existing IDs
    useEffect(() => {
        async function loadAllowedProfiles() {
            if (currentAllowedIds.length === 0) {
                setAllowedProfiles([]);
                return;
            }

            setIsLoadingProfiles(true);
            // We'll reuse searchUsers but we really should have a "getProfilesByIds"
            // For now, let's just assume we might need to fetch them. 
            // Actually, let's just fetch them one by one or filter from search is inefficient.
            // Let's rely on the parent component or fetch them here properly.
            // Since I didn't create a 'getProfilesByIds' function, I'll simulate or add it.
            // For this step, I will just list IDs if I can't fetch names easily, 
            // BUT a better UX is to fetch the names.
            // Let's try to fetch them via specific query.

            try {
                const { createClient } = await import("@/utils/supabase/client");
                const supabase = createClient();
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', currentAllowedIds);

                if (data) setAllowedProfiles(data);
            } catch (e) {
                console.error("Failed to load allowed profiles", e);
            } finally {
                setIsLoadingProfiles(false);
            }
        }

        // Only load if allowedProfiles doesn't match currentAllowedIds length roughly
        if (currentAllowedIds.length !== allowedProfiles.length) {
            loadAllowedProfiles();
        }
    }, [currentAllowedIds]); // simplified dependency

    // Handle Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await searchUsers(searchQuery);
                // Filter out already selected users
                setSearchResults(results.filter(p => !currentAllowedIds.includes(p.id)));
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, currentAllowedIds]);

    const addUser = (user: Profile) => {
        const newIds = [...currentAllowedIds, user.id];
        onChange(newIds);
        setAllowedProfiles([...allowedProfiles, user]);
        setSearchQuery(""); // clear search
        setSearchResults([]);
    };

    const removeUser = (userId: string) => {
        const newIds = currentAllowedIds.filter(id => id !== userId);
        onChange(newIds);
        setAllowedProfiles(allowedProfiles.filter(p => p.id !== userId));
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search user by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
                    {searchResults.map(user => (
                        <button
                            key={user.id}
                            onClick={() => addUser(user)}
                            className="flex items-center gap-3 w-full p-2 hover:bg-muted/50 transition-colors text-left"
                        >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name || user.username}</p>
                                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            </div>
                            <PlusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {/* Selected Users List */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Allowed Viewers ({allowedProfiles.length})
                </p>

                {isLoadingProfiles ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading access list...
                    </div>
                ) : allowedProfiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No users allowed yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {allowedProfiles.map(user => (
                            <Badge key={user.id} variant="secondary" className="pl-1 pr-2 py-1 h-8 rounded-full flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]"><User className="h-3 w-3" /></AvatarFallback>
                                </Avatar>
                                <span className="max-w-[100px] truncate">{user.username}</span>
                                <button
                                    onClick={() => removeUser(user.id)}
                                    className="ml-1 hover:text-destructive transition-colors rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
