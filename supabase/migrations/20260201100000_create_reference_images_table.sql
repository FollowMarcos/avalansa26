-- Create reference_images table to track user's uploaded reference images
-- This replaces the localStorage-based saved references
create table if not exists public.reference_images (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the reference image
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Storage path in reference-images bucket (e.g., "user-id/filename.jpg")
  storage_path text not null,

  -- Optional user-defined name
  name text,

  -- Row metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reference_images enable row level security;

-- Index for user lookup (most common query)
create index if not exists idx_reference_images_user_id on public.reference_images(user_id);

-- Index for sorting by creation date
create index if not exists idx_reference_images_created_at on public.reference_images(created_at desc);

-- RLS Policies: Reference images are PRIVATE to the owner

-- Users can view their own reference images
create policy "Users can view own reference images"
  on public.reference_images for select
  using (user_id = auth.uid());

-- Users can insert their own reference images
create policy "Users can insert own reference images"
  on public.reference_images for insert
  with check (user_id = auth.uid());

-- Users can update their own reference images (for renaming)
create policy "Users can update own reference images"
  on public.reference_images for update
  using (user_id = auth.uid());

-- Users can delete their own reference images
create policy "Users can delete own reference images"
  on public.reference_images for delete
  using (user_id = auth.uid());
