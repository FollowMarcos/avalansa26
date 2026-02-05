-- Add prompt images feature for storing up to 3 images per prompt
-- Migration: 20260205210000_add_prompt_images.sql

-- ============================================
-- 1. Create prompt_images table
-- ============================================

create table if not exists public.prompt_images (
  id uuid default gen_random_uuid() primary key,

  -- Link to prompt
  prompt_id uuid references public.prompts(id) on delete cascade not null,

  -- Image URL (from Supabase storage)
  url text not null,

  -- Storage path for deletion
  storage_path text not null,

  -- Position (0, 1, 2 for up to 3 images)
  position smallint default 0 not null,

  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraint: max 3 images per prompt
  constraint prompt_images_position_check check (position >= 0 and position <= 2)
);

-- Enable RLS
alter table public.prompt_images enable row level security;

-- Indexes
create index if not exists idx_prompt_images_prompt_id on public.prompt_images(prompt_id);
create index if not exists idx_prompt_images_prompt_position on public.prompt_images(prompt_id, position);

-- Unique constraint: one image per position per prompt
create unique index if not exists idx_prompt_images_unique_position
  on public.prompt_images(prompt_id, position);

-- ============================================
-- 2. RLS Policies for prompt_images
-- ============================================

-- Users can view images for prompts they own
create policy "Users can view images for own prompts"
  on public.prompt_images for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_images.prompt_id
      and prompts.user_id = auth.uid()
    )
  );

-- Users can view images for prompts shared with them
create policy "Users can view images for shared prompts"
  on public.prompt_images for select
  using (
    exists (
      select 1 from public.prompt_shares
      where prompt_shares.prompt_id = prompt_images.prompt_id
      and prompt_shares.shared_with = auth.uid()
    )
  );

-- Users can insert images for prompts they own
create policy "Users can insert images for own prompts"
  on public.prompt_images for insert
  with check (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_images.prompt_id
      and prompts.user_id = auth.uid()
    )
  );

-- Users can delete images for prompts they own
create policy "Users can delete images for own prompts"
  on public.prompt_images for delete
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_images.prompt_id
      and prompts.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Create storage bucket for prompt images
-- ============================================

-- Insert bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-images',
  'prompt-images',
  true, -- Public bucket so images can be displayed
  524288, -- 512KB limit (500KB target after client resize)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================
-- 4. Storage Policies for prompt-images bucket
-- ============================================

-- Anyone can view prompt images (public bucket)
create policy "Public read access for prompt images"
  on storage.objects for select
  using (bucket_id = 'prompt-images');

-- Authenticated users can upload to their own folder
create policy "Users can upload prompt images"
  on storage.objects for insert
  with check (
    bucket_id = 'prompt-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
create policy "Users can delete own prompt images"
  on storage.objects for delete
  using (
    bucket_id = 'prompt-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 5. Function to enforce max 3 images per prompt
-- ============================================

create or replace function public.check_prompt_image_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  image_count integer;
begin
  select count(*) into image_count
  from public.prompt_images
  where prompt_id = new.prompt_id;

  if image_count >= 3 then
    raise exception 'Maximum of 3 images per prompt allowed';
  end if;

  return new;
end;
$$;

create trigger enforce_prompt_image_limit
  before insert on public.prompt_images
  for each row
  execute function public.check_prompt_image_limit();
