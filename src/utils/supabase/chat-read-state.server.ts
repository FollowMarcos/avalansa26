'use server';

import { createClient } from '@/utils/supabase/server';
import type { UnreadCount } from '@/types/chat';

/**
 * Mark a channel or DM thread as read up to the current time.
 */
export async function markAsRead(
  target: { channelId: string } | { dmThreadId: string }
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const now = new Date().toISOString();

  if ('channelId' in target) {
    const { error } = await supabase.from('chat_read_state').upsert(
      {
        user_id: user.id,
        channel_id: target.channelId,
        dm_thread_id: null,
        last_read_at: now,
      },
      { onConflict: 'user_id,channel_id' }
    );

    if (error) {
      console.error('Error marking channel as read:', error.message);
      return false;
    }
  } else {
    const { error } = await supabase.from('chat_read_state').upsert(
      {
        user_id: user.id,
        channel_id: null,
        dm_thread_id: target.dmThreadId,
        last_read_at: now,
      },
      { onConflict: 'user_id,dm_thread_id' }
    );

    if (error) {
      console.error('Error marking DM as read:', error.message);
      return false;
    }
  }

  return true;
}

/**
 * Get unread message counts for all accessible channels and DM threads.
 * Returns counts of messages created after the user's last_read_at.
 */
export async function getUnreadCounts(): Promise<UnreadCount[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get all read states for this user
  const { data: readStates } = await supabase
    .from('chat_read_state')
    .select('channel_id, dm_thread_id, last_read_at')
    .eq('user_id', user.id);

  const channelReadMap = new Map<string, string>();
  const dmReadMap = new Map<string, string>();

  for (const state of readStates ?? []) {
    if (state.channel_id) {
      channelReadMap.set(state.channel_id, state.last_read_at);
    }
    if (state.dm_thread_id) {
      dmReadMap.set(state.dm_thread_id, state.last_read_at);
    }
  }

  const counts: UnreadCount[] = [];

  // Get accessible channels
  const { data: channels } = await supabase
    .from('chat_channels')
    .select('id')
    .eq('is_active', true)
    .eq('is_archived', false);

  // Count unread messages per channel
  for (const channel of channels ?? []) {
    const lastRead = channelReadMap.get(channel.id);

    let query = supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channel.id)
      .eq('is_deleted', false)
      .neq('user_id', user.id);

    if (lastRead) {
      query = query.gt('created_at', lastRead);
    }

    const { count } = await query;

    if (count && count > 0) {
      counts.push({
        id: channel.id,
        type: 'channel',
        count,
      });
    }
  }

  // Get DM threads
  const { data: dmThreads } = await supabase
    .from('chat_dm_threads')
    .select('id')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  // Count unread DM messages per thread
  for (const thread of dmThreads ?? []) {
    const lastRead = dmReadMap.get(thread.id);

    let query = supabase
      .from('chat_dm_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', thread.id)
      .eq('is_deleted', false)
      .neq('user_id', user.id);

    if (lastRead) {
      query = query.gt('created_at', lastRead);
    }

    const { count } = await query;

    if (count && count > 0) {
      counts.push({
        id: thread.id,
        type: 'dm',
        count,
      });
    }
  }

  return counts;
}

/**
 * Get total unread count across all channels and DMs (for dock badge).
 */
export async function getTotalUnreadCount(): Promise<number> {
  const counts = await getUnreadCounts();
  return counts.reduce((sum, c) => sum + c.count, 0);
}
