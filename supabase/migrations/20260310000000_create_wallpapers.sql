-- ============================================================================
-- Wallpaper Upload & Gallery Feature
-- ============================================================================

-- 1. Wallpapers table
create table if not exists public.wallpapers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Core metadata
  title text not null,
  description text,
  slug text not null,

  -- Image storage
  image_url text not null,
  image_path text not null,
  thumbnail_url text,
  thumbnail_path text,

  -- Technical metadata
  width integer not null,
  height integer not null,
  file_size bigint not null,
  mime_type text not null,
  aspect_ratio text,

  -- Engagement counters (denormalized)
  download_count integer default 0 not null,
  view_count integer default 0 not null,
  like_count integer default 0 not null,

  -- Visibility
  is_public boolean default true not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id, slug)
);

alter table public.wallpapers enable row level security;

create index idx_wallpapers_user_id on public.wallpapers(user_id);
create index idx_wallpapers_created_at on public.wallpapers(created_at desc);
create index idx_wallpapers_public_browse on public.wallpapers(is_public, created_at desc) where is_public = true;
create index idx_wallpapers_user_public on public.wallpapers(user_id, is_public, created_at desc);
create index idx_wallpapers_slug on public.wallpapers(user_id, slug);

create policy "Anyone can view public wallpapers"
  on public.wallpapers for select
  using (is_public = true);

create policy "Owners can view own wallpapers"
  on public.wallpapers for select
  using (user_id = auth.uid());

create policy "Users can insert own wallpapers"
  on public.wallpapers for insert
  with check (user_id = auth.uid());

create policy "Users can update own wallpapers"
  on public.wallpapers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own wallpapers"
  on public.wallpapers for delete
  using (user_id = auth.uid());

-- 2. Global wallpaper tags
create table if not exists public.wallpaper_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  usage_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallpaper_tags enable row level security;

create index idx_wallpaper_tags_name on public.wallpaper_tags(name);
create index idx_wallpaper_tags_slug on public.wallpaper_tags(slug);
create index idx_wallpaper_tags_usage on public.wallpaper_tags(usage_count desc);

create policy "Anyone can view wallpaper tags"
  on public.wallpaper_tags for select
  using (true);

create policy "Authenticated users can insert tags"
  on public.wallpaper_tags for insert
  with check (auth.uid() is not null);

-- 3. Wallpaper-tag junction
create table if not exists public.wallpaper_tag_assignments (
  id uuid default gen_random_uuid() primary key,
  wallpaper_id uuid references public.wallpapers(id) on delete cascade not null,
  tag_id uuid references public.wallpaper_tags(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wallpaper_id, tag_id)
);

alter table public.wallpaper_tag_assignments enable row level security;

create index idx_wta_wallpaper on public.wallpaper_tag_assignments(wallpaper_id);
create index idx_wta_tag on public.wallpaper_tag_assignments(tag_id);

create policy "Anyone can view tag assignments"
  on public.wallpaper_tag_assignments for select
  using (
    exists (
      select 1 from public.wallpapers w
      where w.id = wallpaper_id and (w.is_public = true or w.user_id = auth.uid())
    )
  );

create policy "Owners can insert tag assignments"
  on public.wallpaper_tag_assignments for insert
  with check (
    exists (
      select 1 from public.wallpapers w
      where w.id = wallpaper_id and w.user_id = auth.uid()
    )
  );

create policy "Owners can delete tag assignments"
  on public.wallpaper_tag_assignments for delete
  using (
    exists (
      select 1 from public.wallpapers w
      where w.id = wallpaper_id and w.user_id = auth.uid()
    )
  );

-- 4. Wallpaper collections
create table if not exists public.wallpaper_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  slug text not null,
  cover_wallpaper_id uuid references public.wallpapers(id) on delete set null,
  is_public boolean default true not null,
  position integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, slug)
);

alter table public.wallpaper_collections enable row level security;

create index idx_wc_user on public.wallpaper_collections(user_id);
create index idx_wc_slug on public.wallpaper_collections(user_id, slug);

create policy "Anyone can view public collections"
  on public.wallpaper_collections for select
  using (is_public = true or user_id = auth.uid());

create policy "Owners can insert collections"
  on public.wallpaper_collections for insert
  with check (user_id = auth.uid());

create policy "Owners can update collections"
  on public.wallpaper_collections for update
  using (user_id = auth.uid());

create policy "Owners can delete collections"
  on public.wallpaper_collections for delete
  using (user_id = auth.uid());

-- 5. Wallpaper-collection junction
create table if not exists public.wallpaper_collection_items (
  id uuid default gen_random_uuid() primary key,
  wallpaper_id uuid references public.wallpapers(id) on delete cascade not null,
  collection_id uuid references public.wallpaper_collections(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wallpaper_id, collection_id)
);

alter table public.wallpaper_collection_items enable row level security;

create index idx_wci_wallpaper on public.wallpaper_collection_items(wallpaper_id);
create index idx_wci_collection on public.wallpaper_collection_items(collection_id);

create policy "Anyone can view collection items for accessible collections"
  on public.wallpaper_collection_items for select
  using (
    exists (
      select 1 from public.wallpaper_collections c
      where c.id = collection_id and (c.is_public = true or c.user_id = auth.uid())
    )
  );

create policy "Owners can insert collection items"
  on public.wallpaper_collection_items for insert
  with check (
    exists (
      select 1 from public.wallpaper_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Owners can delete collection items"
  on public.wallpaper_collection_items for delete
  using (
    exists (
      select 1 from public.wallpaper_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- 6. Wallpaper likes
create table if not exists public.wallpaper_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  wallpaper_id uuid references public.wallpapers(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, wallpaper_id)
);

alter table public.wallpaper_likes enable row level security;

create index idx_wl_user on public.wallpaper_likes(user_id);
create index idx_wl_wallpaper on public.wallpaper_likes(wallpaper_id);

create policy "Users can view own likes"
  on public.wallpaper_likes for select
  using (user_id = auth.uid());

create policy "Users can insert own likes"
  on public.wallpaper_likes for insert
  with check (user_id = auth.uid());

create policy "Users can delete own likes"
  on public.wallpaper_likes for delete
  using (user_id = auth.uid());

-- 7. Helper functions

create or replace function public.increment_wallpaper_download(wallpaper_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wallpapers
  set download_count = download_count + 1
  where id = wallpaper_uuid and is_public = true;
end;
$$;

create or replace function public.increment_wallpaper_view(wallpaper_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wallpapers
  set view_count = view_count + 1
  where id = wallpaper_uuid and is_public = true;
end;
$$;

create or replace function public.toggle_wallpaper_like(p_wallpaper_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.wallpaper_likes
    where user_id = v_user_id and wallpaper_id = p_wallpaper_id
  ) into v_exists;

  if v_exists then
    delete from public.wallpaper_likes
    where user_id = v_user_id and wallpaper_id = p_wallpaper_id;

    update public.wallpapers
    set like_count = greatest(like_count - 1, 0)
    where id = p_wallpaper_id;

    return false;
  else
    insert into public.wallpaper_likes (user_id, wallpaper_id)
    values (v_user_id, p_wallpaper_id);

    update public.wallpapers
    set like_count = like_count + 1
    where id = p_wallpaper_id;

    return true;
  end if;
end;
$$;
