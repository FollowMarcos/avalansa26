-- Create character vault feature for managing reusable characters
-- Migration: 20260206000000_create_character_vault.sql
-- Privacy model: Private only (no sharing)

-- ============================================
-- 1. Create characters table (main storage)
-- ============================================

create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the character
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Character content
  name text not null,
  description text,
  prompt_template text not null,
  negative_prompt text,

  -- Generation settings as JSON (aspectRatio, imageSize, model, etc.)
  settings jsonb default '{}'::jsonb not null,

  -- Organization
  is_favorite boolean default false not null,
  use_count integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.characters enable row level security;

-- Indexes
create index if not exists idx_characters_user_id on public.characters(user_id);
create index if not exists idx_characters_user_favorite on public.characters(user_id, is_favorite) where is_favorite = true;
create index if not exists idx_characters_use_count on public.characters(user_id, use_count desc);

-- RLS Policies for characters (PRIVATE ONLY)
create policy "Users can view own characters"
  on public.characters for select
  using (user_id = auth.uid());

create policy "Users can insert own characters"
  on public.characters for insert
  with check (user_id = auth.uid());

create policy "Users can update own characters"
  on public.characters for update
  using (user_id = auth.uid());

create policy "Users can delete own characters"
  on public.characters for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create or replace function public.handle_character_updated_at()
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

create trigger on_character_update
  before update on public.characters
  for each row
  execute function public.handle_character_updated_at();

-- ============================================
-- 2. Create character_images table (UNLIMITED per character)
-- ============================================

