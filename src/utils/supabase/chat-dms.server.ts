'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  DmThread,
  ChatDmMessage,
  ChatDmMessageInsert,
  MessageAttachment,
  EmbedType,
  EmbedData,
} from '@/types/chat';

// ============================================
// DM Thread Operations
// ============================================

/**
 * Get or create a DM thread between the current user and another user.
 * Uses canonical ordering (user_a < user_b) to prevent duplicates.
 */
export async function getOrCreateDmThread(
  otherUserId: string
): Promise<DmThread | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (user.id === otherUserId) {
    console.error('Cannot create DM thread with yourself');
    return null;
  }

  // Canonical ordering
  const [userA, userB] =
    user.id < otherUserId
      ? [user.id, otherUserId]
      : [otherUserId, user.id];

  // Try to find existing thread
  const { data: existing } = await supabase
    .from('chat_dm_threads')
    .select('*')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .single();

  if (existing) {
    return enrichThread(existing, user.id);
  }

  // Create new thread
  const { data: created, error } = await supabase
    .from('chat_dm_threads')
    .insert({ user_a: userA, user_b: userB })
    .select()
    .single();

  if (error) {
    // Handle race condition: thread may have been created concurrently
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('chat_dm_threads')
        .select('*')
        .eq('user_a', userA)
        .eq('user_b', userB)
        .single();

      if (retry) return enrichThread(retry, user.id);
    }

    console.error('Error creating DM thread:', error.message);
    return null;
  }

  return enrichThread(created, user.id);
}

/**
 * Get all DM threads for the current user, with the other user's profile
 * and most recent message preview.
 */
export async function getDmThreads(): Promise<DmThread[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_dm_threads')
    .select('*')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching DM threads:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Enrich each thread with the other user's profile
  const enriched: DmThread[] = [];
  for (const thread of data) {
    const enrichedThread = await enrichThread(thread, user.id);
    if (enrichedThread) enriched.push(enrichedThread);
  }

  return enriched;
}

// ============================================
// DM Message Operations
// ============================================

interface GetDmMessagesOptions {
  limit?: number;
  before?: string;
}

/**
 * Get messages for a DM thread with cursor-based pagination.
 */
export async function getDmMessages(
  threadId: string,
  options: GetDmMessagesOptions = {}
): Promise<ChatDmMessage[]> {
  const { limit = 50, before } = options;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('chat_dm_messages')
    .select(
      `
      id, thread_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_dm_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching DM messages:', error.message);
    return [];
  }

  return (data ?? []).reverse().map(normalizeDmMessage);
}

/**
 * Send a DM message in a thread.
 * RLS enforces that only thread participants can send messages.
 */
export async function sendDmMessage(
  threadId: string,
  message: ChatDmMessageInsert
): Promise<ChatDmMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('Unauthorized: Must be logged in to send DMs');
    return null;
  }

  const content = message.content.trim();
  if (content.length === 0 || content.length > 4000) {
    console.error('Invalid DM content length');
    return null;
  }

  const attachments = validateAttachments(message.attachments ?? []);

  const insertData: Record<string, unknown> = {
    thread_id: threadId,
    user_id: user.id,
    content,
    attachments,
  };

  if (message.embed_type && message.embed_data) {
    insertData.embed_type = message.embed_type;
    insertData.embed_data = message.embed_data;
  }

  if (message.reply_to_id) {
    // Verify reply target belongs to the same DM thread (prevent cross-thread IDOR)
    const { data: replyTarget } = await supabase
      .from('chat_dm_messages')
      .select('id')
      .eq('id', message.reply_to_id)
      .eq('thread_id', threadId)
      .maybeSingle();

    if (replyTarget) {
      insertData.reply_to_id = message.reply_to_id;
    }
  }

  const { data, error } = await supabase
    .from('chat_dm_messages')
    .insert(insertData)
    .select(
      `
      id, thread_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_dm_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .single();

  if (error) {
    console.error('Error sending DM:', error.message);
    return null;
  }

  // Update thread's updated_at for ordering
  await supabase
    .from('chat_dm_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return normalizeDmMessage(data);
}

/**
 * Edit a DM message (own messages only).
 */
export async function editDmMessage(
  messageId: string,
  content: string
): Promise<ChatDmMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 4000) return null;

  const { data, error } = await supabase
    .from('chat_dm_messages')
    .update({
      content: trimmed,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('user_id', user.id)
    .select(
      `
      id, thread_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_dm_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .single();

  if (error) {
    console.error('Error editing DM:', error.message);
    return null;
  }

  return normalizeDmMessage(data);
}

/**
 * Soft-delete a DM message (own messages only).
 */
export async function deleteDmMessage(messageId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from('chat_dm_messages')
    .update({
      is_deleted: true,
      content: '[message deleted]',
      attachments: [],
      embed_type: null,
      embed_data: null,
    })
    .eq('id', messageId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting DM:', error.message);
    return false;
  }

  return true;
}

// ============================================
// Helpers
// ============================================

async function enrichThread(
  thread: Record<string, unknown>,
  currentUserId: string
): Promise<DmThread | null> {
  const supabase = await createClient();

  const otherUserId =
    thread.user_a === currentUserId ? thread.user_b : thread.user_a;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', otherUserId as string)
    .single();

  // Get last message for preview
  const { data: lastMessages } = await supabase
    .from('chat_dm_messages')
    .select('id, thread_id, user_id, content, is_deleted, created_at')
    .eq('thread_id', thread.id as string)
    .order('created_at', { ascending: false })
    .limit(1);

  const lastMessage = lastMessages?.[0] ?? null;

  return {
    id: thread.id as string,
    user_a: thread.user_a as string,
    user_b: thread.user_b as string,
    created_at: thread.created_at as string,
    updated_at: thread.updated_at as string,
    other_user: profile
      ? {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        }
      : undefined,
    last_message: lastMessage
      ? {
          id: lastMessage.id,
          thread_id: lastMessage.thread_id,
          user_id: lastMessage.user_id,
          content: lastMessage.content,
          attachments: [],
          embed_type: null,
          embed_data: null,
          is_edited: false,
          is_deleted: lastMessage.is_deleted,
          edited_at: null,
          reply_to_id: null,
          created_at: lastMessage.created_at,
        }
      : null,
  };
}

function validateAttachments(
  attachments: MessageAttachment[]
): MessageAttachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter(
      (a) =>
        typeof a.id === 'string' &&
        typeof a.filename === 'string' &&
        typeof a.content_type === 'string' &&
        typeof a.size === 'number' &&
        typeof a.url === 'string' &&
        typeof a.path === 'string' &&
        a.size > 0 &&
        a.size <= 25 * 1024 * 1024
    )
    .slice(0, 10);
}

function normalizeDmMessage(row: Record<string, unknown>): ChatDmMessage {
  const profile = row.profile as Record<string, unknown> | null;

  return {
    id: row.id as string,
    thread_id: row.thread_id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    attachments: (row.attachments as MessageAttachment[]) ?? [],
    embed_type: (row.embed_type as EmbedType) ?? null,
    embed_data: (row.embed_data as EmbedData) ?? null,
    is_edited: (row.is_edited as boolean) ?? false,
    is_deleted: (row.is_deleted as boolean) ?? false,
    edited_at: (row.edited_at as string) ?? null,
    reply_to_id: (row.reply_to_id as string) ?? null,
    created_at: row.created_at as string,
    profile: profile
      ? {
          username: profile.username as string | null,
          avatar_url: profile.avatar_url as string | null,
          role: profile.role as string,
        }
      : undefined,
  };
}
