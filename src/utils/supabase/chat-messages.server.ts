'use server';

import { createClient } from '@/utils/supabase/server';
import type {
  ChatMessage,
  ChatMessageInsert,
  MessageAttachment,
  EmbedType,
  EmbedData,
} from '@/types/chat';

// ============================================
// Message Queries
// ============================================

interface GetMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

/**
 * Get messages for a channel with cursor-based pagination.
 * Joins profile data for each message author.
 */
export async function getMessages(
  channelId: string,
  options: GetMessagesOptions = {}
): Promise<ChatMessage[]> {
  const { limit = 50, before, after } = options;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('chat_messages')
    .select(
      `
      id, channel_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  if (after) {
    query = query.gt('created_at', after);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching messages:', error.message);
    return [];
  }

  // Reverse to show oldest first in the UI
  return (data ?? []).reverse().map(normalizeMessage);
}

/**
 * Get a single message by ID with profile data.
 */
export async function getMessage(
  messageId: string
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(
      `
      id, channel_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .eq('id', messageId)
    .single();

  if (error) {
    console.error('Error fetching message:', error.message);
    return null;
  }

  return normalizeMessage(data);
}

// ============================================
// Message Mutations
// ============================================

/**
 * Send a message to a channel.
 * RLS enforces channel access — will fail if user doesn't have access.
 */
export async function sendMessage(
  channelId: string,
  message: ChatMessageInsert
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('Unauthorized: Must be logged in to send messages');
    return null;
  }

  // Validate content length
  const content = message.content.trim();
  if (content.length === 0 || content.length > 4000) {
    console.error('Invalid message content length');
    return null;
  }

  // Validate attachments
  const attachments = validateAttachments(message.attachments ?? []);

  // Build insert data
  const insertData: Record<string, unknown> = {
    channel_id: channelId,
    user_id: user.id,
    content,
    attachments,
  };

  if (message.embed_type && message.embed_data) {
    const validatedEmbed = validateEmbed(message.embed_type, message.embed_data);
    if (validatedEmbed) {
      insertData.embed_type = validatedEmbed.type;
      insertData.embed_data = validatedEmbed.data;
    }
  }

  if (message.reply_to_id) {
    // Verify reply target belongs to the same channel (prevent cross-channel IDOR)
    const { data: replyTarget } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('id', message.reply_to_id)
      .eq('channel_id', channelId)
      .maybeSingle();

    if (replyTarget) {
      insertData.reply_to_id = message.reply_to_id;
    }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(insertData)
    .select(
      `
      id, channel_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .single();

  if (error) {
    console.error('Error sending message:', error.message);
    return null;
  }

  return normalizeMessage(data);
}

/**
 * Edit a message (own messages only, enforced by RLS).
 */
export async function editMessage(
  messageId: string,
  content: string
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > 4000) {
    console.error('Invalid message content length');
    return null;
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .update({
      content: trimmed,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('user_id', user.id)
    .select(
      `
      id, channel_id, user_id, content, attachments,
      embed_type, embed_data, is_edited, is_deleted,
      edited_at, reply_to_id, created_at,
      profile:profiles!chat_messages_user_id_fkey(username, avatar_url, role)
    `
    )
    .single();

  if (error) {
    console.error('Error editing message:', error.message);
    return null;
  }

  return normalizeMessage(data);
}

/**
 * Soft-delete a message. Users can delete their own messages.
 * Admins can delete any message via separate RLS policy.
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Check if user is admin (can delete any message)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  let query = supabase
    .from('chat_messages')
    .update({
      is_deleted: true,
      content: '[message deleted]',
      attachments: [],
      embed_type: null,
      embed_data: null,
    })
    .eq('id', messageId);

  // Non-admins can only delete their own messages (defense-in-depth with RLS)
  if (!isAdmin) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.select('id').maybeSingle();

  if (error) {
    console.error('Error deleting message:', error.message);
    return false;
  }

  // Return false if no rows were affected (unauthorized or not found)
  return !!data;
}

// ============================================
// Reactions
// ============================================

/**
 * Toggle a reaction on a message.
 */
export async function toggleReaction(
  messageId: string,
  emoji: string
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  if (emoji.length === 0 || emoji.length > 32) return false;

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('chat_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('chat_reactions')
      .delete()
      .eq('id', existing.id);

    return !error;
  }

  // Cap unique reactions per user per message to prevent spam
  const { count } = await supabase
    .from('chat_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('message_id', messageId)
    .eq('user_id', user.id);

  if ((count ?? 0) >= 20) return false;

  // Add reaction
  const { error } = await supabase.from('chat_reactions').insert({
    message_id: messageId,
    user_id: user.id,
    emoji,
  });

  return !error;
}

/**
 * Get reactions for a list of message IDs.
 */
export async function getReactionsForMessages(
  messageIds: string[]
): Promise<
  Record<string, Array<{ emoji: string; count: number; user_ids: string[] }>>
> {
  if (messageIds.length === 0) return {};

  // Cap to prevent oversized queries
  const bounded = messageIds.slice(0, 200);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_reactions')
    .select('message_id, emoji, user_id')
    .in('message_id', bounded);

  if (error || !data) return {};

  // Group by message_id → emoji → user_ids
  const result: Record<
    string,
    Array<{ emoji: string; count: number; user_ids: string[] }>
  > = {};

  const grouped = new Map<string, Map<string, string[]>>();

  for (const reaction of data) {
    if (!grouped.has(reaction.message_id)) {
      grouped.set(reaction.message_id, new Map());
    }
    const emojiMap = grouped.get(reaction.message_id)!;
    if (!emojiMap.has(reaction.emoji)) {
      emojiMap.set(reaction.emoji, []);
    }
    emojiMap.get(reaction.emoji)!.push(reaction.user_id);
  }

  for (const [messageId, emojiMap] of grouped) {
    result[messageId] = Array.from(emojiMap.entries()).map(
      ([emoji, user_ids]) => ({
        emoji,
        count: user_ids.length,
        user_ids,
      })
    );
  }

  return result;
}

// ============================================
// Helpers
// ============================================

/** Only allow https URLs (or http for local dev). */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validate attachment data structure and URLs.
 */
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
        a.size <= 25 * 1024 * 1024 &&
        isSafeUrl(a.url) &&
        a.path.startsWith('r2:chat-attachments/')
    )
    .slice(0, 10); // Max 10 attachments per message
}

/**
 * Validate embed type and data structure.
 * Rejects malformed or unexpected embed payloads.
 */
function validateEmbed(
  type: EmbedType,
  data: EmbedData
): { type: EmbedType; data: EmbedData } | null {
  if (!data || typeof data !== 'object') return null;

  const VALID_TYPES: EmbedType[] = ['generation', 'prompt', 'workflow', 'link'];
  if (!VALID_TYPES.includes(type)) return null;

  const d = data as unknown as Record<string, unknown>;

  switch (type) {
    case 'generation': {
      if (
        typeof d.generation_id !== 'string' ||
        typeof d.prompt !== 'string' ||
        typeof d.model !== 'string'
      ) return null;
      if (d.image_url && !isSafeUrl(d.image_url as string)) return null;
      return { type, data };
    }
    case 'prompt': {
      if (typeof d.text !== 'string' || d.text.length === 0) return null;
      return { type, data };
    }
    case 'workflow': {
      if (typeof d.canvas_id !== 'string' || typeof d.name !== 'string') return null;
      if (d.thumbnail_url && !isSafeUrl(d.thumbnail_url as string)) return null;
      return { type, data };
    }
    case 'link': {
      if (typeof d.url !== 'string' || !isSafeUrl(d.url)) return null;
      if (d.image_url && !isSafeUrl(d.image_url as string)) return null;
      return { type, data };
    }
    default:
      return null;
  }
}

/**
 * Normalize database row to ChatMessage interface.
 */
function normalizeMessage(row: Record<string, unknown>): ChatMessage {
  const profile = row.profile as Record<string, unknown> | null;

  return {
    id: row.id as string,
    channel_id: row.channel_id as string,
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
