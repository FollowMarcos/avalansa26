'use client';

import { createClient } from './client';
import type { DockItem, DockItemInsert, DockItemUpdate } from '@/types/database';

export async function getDockItems() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('dock_items')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching dock items:', error);
        return [];
    }

    return data as DockItem[];
}

export async function createDockItem(item: DockItemInsert) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('dock_items')
        .insert(item)
        .select()
        .single();

    if (error) {
        console.error('Error creating dock item:', error);
        return null;
    }

    return data as DockItem;
}

export async function updateDockItem(id: string, updates: DockItemUpdate) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('dock_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating dock item:', error);
        return null;
    }

    return data as DockItem;
}

export async function deleteDockItem(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('dock_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting dock item:', error);
        return false;
    }

    return true;
}

export async function reorderDockItems(items: { id: string; order: number }[]) {
    const supabase = createClient();

    // This could be optimized to a single RPC call if needed, but for small lists loop is fine
    for (const item of items) {
        const { error } = await supabase
            .from('dock_items')
            .update({ order: item.order })
            .eq('id', item.id);

        if (error) {
            console.error(`Error updating order for item ${item.id}:`, error);
            return false;
        }
    }

    return true;
}
