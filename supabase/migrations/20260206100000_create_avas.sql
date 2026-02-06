-- Create Avas feature for custom AI prompt generators
-- Migration: 20260206100000_create_avas.sql
-- Avas are like custom GPTs for prompt generation: users define instructions,
-- then run them with text/image input to generate image generation prompts.
-- Privacy model: Private by default, direct sharing only (same as prompts)

-- ============================================
-- 1. Create avas table (main storage)
-- ============================================

create table if not exists public.avas (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the ava
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Ava identity
  name text not null,
  description text,
  instructions text not null, -- System prompt for the LLM

  -- Optional avatar image URL
  avatar_url text,

  -- Attribution for copied avas (when receiving from shared)
  original_ava_id uuid references public.avas(id) on delete set null,
  original_author_id uuid references public.profiles(id) on delete set null,

  -- Organization
  is_favorite boolean default false not null,
  use_count integer default 0 not null, -- tracks how often user runs this ava

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.avas enable row level security;

-- Indexes
create index if not exists idx_avas_user_id on public.avas(user_id);
create index if not exists idx_avas_user_favorite on public.avas(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_avas_original on public.avas(original_ava_id) where original_ava_id is not null;

-- RLS Policies for avas (PRIVATE ONLY)
create policy "Users can view own avas"
  on public.avas for select
  using (user_id = auth.uid());

create policy "Users can insert own avas"
  on public.avas for insert
  with check (user_id = auth.uid());

create policy "Users can update own avas"
  on public.avas for update
  using (user_id = auth.uid());

create policy "Users can delete own avas"
  on public.avas for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger (reuse existing function)
create trigger on_ava_update
  before update on public.avas
  for each row
  execute function public.handle_prompt_updated_at();

-- ============================================
-- 2. Create ava_shares table (direct user-to-user sharing)
-- ============================================

create table if not exists public.ava_shares (
  id uuid default gen_random_uuid() primary key,

  -- The ava being shared
  ava_id uuid references public.avas(id) on delete cascade not null,

  -- Who shared and who receives
  shared_by uuid references public.profiles(id) on delete cascade not null,
  shared_with uuid references public.profiles(id) on delete cascade not null,

  -- Optional message from sharer
  message text,

  -- Whether recipient has seen/acknowledged the share
  is_seen boolean default false not null,

  -- The duplicated ava ID (created when share is auto-accepted)
  duplicated_ava_id uuid references public.avas(id) on delete set null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Prevent duplicate shares
  unique(ava_id, shared_with)
);

-- Enable RLS
alter table public.ava_shares enable row level security;

-- Indexes
create index if not exists idx_ava_shares_ava on public.ava_shares(ava_id);
create index if not exists idx_ava_shares_shared_by on public.ava_shares(shared_by);
create index if not exists idx_ava_shares_shared_with on public.ava_shares(shared_with);
create index if not exists idx_ava_shares_unseen on public.ava_shares(shared_with, is_seen) where is_seen = false;

-- RLS Policies
create policy "Users can view ava shares they sent"
  on public.ava_shares for select
  using (shared_by = auth.uid());

create policy "Users can view ava shares they received"
  on public.ava_shares for select
  using (shared_with = auth.uid());

create policy "Users can create shares for own avas"
  on public.ava_shares for insert
  with check (
    shared_by = auth.uid() and
    exists (select 1 from public.avas where id = ava_id and user_id = auth.uid())
  );

create policy "Sharers can update their ava shares"
  on public.ava_shares for update
  using (shared_by = auth.uid());

create policy "Recipients can update ava shares they received"
  on public.ava_shares for update
  using (shared_with = auth.uid());

create policy "Sharers can delete their ava shares"
  on public.ava_shares for delete
  using (shared_by = auth.uid());

-- ============================================
-- 3. Create ava_folders table (organization)
-- ============================================

create table if not exists public.ava_folders (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Folder metadata
  name text not null,
  description text,
  color text, -- Hex color for UI (e.g., '#FF5733')
  icon text, -- Optional icon name

  -- Position for custom ordering
  position integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ava_folders enable row level security;

-- Indexes
create index if not exists idx_ava_folders_user_id on public.ava_folders(user_id);
create index if not exists idx_ava_folders_position on public.ava_folders(user_id, position);

-- RLS Policies
create policy "Users can view own ava_folders"
  on public.ava_folders for select
  using (user_id = auth.uid());

create policy "Users can insert own ava_folders"
  on public.ava_folders for insert
  with check (user_id = auth.uid());

create policy "Users can update own ava_folders"
  on public.ava_folders for update
  using (user_id = auth.uid());

create policy "Users can delete own ava_folders"
  on public.ava_folders for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create trigger on_ava_folder_update
  before update on public.ava_folders
  for each row
  execute function public.handle_prompt_updated_at();

-- ============================================
-- 4. Create ava_folder_items junction table
-- ============================================

create table if not exists public.ava_folder_items (
  ava_id uuid references public.avas(id) on delete cascade not null,
  folder_id uuid references public.ava_folders(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (ava_id, folder_id)
);

-- Enable RLS
alter table public.ava_folder_items enable row level security;

-- Indexes
create index if not exists idx_ava_folder_items_folder on public.ava_folder_items(folder_id);
create index if not exists idx_ava_folder_items_ava on public.ava_folder_items(ava_id);

-- RLS Policies (access through parent tables)
create policy "Users can view own ava_folder_items"
  on public.ava_folder_items for select
  using (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
  );

create policy "Users can insert own ava_folder_items"
  on public.ava_folder_items for insert
  with check (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
    and exists (
      select 1 from public.ava_folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );

create policy "Users can update own ava_folder_items"
  on public.ava_folder_items for update
  using (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
  );

create policy "Users can delete own ava_folder_items"
  on public.ava_folder_items for delete
  using (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Create ava_tags table
-- ============================================

create table if not exists public.ava_tags (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Tag metadata
  name text not null,
  color text,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Unique tag name per user
  unique(user_id, name)
);

-- Enable RLS
alter table public.ava_tags enable row level security;

-- Index
create index if not exists idx_ava_tags_user_id on public.ava_tags(user_id);

-- RLS Policies
create policy "Users can view own ava_tags"
  on public.ava_tags for select
  using (user_id = auth.uid());

create policy "Users can insert own ava_tags"
  on public.ava_tags for insert
  with check (user_id = auth.uid());

create policy "Users can update own ava_tags"
  on public.ava_tags for update
  using (user_id = auth.uid());

create policy "Users can delete own ava_tags"
  on public.ava_tags for delete
  using (user_id = auth.uid());

-- ============================================
-- 6. Create ava_tag_items junction table
-- ============================================

create table if not exists public.ava_tag_items (
  ava_id uuid references public.avas(id) on delete cascade not null,
  tag_id uuid references public.ava_tags(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (ava_id, tag_id)
);

-- Enable RLS
alter table public.ava_tag_items enable row level security;

-- Indexes
create index if not exists idx_ava_tag_items_ava on public.ava_tag_items(ava_id);
create index if not exists idx_ava_tag_items_tag on public.ava_tag_items(tag_id);

-- RLS Policies
create policy "Users can view own ava_tag_items"
  on public.ava_tag_items for select
  using (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
  );

create policy "Users can insert own ava_tag_items"
  on public.ava_tag_items for insert
  with check (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
    and exists (
      select 1 from public.ava_tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own ava_tag_items"
  on public.ava_tag_items for delete
  using (
    exists (
      select 1 from public.avas a
      where a.id = ava_id and a.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. Helper functions
-- ============================================

-- Function to increment use_count when running an ava
create or replace function public.increment_ava_use_count(p_ava_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update avas
  set use_count = use_count + 1
  where id = p_ava_id and user_id = auth.uid();
end;
$$;

-- Function to process a direct share (auto-accept by duplicating to recipient)
create or replace function public.process_ava_share(p_share_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share ava_shares%rowtype;
  v_original avas%rowtype;
  v_new_id uuid;
begin
  -- Get the share (must be for current user and not yet processed)
  select * into v_share from ava_shares
  where id = p_share_id
    and shared_with = auth.uid()
    and duplicated_ava_id is null;

  if v_share is null then
    raise exception 'Share not found or already processed';
  end if;

  -- Get the original ava
  select * into v_original from avas where id = v_share.ava_id;

  if v_original is null then
    raise exception 'Original ava not found';
  end if;

  -- Create the copy for the recipient
  insert into avas (
    user_id,
    name,
    description,
    instructions,
    avatar_url,
    original_ava_id,
    original_author_id
  ) values (
    auth.uid(),
    v_original.name,
    v_original.description,
    v_original.instructions,
    v_original.avatar_url,
    v_original.id,
    v_original.user_id
  )
  returning id into v_new_id;

  -- Update the share record
  update ava_shares
  set duplicated_ava_id = v_new_id, is_seen = true
  where id = p_share_id;

  return v_new_id;
end;
$$;
