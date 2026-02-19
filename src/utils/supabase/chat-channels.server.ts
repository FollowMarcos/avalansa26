'use server';

import { createClient } from '@/utils/supabase/server';
import { canManageChannels } from '@/utils/supabase/chat-permissions.server';
import type {
  ChatChannel,
  ChatChannelInsert,
  ChatChannelUpdate,
} from '@/types/chat';

/**
 * Get all channels (management view — includes inactive/archived).
 * Requires manage_channels permission.
 */
export async function getAllChannels(): Promise<ChatChannel[]> {
  if (!(await canManageChannels())) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching all channels:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get channels accessible to the current user (RLS filtered).
 * Only returns active, non-archived channels.
 */
export async function getAccessibleChannels(): Promise<ChatChannel[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching accessible channels:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get a single channel by ID.
 */
export async function getChannel(id: string): Promise<ChatChannel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching channel:', error.message);
    return null;
  }

  return data;
}

/**
 * Get a channel by slug.
 */
export async function getChannelBySlug(
  slug: string
): Promise<ChatChannel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching channel by slug:', error.message);
    return null;
  }

  return data;
}

/**
 * Create a new channel (requires manage_channels permission).
 */
export async function createChannel(
  channel: ChatChannelInsert
): Promise<ChatChannel | null> {
  if (!(await canManageChannels())) {
    console.error('Unauthorized: Requires manage_channels permission to create channels');
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('chat_channels')
    .insert({
      ...channel,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating channel:', error.message);
    return null;
  }

  return data;
}

/**
 * Update an existing channel (requires manage_channels permission).
 */
export async function updateChannel(
  id: string,
  updates: ChatChannelUpdate
): Promise<ChatChannel | null> {
  if (!(await canManageChannels())) {
    console.error('Unauthorized: Requires manage_channels permission to update channels');
    return null;
  }

  const supabase = await createClient();

  // Filter to only allowed fields
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.icon !== undefined) updateData.icon = updates.icon;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.topic !== undefined) updateData.topic = updates.topic;
  if (updates.access_level !== undefined) updateData.access_level = updates.access_level;
  if (updates.allowed_users !== undefined) updateData.allowed_users = updates.allowed_users;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.is_archived !== undefined) updateData.is_archived = updates.is_archived;
  if (updates.position !== undefined) updateData.position = updates.position;

  const { data, error } = await supabase
    .from('chat_channels')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating channel:', error.message);
    return null;
  }

  return data;
}

/**
 * Delete a channel (requires manage_channels permission).
 */
export async function deleteChannel(id: string): Promise<boolean> {
  if (!(await canManageChannels())) {
    console.error('Unauthorized: Requires manage_channels permission to delete channels');
    return false;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_channels')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting channel:', error.message);
    return false;
  }

  return true;
}

/**
 * Add users to a restricted channel (requires manage_channels permission).
 */
export async function addChannelUsers(
  channelId: string,
  userIds: string[]
): Promise<ChatChannel | null> {
  if (!(await canManageChannels())) {
    console.error('Unauthorized: Requires manage_channels permission to manage channel users');
    return null;
  }

  const supabase = await createClient();

  // Get current allowed_users
  const { data: channel } = await supabase
    .from('chat_channels')
    .select('allowed_users')
    .eq('id', channelId)
    .single();

  if (!channel) {
    console.error('Channel not found');
    return null;
  }

  const currentUsers = new Set(channel.allowed_users ?? []);
  for (const uid of userIds) {
    currentUsers.add(uid);
  }

  const { data, error } = await supabase
    .from('chat_channels')
    .update({ allowed_users: Array.from(currentUsers) })
    .eq('id', channelId)
    .select()
    .single();

  if (error) {
    console.error('Error adding channel users:', error.message);
    return null;
  }

  return data;
}

/**
 * Remove users from a restricted channel (requires manage_channels permission).
 */
export async function removeChannelUsers(
  channelId: string,
  userIds: string[]
): Promise<ChatChannel | null> {
  if (!(await canManageChannels())) {
    console.error('Unauthorized: Requires manage_channels permission to manage channel users');
    return null;
  }

  const supabase = await createClient();

  const { data: channel } = await supabase
    .from('chat_channels')
    .select('allowed_users')
    .eq('id', channelId)
    .single();

  if (!channel) {
    console.error('Channel not found');
    return null;
  }

  const removeSet = new Set(userIds);
  const updatedUsers = (channel.allowed_users ?? []).filter(
    (uid: string) => !removeSet.has(uid)
  );

  const { data, error } = await supabase
    .from('chat_channels')
    .update({ allowed_users: updatedUsers })
    .eq('id', channelId)
    .select()
    .single();

  if (error) {
    console.error('Error removing channel users:', error.message);
    return null;
  }

  return data;
}

/**
 * Get channel members (profiles of allowed users for restricted channels,
 * or all users who have sent messages for public/authenticated channels).
 */
export async function getChannelMembers(
  channelId: string
): Promise<Array<{ id: string; username: string | null; avatar_url: string | null; role: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get distinct user IDs who have sent messages in this channel
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('user_id')
    .eq('channel_id', channelId)
    .limit(200);

  if (error) {
    console.error('Error fetching channel members:', error.message);
    return [];
  }

  const userIds = [...new Set((messages ?? []).map((m) => m.user_id))];

  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', userIds);

  return profiles ?? [];
}
