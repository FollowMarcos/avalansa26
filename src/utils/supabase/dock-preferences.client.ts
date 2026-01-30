'use client';

import { createClient } from './client';
import type { DockPreferences, DockPreferencesUpdate, DockType, DockIconPosition } from '@/types/database';

/**
 * Default icon order for the dock (matches site-dock draggable items)
 */
export const DEFAULT_ICON_ORDER: DockIconPosition[] = [
    { id: 'library', order: 0 },
    { id: 'imagine', order: 1 },
    { id: 'labs', order: 2 },
    { id: 'tools', order: 3 },
];

/**
 * Get the current user's dock preferences
 */
export async function getDockPreferences(): Promise<DockPreferences | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('dock_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        // PGRST116 means no rows found - user hasn't set preferences yet
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching dock preferences:', error);
        return null;
    }

    return data as DockPreferences;
}

/**
 * Save or update the user's dock preferences
 */
export async function saveDockPreferences(
    preferences: DockPreferencesUpdate
): Promise<DockPreferences | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('No authenticated user');
        return null;
    }

    // Use upsert to create or update
    const { data, error } = await supabase
        .from('dock_preferences')
        .upsert({
            user_id: user.id,
            dock_type: preferences.dock_type,
            icon_positions: preferences.icon_positions,
        }, {
            onConflict: 'user_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving dock preferences:', error);
        return null;
    }

    return data as DockPreferences;
}

/**
 * Update only the dock type
 */
export async function updateDockType(dockType: DockType): Promise<boolean> {
    const result = await saveDockPreferences({ dock_type: dockType });
    return result !== null;
}

/**
 * Update only the icon positions
 */
export async function updateIconPositions(positions: DockIconPosition[]): Promise<boolean> {
    const result = await saveDockPreferences({ icon_positions: positions });
    return result !== null;
}

/**
 * Get default preferences for a new user
 */
export function getDefaultDockPreferences(): Omit<DockPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    return {
        dock_type: 'milky_dream_light',
        icon_positions: DEFAULT_ICON_ORDER,
    };
}
