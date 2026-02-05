-- Create prompt vault feature for saving, organizing, and sharing prompts
-- Migration: 20260205200000_create_prompt_vault.sql
-- Privacy model: Private by default, direct sharing only (no public gallery)

-- ============================================
-- 1. Create prompts table (main storage)
-- ============================================

create table if not exists public.prompts (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the prompt
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Prompt content
  name text not null,
  description text,
  prompt_text text not null,
  negative_prompt text,

  -- Generation settings as JSON (aspectRatio, imageSize, model, etc.)
  settings jsonb default '{}'::jsonb not null,

  -- Attribution for copied prompts (when receiving from shared)
  original_prompt_id uuid references public.prompts(id) on delete set null,
  original_author_id uuid references public.profiles(id) on delete set null,

  -- Organization
  is_favorite boolean default false not null,
  use_count integer default 0 not null, -- tracks how often user generates with this

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.prompts enable row level security;

-- Indexes
create index if not exists idx_prompts_user_id on public.prompts(user_id);
create index if not exists idx_prompts_user_favorite on public.prompts(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_prompts_original on public.prompts(original_prompt_id) where original_prompt_id is not null;

-- RLS Policies for prompts (PRIVATE ONLY - users can only see their own)
create policy "Users can view own prompts"
  on public.prompts for select
  using (user_id = auth.uid());

create policy "Users can insert own prompts"
  on public.prompts for insert
  with check (user_id = auth.uid());

create policy "Users can update own prompts"
  on public.prompts for update
  using (user_id = auth.uid());

create policy "Users can delete own prompts"
  on public.prompts for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create or replace function public.handle_prompt_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger on_prompt_update
  before update on public.prompts
  for each row
  execute function public.handle_prompt_updated_at();

-- ============================================
-- 2. Create prompt_shares table (direct user-to-user sharing)
-- ============================================

create table if not exists public.prompt_shares (
  id uuid default gen_random_uuid() primary key,

  -- The prompt being shared
  prompt_id uuid references public.prompts(id) on delete cascade not null,

  -- Who shared and who receives
  shared_by uuid references public.profiles(id) on delete cascade not null,
  shared_with uuid references public.profiles(id) on delete cascade not null,

  -- Optional message from sharer
  message text,

  -- Whether recipient has seen/acknowledged the share
  is_seen boolean default false not null,

  -- The duplicated prompt ID (created when share is auto-accepted)
  duplicated_prompt_id uuid references public.prompts(id) on delete set null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Prevent duplicate shares
  unique(prompt_id, shared_with)
);

-- Enable RLS
alter table public.prompt_shares enable row level security;

-- Indexes
create index if not exists idx_prompt_shares_prompt on public.prompt_shares(prompt_id);
create index if not exists idx_prompt_shares_shared_by on public.prompt_shares(shared_by);
create index if not exists idx_prompt_shares_shared_with on public.prompt_shares(shared_with);
create index if not exists idx_prompt_shares_unseen on public.prompt_shares(shared_with, is_seen) where is_seen = false;

-- RLS Policies
create policy "Users can view shares they sent"
  on public.prompt_shares for select
  using (shared_by = auth.uid());

create policy "Users can view shares they received"
  on public.prompt_shares for select
  using (shared_with = auth.uid());

create policy "Users can create shares for own prompts"
  on public.prompt_shares for insert
  with check (
    shared_by = auth.uid() and
    exists (select 1 from public.prompts where id = prompt_id and user_id = auth.uid())
  );

create policy "Sharers can update their shares"
  on public.prompt_shares for update
  using (shared_by = auth.uid());

create policy "Recipients can update shares they received"
  on public.prompt_shares for update
  using (shared_with = auth.uid());

create policy "Sharers can delete their shares"
  on public.prompt_shares for delete
  using (shared_by = auth.uid());

-- ============================================
-- 3. Create prompt_folders table (organization)
-- ============================================

create table if not exists public.prompt_folders (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Folder metadata
  name text not null,
  description text,
  color text, -- Hex color for UI (e.g., '#FF5733')
  icon text, -- Optional icon name (e.g., 'folder', 'star')

  -- Position for custom ordering
  position integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.prompt_folders enable row level security;

-- Indexes
create index if not exists idx_prompt_folders_user_id on public.prompt_folders(user_id);
create index if not exists idx_prompt_folders_position on public.prompt_folders(user_id, position);

-- RLS Policies (folders are private to owner)
create policy "Users can view own prompt_folders"
  on public.prompt_folders for select
  using (user_id = auth.uid());

create policy "Users can insert own prompt_folders"
  on public.prompt_folders for insert
  with check (user_id = auth.uid());

create policy "Users can update own prompt_folders"
  on public.prompt_folders for update
  using (user_id = auth.uid());

create policy "Users can delete own prompt_folders"
  on public.prompt_folders for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create trigger on_prompt_folder_update
  before update on public.prompt_folders
  for each row
  execute function public.handle_prompt_updated_at();

-- ============================================
-- 4. Create prompt_folder_items junction table
-- ============================================

create table if not exists public.prompt_folder_items (
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  folder_id uuid references public.prompt_folders(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (prompt_id, folder_id)
);

-- Enable RLS
alter table public.prompt_folder_items enable row level security;

-- Indexes
create index if not exists idx_prompt_folder_items_folder on public.prompt_folder_items(folder_id);
create index if not exists idx_prompt_folder_items_prompt on public.prompt_folder_items(prompt_id);

-- RLS Policies (access through parent tables)
create policy "Users can view own prompt_folder_items"
  on public.prompt_folder_items for select
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert own prompt_folder_items"
  on public.prompt_folder_items for insert
  with check (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.prompt_folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );

create policy "Users can update own prompt_folder_items"
  on public.prompt_folder_items for update
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete own prompt_folder_items"
  on public.prompt_folder_items for delete
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Create prompt_tags table
-- ============================================

create table if not exists public.prompt_tags (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Tag metadata
  name text not null,
  color text, -- Hex color for UI

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Unique tag name per user
  unique(user_id, name)
);

-- Enable RLS
alter table public.prompt_tags enable row level security;

-- Index
create index if not exists idx_prompt_tags_user_id on public.prompt_tags(user_id);

-- RLS Policies
create policy "Users can view own prompt_tags"
  on public.prompt_tags for select
  using (user_id = auth.uid());

create policy "Users can insert own prompt_tags"
  on public.prompt_tags for insert
  with check (user_id = auth.uid());

create policy "Users can update own prompt_tags"
  on public.prompt_tags for update
  using (user_id = auth.uid());

create policy "Users can delete own prompt_tags"
  on public.prompt_tags for delete
  using (user_id = auth.uid());

-- ============================================
-- 6. Create prompt_tag_items junction table
-- ============================================

create table if not exists public.prompt_tag_items (
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  tag_id uuid references public.prompt_tags(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (prompt_id, tag_id)
);

-- Enable RLS
alter table public.prompt_tag_items enable row level security;

-- Indexes
create index if not exists idx_prompt_tag_items_prompt on public.prompt_tag_items(prompt_id);
create index if not exists idx_prompt_tag_items_tag on public.prompt_tag_items(tag_id);

-- RLS Policies
create policy "Users can view own prompt_tag_items"
  on public.prompt_tag_items for select
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert own prompt_tag_items"
  on public.prompt_tag_items for insert
  with check (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.prompt_tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own prompt_tag_items"
  on public.prompt_tag_items for delete
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. Helper functions
-- ============================================

-- Function to increment use_count when generating with a prompt
create or replace function public.increment_prompt_use_count(p_prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update prompts
  set use_count = use_count + 1
  where id = p_prompt_id and user_id = auth.uid();
end;
$$;

-- Function to process a direct share (auto-accept by duplicating to recipient)
create or replace function public.process_prompt_share(p_share_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share prompt_shares%rowtype;
  v_original prompts%rowtype;
  v_new_id uuid;
begin
  -- Get the share (must be for current user and not yet processed)
  select * into v_share from prompt_shares
  where id = p_share_id
    and shared_with = auth.uid()
    and duplicated_prompt_id is null;

  if v_share is null then
    raise exception 'Share not found or already processed';
  end if;

  -- Get the original prompt
  select * into v_original from prompts where id = v_share.prompt_id;

  if v_original is null then
    raise exception 'Original prompt not found';
  end if;

  -- Create the copy for the recipient
  insert into prompts (
    user_id,
    name,
    description,
    prompt_text,
    negative_prompt,
    settings,
    original_prompt_id,
    original_author_id
  ) values (
    auth.uid(),
    v_original.name,
    v_original.description,
    v_original.prompt_text,
    v_original.negative_prompt,
    v_original.settings,
    v_original.id,
    v_original.user_id
  )
  returning id into v_new_id;

  -- Update the share record
  update prompt_shares
  set duplicated_prompt_id = v_new_id, is_seen = true
  where id = p_share_id;

  return v_new_id;
end;
$$;