create table if not exists public.character_images (
  id uuid default gen_random_uuid() primary key,

  -- Link to character
  character_id uuid references public.characters(id) on delete cascade not null,

  -- Image data
  url text not null,
  storage_path text not null,

  -- Position for ordering
  position integer default 0 not null,

  -- Mark one as the primary/avatar image
  is_primary boolean default false not null,

  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.character_images enable row level security;

-- Indexes
create index if not exists idx_character_images_character_id on public.character_images(character_id);
create index if not exists idx_character_images_position on public.character_images(character_id, position);
create index if not exists idx_character_images_primary on public.character_images(character_id, is_primary) where is_primary = true;

-- RLS Policies
create policy "Users can view images for own characters"
  on public.character_images for select
  using (
    exists (
      select 1 from public.characters
      where characters.id = character_images.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "Users can insert images for own characters"
  on public.character_images for insert
  with check (
    exists (
      select 1 from public.characters
      where characters.id = character_images.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "Users can update images for own characters"
  on public.character_images for update
  using (
    exists (
      select 1 from public.characters
      where characters.id = character_images.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "Users can delete images for own characters"
  on public.character_images for delete
  using (
    exists (
      select 1 from public.characters
      where characters.id = character_images.character_id
      and characters.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Create character_folders table
-- ============================================

create table if not exists public.character_folders (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Folder metadata
  name text not null,
  description text,
  color text,
  icon text,

  -- Position for custom ordering
  position integer default 0 not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.character_folders enable row level security;

-- Indexes
create index if not exists idx_character_folders_user_id on public.character_folders(user_id);
create index if not exists idx_character_folders_position on public.character_folders(user_id, position);

-- RLS Policies
create policy "Users can view own character_folders"
  on public.character_folders for select
  using (user_id = auth.uid());

create policy "Users can insert own character_folders"
  on public.character_folders for insert
  with check (user_id = auth.uid());

create policy "Users can update own character_folders"
  on public.character_folders for update
  using (user_id = auth.uid());

create policy "Users can delete own character_folders"
  on public.character_folders for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create trigger on_character_folder_update
  before update on public.character_folders
  for each row
  execute function public.handle_character_updated_at();

-- ============================================
-- 4. Create character_folder_items junction table
-- ============================================

create table if not exists public.character_folder_items (
  character_id uuid references public.characters(id) on delete cascade not null,
  folder_id uuid references public.character_folders(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (character_id, folder_id)
);

-- Enable RLS
alter table public.character_folder_items enable row level security;

-- Indexes
create index if not exists idx_character_folder_items_folder on public.character_folder_items(folder_id);
create index if not exists idx_character_folder_items_character on public.character_folder_items(character_id);

-- RLS Policies
create policy "Users can view own character_folder_items"
  on public.character_folder_items for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own character_folder_items"
  on public.character_folder_items for insert
  with check (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.character_folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );

create policy "Users can update own character_folder_items"
  on public.character_folder_items for update
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own character_folder_items"
  on public.character_folder_items for delete
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Create character_tags table
-- ============================================

create table if not exists public.character_tags (
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
alter table public.character_tags enable row level security;

-- Index
create index if not exists idx_character_tags_user_id on public.character_tags(user_id);

-- RLS Policies
create policy "Users can view own character_tags"
  on public.character_tags for select
  using (user_id = auth.uid());

create policy "Users can insert own character_tags"
  on public.character_tags for insert
  with check (user_id = auth.uid());

create policy "Users can update own character_tags"
  on public.character_tags for update
  using (user_id = auth.uid());

create policy "Users can delete own character_tags"
  on public.character_tags for delete
  using (user_id = auth.uid());

-- ============================================
-- 6. Create character_tag_items junction table
-- ============================================

create table if not exists public.character_tag_items (
  character_id uuid references public.characters(id) on delete cascade not null,
  tag_id uuid references public.character_tags(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (character_id, tag_id)
);

-- Enable RLS
alter table public.character_tag_items enable row level security;

-- Indexes
create index if not exists idx_character_tag_items_character on public.character_tag_items(character_id);
create index if not exists idx_character_tag_items_tag on public.character_tag_items(tag_id);

-- RLS Policies
create policy "Users can view own character_tag_items"
  on public.character_tag_items for select
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own character_tag_items"
  on public.character_tag_items for insert
  with check (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.character_tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own character_tag_items"
  on public.character_tag_items for delete
  using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. Create generation_characters junction table
-- (Manual linking of generations to characters)
-- ============================================

create table if not exists public.generation_characters (
  generation_id uuid references public.generations(id) on delete cascade not null,
  character_id uuid references public.characters(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (generation_id, character_id)
);

-- Enable RLS
alter table public.generation_characters enable row level security;

-- Indexes
create index if not exists idx_generation_characters_generation on public.generation_characters(generation_id);
create index if not exists idx_generation_characters_character on public.generation_characters(character_id);

-- RLS Policies
create policy "Users can view own generation_characters"
  on public.generation_characters for select
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );

create policy "Users can insert own generation_characters"
  on public.generation_characters for insert
  with check (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
    and exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own generation_characters"
  on public.generation_characters for delete
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_id and g.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. Create storage bucket for character images
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'character-images',
  'character-images',
  true,
  10485760,  -- 10MB limit per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies
create policy "Public read access for character images"
  on storage.objects for select
  using (bucket_id = 'character-images');

create policy "Users can upload character images"
  on storage.objects for insert
  with check (
    bucket_id = 'character-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own character images"
  on storage.objects for delete
  using (
    bucket_id = 'character-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 9. Helper functions
-- ============================================

-- Function to increment use_count when generating with a character
create or replace function public.increment_character_use_count(p_character_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update characters
  set use_count = use_count + 1
  where id = p_character_id and user_id = auth.uid();
end;
$$;

-- Function to get characters with preview images (for efficient list loading)
create or replace function public.get_characters_with_preview(
  p_limit integer default 50,
  p_offset integer default 0,
  p_images_per_character integer default 3
)
returns table (
  character_data jsonb,
  preview_images jsonb,
  primary_image jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    to_jsonb(c.*) as character_data,
    coalesce(
      (
        select jsonb_agg(img_row order by img_row.position)
        from (
          select ci.*
          from character_images ci
          where ci.character_id = c.id
          order by ci.position
          limit p_images_per_character
        ) img_row
      ),
      '[]'::jsonb
    ) as preview_images,
    (
      select to_jsonb(pi.*)
      from character_images pi
      where pi.character_id = c.id and pi.is_primary = true
      limit 1
    ) as primary_image
  from characters c
  where c.user_id = auth.uid()
  order by c.updated_at desc
  limit p_limit
  offset p_offset;
end;
$$;
