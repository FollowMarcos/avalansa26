-- ============================================================================
-- Chat System Migration
-- Admin-controlled channels with access levels (mirrors api_configs pattern)
-- ============================================================================

-- Ensure moddatetime extension is available (idempotent)
create extension if not exists moddatetime schema extensions;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

do $$ begin
  create type public.channel_access_level as enum ('public', 'authenticated', 'restricted');
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2.1 Chat Channels (admin-managed)
create table if not exists public.chat_channels (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references public.profiles(id) on delete set null,

  -- Channel info
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  color text,
  topic text,

  -- Access control (mirrors api_configs pattern)
  access_level public.channel_access_level default 'authenticated'::public.channel_access_level not null,
  allowed_users uuid[] default '{}',

  -- Status
  is_active boolean default true,
  is_archived boolean default false,
  position integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  constraint valid_channel_name check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint valid_channel_slug check (slug ~ '^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$'),
  constraint valid_channel_description check (description is null or char_length(description) <= 500),
  constraint valid_channel_topic check (topic is null or char_length(topic) <= 200)
);

-- 2.2 Chat Messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.chat_channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Content
  content text not null,

  -- Attachments (R2 paths stored as JSONB array)
  attachments jsonb default '[]'::jsonb not null,

  -- Embeds (shared generations, prompts, workflows)
  embed_type text,
  embed_data jsonb,

  -- Edit/delete tracking
  is_edited boolean default false not null,
  is_deleted boolean default false not null,
  edited_at timestamp with time zone,

  -- Reply threading
  reply_to_id uuid references public.chat_messages(id) on delete set null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  constraint valid_message_content check (char_length(content) >= 1 and char_length(content) <= 4000),
  constraint valid_embed_type check (embed_type is null or embed_type in ('generation', 'prompt', 'workflow', 'link'))
);

-- 2.3 Chat Reactions
create table if not exists public.chat_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.chat_messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint valid_emoji check (char_length(emoji) >= 1 and char_length(emoji) <= 32),
  unique(message_id, user_id, emoji)
);

-- 2.4 DM Threads
create table if not exists public.chat_dm_threads (
  id uuid default gen_random_uuid() primary key,
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Canonical ordering prevents duplicate threads
  constraint unique_dm_pair unique(user_a, user_b),
  constraint ordered_users check (user_a < user_b)
);

-- 2.5 DM Messages
create table if not exists public.chat_dm_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.chat_dm_threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  attachments jsonb default '[]'::jsonb not null,
  embed_type text,
  embed_data jsonb,
  is_edited boolean default false not null,
  is_deleted boolean default false not null,
  edited_at timestamp with time zone,
  reply_to_id uuid references public.chat_dm_messages(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint valid_dm_content check (char_length(content) >= 1 and char_length(content) <= 4000),
  constraint valid_dm_embed_type check (embed_type is null or embed_type in ('generation', 'prompt', 'workflow', 'link'))
);

-- 2.6 Read State (unread tracking)
create table if not exists public.chat_read_state (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  channel_id uuid references public.chat_channels(id) on delete cascade,
  dm_thread_id uuid references public.chat_dm_threads(id) on delete cascade,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Only one of channel_id or dm_thread_id can be set
  constraint one_target check (
    (channel_id is not null and dm_thread_id is null) or
    (channel_id is null and dm_thread_id is not null)
  ),
  unique(user_id, channel_id),
  unique(user_id, dm_thread_id)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

create index if not exists idx_chat_channels_position on public.chat_channels(position, name);
create index if not exists idx_chat_channels_slug on public.chat_channels(slug);
create index if not exists idx_chat_channels_access on public.chat_channels(access_level) where is_active = true;

create index if not exists idx_chat_messages_channel_created on public.chat_messages(channel_id, created_at desc);
create index if not exists idx_chat_messages_user on public.chat_messages(user_id);
create index if not exists idx_chat_messages_reply on public.chat_messages(reply_to_id) where reply_to_id is not null;

create index if not exists idx_chat_reactions_message on public.chat_reactions(message_id);
create index if not exists idx_chat_reactions_user on public.chat_reactions(user_id);

create index if not exists idx_chat_dm_threads_user_a on public.chat_dm_threads(user_a);
create index if not exists idx_chat_dm_threads_user_b on public.chat_dm_threads(user_b);

create index if not exists idx_chat_dm_messages_thread on public.chat_dm_messages(thread_id, created_at desc);
create index if not exists idx_chat_dm_messages_user on public.chat_dm_messages(user_id);

create index if not exists idx_chat_read_state_user on public.chat_read_state(user_id);
create index if not exists idx_chat_read_state_channel on public.chat_read_state(channel_id) where channel_id is not null;
create index if not exists idx_chat_read_state_dm on public.chat_read_state(dm_thread_id) where dm_thread_id is not null;

-- ============================================================================
-- 4. SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================================================

-- Check if a user has access to a specific channel
create or replace function public.has_channel_access(p_channel_id uuid, p_user_id uuid)
returns boolean as $$
declare
  v_channel record;
begin
  select access_level, allowed_users, is_active, is_archived
  into v_channel
  from public.chat_channels
  where id = p_channel_id;

  -- Channel not found or inactive/archived
  if v_channel is null or not v_channel.is_active or v_channel.is_archived then
    return false;
  end if;

  -- Public and authenticated channels: all logged-in users
  if v_channel.access_level in ('public', 'authenticated') then
    return true;
  end if;

  -- Restricted: check allowed_users array or admin role
  return p_user_id = any(v_channel.allowed_users)
    or exists (
      select 1 from public.profiles
      where id = p_user_id and role = 'admin'
    );
end;
$$ language plpgsql security definer stable;

-- Check if a user is a participant in a DM thread
create or replace function public.is_dm_participant(p_thread_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.chat_dm_threads
    where id = p_thread_id
    and (user_a = p_user_id or user_b = p_user_id)
  );
end;
$$ language plpgsql security definer stable;

-- Grant execute to authenticated users
grant execute on function public.has_channel_access(uuid, uuid) to authenticated;
grant execute on function public.is_dm_participant(uuid, uuid) to authenticated;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on chat_channels
create trigger handle_chat_channels_updated_at
  before update on public.chat_channels
  for each row execute procedure extensions.moddatetime(updated_at);

-- Auto-update updated_at on chat_dm_threads
create trigger handle_chat_dm_threads_updated_at
  before update on public.chat_dm_threads
  for each row execute procedure extensions.moddatetime(updated_at);

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
alter table public.chat_channels enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reactions enable row level security;
alter table public.chat_dm_threads enable row level security;
alter table public.chat_dm_messages enable row level security;
alter table public.chat_read_state enable row level security;

-- --------------------------------------------------------------------------
-- 6.1 chat_channels RLS (mirrors api_configs pattern)
-- --------------------------------------------------------------------------

-- Admins can manage all channels
create policy "Admins can manage all channels"
  on public.chat_channels for all
  using (public.is_admin())
  with check (public.is_admin());

-- Public channels are viewable by authenticated users
create policy "Public channels viewable by authenticated users"
  on public.chat_channels for select
  using (
    is_active = true
    and not is_archived
    and access_level = 'public'
    and auth.uid() is not null
  );

-- Authenticated channels are viewable by logged-in users
create policy "Authenticated channels viewable by logged-in users"
  on public.chat_channels for select
  using (
    is_active = true
    and not is_archived
    and access_level = 'authenticated'
    and auth.uid() is not null
  );

-- Restricted channels are viewable by allowed users only
create policy "Restricted channels viewable by allowed users"
  on public.chat_channels for select
  using (
    is_active = true
    and not is_archived
    and access_level = 'restricted'
    and auth.uid() = any(allowed_users)
  );

-- --------------------------------------------------------------------------
-- 6.2 chat_messages RLS
-- --------------------------------------------------------------------------

-- Users can read messages in channels they have access to
create policy "Users can read accessible channel messages"
  on public.chat_messages for select
  using (
    auth.uid() is not null
    and public.has_channel_access(channel_id, auth.uid())
  );

-- Users can send messages to channels they have access to
create policy "Users can send messages to accessible channels"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and public.has_channel_access(channel_id, auth.uid())
  );

-- Users can update their own messages (edit/soft-delete)
create policy "Users can update own messages"
  on public.chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can update any message (for moderation)
create policy "Admins can update any message"
  on public.chat_messages for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can hard-delete messages
create policy "Admins can delete messages"
  on public.chat_messages for delete
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- 6.3 chat_reactions RLS
-- --------------------------------------------------------------------------

-- Users can view reactions on messages they can see
create policy "Users can view reactions on accessible messages"
  on public.chat_reactions for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.chat_messages m
      where m.id = message_id
      and public.has_channel_access(m.channel_id, auth.uid())
    )
  );

-- Users can add reactions to accessible messages
create policy "Users can add reactions"
  on public.chat_reactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_messages m
      where m.id = message_id
      and public.has_channel_access(m.channel_id, auth.uid())
    )
  );

-- Users can remove their own reactions
create policy "Users can remove own reactions"
  on public.chat_reactions for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 6.4 chat_dm_threads RLS
-- --------------------------------------------------------------------------

-- Users can only see their own DM threads
create policy "Users can view own DM threads"
  on public.chat_dm_threads for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Users can create DM threads they are part of
create policy "Users can create DM threads"
  on public.chat_dm_threads for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- --------------------------------------------------------------------------
-- 6.5 chat_dm_messages RLS
-- --------------------------------------------------------------------------

-- Users can read DM messages in their threads
create policy "Users can read own DM messages"
  on public.chat_dm_messages for select
  using (
    auth.uid() is not null
    and public.is_dm_participant(thread_id, auth.uid())
  );

-- Users can send DM messages in their threads
create policy "Users can send DM messages"
  on public.chat_dm_messages for insert
  with check (
    auth.uid() = user_id
    and public.is_dm_participant(thread_id, auth.uid())
  );

-- Users can update their own DM messages
create policy "Users can update own DM messages"
  on public.chat_dm_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 6.6 chat_read_state RLS
-- --------------------------------------------------------------------------

-- Users can manage their own read state
create policy "Users can manage own read state"
  on public.chat_read_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 7. REALTIME PUBLICATION
-- ============================================================================

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_dm_messages;
alter publication supabase_realtime add table public.chat_reactions;
