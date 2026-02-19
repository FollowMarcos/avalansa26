/**
 * Chat System Types
 *
 * Types for the admin-controlled chat system.
 * Channels follow the same access_level pattern as api_configs.
 */

// ============================================
// Access Level Types
// ============================================

export type ChannelAccessLevel = 'public' | 'authenticated' | 'restricted';

// ============================================
// Channel Types
// ============================================

export interface ChatChannel {
  id: string;
  created_by: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  topic: string | null;
  access_level: ChannelAccessLevel;
  allowed_users: string[];
  is_active: boolean;
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChatChannelInsert {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  topic?: string | null;
  access_level?: ChannelAccessLevel;
  allowed_users?: string[];
  position?: number;
}

export interface ChatChannelUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  topic?: string | null;
  access_level?: ChannelAccessLevel;
  allowed_users?: string[];
  is_active?: boolean;
  is_archived?: boolean;
  position?: number;
}

// ============================================
// Message Types
// ============================================

export type EmbedType = 'generation' | 'prompt' | 'workflow' | 'link';

export interface MessageAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  path: string;
  width?: number;
  height?: number;
}

export interface GenerationEmbed {
  generation_id: string;
  image_url: string;
  prompt: string;
  model: string;
  aspect_ratio?: string;
}

export interface PromptEmbed {
  prompt_id: string;
  text: string;
  tags?: string[];
}

export interface WorkflowEmbed {
  canvas_id: string;
  name: string;
  node_count: number;
  thumbnail_url?: string;
}

export interface LinkEmbed {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
}

export type EmbedData = GenerationEmbed | PromptEmbed | WorkflowEmbed | LinkEmbed;

export interface MessageProfile {
  username: string | null;
  avatar_url: string | null;
  role: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  attachments: MessageAttachment[];
  embed_type: EmbedType | null;
  embed_data: EmbedData | null;
  is_edited: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  reply_to_id: string | null;
  created_at: string;
  /** Joined from profiles table */
  profile?: MessageProfile;
  /** Joined reply context */
  reply_to?: ChatMessage | null;
}

export interface ChatMessageInsert {
  content: string;
  attachments?: MessageAttachment[];
  embed_type?: EmbedType;
  embed_data?: EmbedData;
  reply_to_id?: string;
}

// ============================================
// DM Types
// ============================================

export interface DmThread {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  updated_at: string;
  /** Joined: the other participant's profile */
  other_user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  /** Joined: most recent message for preview */
  last_message?: ChatDmMessage | null;
}

export interface ChatDmMessage {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  attachments: MessageAttachment[];
  embed_type: EmbedType | null;
  embed_data: EmbedData | null;
  is_edited: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  reply_to_id: string | null;
  created_at: string;
  /** Joined from profiles table */
  profile?: MessageProfile;
  /** Joined reply context */
  reply_to?: ChatDmMessage | null;
}

export interface ChatDmMessageInsert {
  content: string;
  attachments?: MessageAttachment[];
  embed_type?: EmbedType;
  embed_data?: EmbedData;
  reply_to_id?: string;
}

// ============================================
// Read State Types
// ============================================

export interface ChatReadState {
  id: string;
  user_id: string;
  channel_id: string | null;
  dm_thread_id: string | null;
  last_read_at: string;
}

export interface UnreadCount {
  id: string;
  type: 'channel' | 'dm';
  count: number;
}

// ============================================
// Reaction Types
// ============================================

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/** Aggregated reactions for display */
export interface ReactionGroup {
  emoji: string;
  count: number;
  user_ids: string[];
  has_reacted: boolean;
}

// ============================================
// Permission Types
// ============================================

export type ChatPermissionType = 'manage_channels';

export interface ChatPermission {
  id: string;
  user_id: string;
  permission: ChatPermissionType;
  granted_by: string | null;
  created_at: string;
  /** Joined from profiles table */
  user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  /** Joined: who granted this permission */
  granted_by_user?: {
    username: string | null;
  };
}

export const CHAT_PERMISSIONS = [
  {
    value: 'manage_channels' as const,
    label: 'Manage Channels',
    description: 'Create, edit, and delete chat channels',
  },
] as const;

// ============================================
// Channel Access Level Options (for UI)
// ============================================

export const CHANNEL_ACCESS_LEVELS = [
  {
    value: 'public' as const,
    label: 'Public',
    description: 'All authenticated users can see and chat',
    icon: 'Globe',
  },
  {
    value: 'authenticated' as const,
    label: 'Authenticated',
    description: 'All logged-in users can access this channel',
    icon: 'Users',
  },
  {
    value: 'restricted' as const,
    label: 'Restricted',
    description: 'Only selected users can access this channel',
    icon: 'Lock',
  },
] as const;
