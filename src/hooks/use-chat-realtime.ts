'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, ChatDmMessage, MessageProfile } from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Channel Messages Realtime
// ============================================

/**
 * Subscribe to real-time messages for the active channel.
 * Handles INSERT, UPDATE events via Supabase Realtime.
 */
export function useChatRealtime(channelId: string | null): void {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const addChannelMessage = useChatStore((s) => s.addChannelMessage);
  const updateChannelMessage = useChatStore((s) => s.updateChannelMessage);

  useEffect(() => {
    if (!channelId) {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`chat-messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const message = await enrichMessage(row);
          if (message) {
            addChannelMessage(channelId, message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const message = await enrichMessage(row);
          if (message) {
            updateChannelMessage(channelId, message);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [channelId, addChannelMessage, updateChannelMessage]);
}

// ============================================
// DM Messages Realtime
// ============================================

/**
 * Subscribe to real-time messages for the active DM thread.
 */
export function useDmRealtime(threadId: string | null): void {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const addDmMessage = useChatStore((s) => s.addDmMessage);
  const updateDmMessage = useChatStore((s) => s.updateDmMessage);

  useEffect(() => {
    if (!threadId) {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`chat-dms:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_dm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const message = await enrichDmMessage(row);
          if (message) {
            addDmMessage(threadId, message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_dm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const message = await enrichDmMessage(row);
          if (message) {
            updateDmMessage(threadId, message);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [threadId, addDmMessage, updateDmMessage]);
}

// ============================================
// Presence (who's online in a channel)
// ============================================

interface PresenceState {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Track and get online users in a channel using Supabase Presence.
 */
export function usePresence(
  channelId: string | null,
  currentUser: { id: string; username: string; avatarUrl: string | null } | null
): PresenceState[] {
  const presenceRef = useRef<PresenceState[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channelId || !currentUser) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      presenceRef.current = [];
      return;
    }

    const supabase = createClient();

    const channel = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const users: PresenceState[] = [];

        for (const presences of Object.values(state)) {
          for (const presence of presences) {
            users.push({
              userId: presence.userId,
              username: presence.username,
              avatarUrl: presence.avatarUrl,
            });
          }
        }

        presenceRef.current = users;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      presenceRef.current = [];
    };
  }, [channelId, currentUser]);

  return presenceRef.current;
}

// ============================================
// Helpers
// ============================================

/** Fetch profile data for a Realtime payload (which doesn't include joins). */
async function fetchProfile(
  userId: string
): Promise<MessageProfile | undefined> {
  const supabase = createClient();

  const { data } = await supabase
    .from('profiles')
    .select('username, avatar_url, role')
    .eq('id', userId)
    .single();

  if (!data) return undefined;

  return {
    username: data.username,
    avatar_url: data.avatar_url,
    role: data.role,
  };
}

async function enrichMessage(
  row: Record<string, unknown>
): Promise<ChatMessage | null> {
  const profile = await fetchProfile(row.user_id as string);

  return {
    id: row.id as string,
    channel_id: row.channel_id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    attachments: (row.attachments as ChatMessage['attachments']) ?? [],
    embed_type: (row.embed_type as ChatMessage['embed_type']) ?? null,
    embed_data: (row.embed_data as ChatMessage['embed_data']) ?? null,
    is_edited: (row.is_edited as boolean) ?? false,
    is_deleted: (row.is_deleted as boolean) ?? false,
    edited_at: (row.edited_at as string) ?? null,
    reply_to_id: (row.reply_to_id as string) ?? null,
    created_at: row.created_at as string,
    profile,
  };
}

async function enrichDmMessage(
  row: Record<string, unknown>
): Promise<ChatDmMessage | null> {
  const profile = await fetchProfile(row.user_id as string);

  return {
    id: row.id as string,
    thread_id: row.thread_id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    attachments: (row.attachments as ChatDmMessage['attachments']) ?? [],
    embed_type: (row.embed_type as ChatDmMessage['embed_type']) ?? null,
    embed_data: (row.embed_data as ChatDmMessage['embed_data']) ?? null,
    is_edited: (row.is_edited as boolean) ?? false,
    is_deleted: (row.is_deleted as boolean) ?? false,
    edited_at: (row.edited_at as string) ?? null,
    reply_to_id: (row.reply_to_id as string) ?? null,
    created_at: row.created_at as string,
    profile,
  };
}
