-- Saved Poses: user-created stick-figure poses for the workflow Pose Creator
-- Poses are uploaded to Cloudflare R2 and referenced by path

create table if not exists public.saved_poses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Pose',
  joints jsonb not null,
  image_path text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

-- Index for fast per-user lookups
create index if not exists idx_saved_poses_user_id on public.saved_poses(user_id);

-- RLS
alter table public.saved_poses enable row level security;

create policy "Users can read own poses"
  on public.saved_poses for select
  using (auth.uid() = user_id);

create policy "Users can insert own poses"
  on public.saved_poses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own poses"
  on public.saved_poses for delete
  using (auth.uid() = user_id);
