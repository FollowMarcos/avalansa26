-- Create generations table for storing user's generated images
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the generation (strictly private)
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Which API config was used (nullable, in case API is deleted)
  api_config_id uuid references public.api_configs(id) on delete set null,

  -- Generation details
  prompt text not null,
  negative_prompt text,
  image_url text not null,
  image_path text, -- Storage path if saved to bucket

  -- Generation settings (aspectRatio, imageSize, etc.)
  settings jsonb not null default '{}',

  -- Timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.generations enable row level security;

-- Index for user lookup (most common query)
create index if not exists idx_generations_user_id on public.generations(user_id);

-- Index for sorting by creation date
create index if not exists idx_generations_created_at on public.generations(created_at desc);

-- RLS Policies: Generations are STRICTLY PRIVATE to the owner

-- Users can only view their own generations
create policy "Users can view own generations"
  on public.generations for select
  using (user_id = auth.uid());

-- Users can only insert their own generations
create policy "Users can insert own generations"
  on public.generations for insert
  with check (user_id = auth.uid());

-- Users can only delete their own generations
create policy "Users can delete own generations"
  on public.generations for delete
  using (user_id = auth.uid());

-- No update policy - generations are immutable once created
-- No admin access - generations are strictly private
