-- Add favorites, tags, and collections to organize generated images
-- Migration: 20260204000000_add_favorites_tags_collections.sql

-- ============================================
-- 1. Add is_favorite column to generations
-- ============================================

alter table public.generations
  add column if not exists is_favorite boolean default false not null;

-- Index for efficient favorite lookups
create index if not exists idx_generations_is_favorite
  on public.generations(user_id, is_favorite)
  where is_favorite = true;

-- Allow users to update their own generations (for favoriting)
create policy "Users can update own generations"
  on public.generations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- 2. Create collections table
-- ============================================

create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the collection
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Collection metadata
  name text not null,
  description text,
  color text, -- Hex color for UI display (e.g., '#FF5733')
  icon text, -- Optional icon name (e.g., 'folder', 'star', 'heart')

  -- Position for custom ordering
  position integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.collections enable row level security;

-- Indices
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collections_position on public.collections(user_id, position);

-- RLS Policies: Collections are PRIVATE to the owner
create policy "Users can view own collections"
  on public.collections for select
  using (user_id = auth.uid());

create policy "Users can insert own collections"
  on public.collections for insert
  with check (user_id = auth.uid());

create policy "Users can update own collections"
  on public.collections for update
  using (user_id = auth.uid());

create policy "Users can delete own collections"
  on public.collections for delete
  using (user_id = auth.uid());

-- ============================================
-- 3. Create generation_collections junction table
-- ============================================

create table if not exists public.generation_collections (
  id uuid default gen_random_uuid() primary key,
  generation_id uuid references public.generations(id) on delete cascade not null,
  collection_id uuid references public.collections(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure a generation can only be in a collection once
  unique(generation_id, collection_id)
);

-- Enable RLS
alter table public.generation_collections enable row level security;

-- Indices for efficient lookups
create index if not exists idx_generation_collections_generation
  on public.generation_collections(generation_id);
create index if not exists idx_generation_collections_collection
  on public.generation_collections(collection_id);

-- RLS Policies: Access through parent tables (generation owner = collection owner)
create policy "Users can view own generation_collections"
  on public.generation_collections for select
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );

create policy "Users can insert own generation_collections"
  on public.generation_collections for insert
  with check (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
    and exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own generation_collections"
  on public.generation_collections for delete
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Create tags table (user-specific tags)
-- ============================================

create table if not exists public.tags (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the tag
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Tag metadata
  name text not null,
  color text, -- Hex color for UI display

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Unique tag name per user
  unique(user_id, name)
);

-- Enable RLS
alter table public.tags enable row level security;

-- Index
create index if not exists idx_tags_user_id on public.tags(user_id);

-- RLS Policies
create policy "Users can view own tags"
  on public.tags for select
  using (user_id = auth.uid());

create policy "Users can insert own tags"
  on public.tags for insert
  with check (user_id = auth.uid());

create policy "Users can update own tags"
  on public.tags for update
  using (user_id = auth.uid());

create policy "Users can delete own tags"
  on public.tags for delete
  using (user_id = auth.uid());

-- ============================================
-- 5. Create generation_tags junction table
-- ============================================

create table if not exists public.generation_tags (
  id uuid default gen_random_uuid() primary key,
  generation_id uuid references public.generations(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure a tag can only be applied once per generation
  unique(generation_id, tag_id)
);

-- Enable RLS
alter table public.generation_tags enable row level security;

-- Indices
create index if not exists idx_generation_tags_generation on public.generation_tags(generation_id);
create index if not exists idx_generation_tags_tag on public.generation_tags(tag_id);

-- RLS Policies
create policy "Users can view own generation_tags"
  on public.generation_tags for select
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );

create policy "Users can insert own generation_tags"
  on public.generation_tags for insert
  with check (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own generation_tags"
  on public.generation_tags for delete
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );
