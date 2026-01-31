-- Create canvases table for storing user's React Flow canvas state
create table if not exists public.canvases (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the canvas (strictly private)
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Canvas metadata
  name text not null default 'Untitled',
  thumbnail_url text,

  -- React Flow state
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  viewport jsonb not null default '{"x": 0, "y": 0, "zoom": 1}',

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.canvases enable row level security;

-- Index for user lookup (most common query)
create index if not exists idx_canvases_user_id on public.canvases(user_id);

-- Index for sorting by update date
create index if not exists idx_canvases_updated_at on public.canvases(updated_at desc);

-- RLS Policies: Canvases are STRICTLY PRIVATE to the owner

-- Users can only view their own canvases
create policy "Users can view own canvases"
  on public.canvases for select
  using (user_id = auth.uid());

-- Users can only insert their own canvases
create policy "Users can insert own canvases"
  on public.canvases for insert
  with check (user_id = auth.uid());

-- Users can only update their own canvases
create policy "Users can update own canvases"
  on public.canvases for update
  using (user_id = auth.uid());

-- Users can only delete their own canvases
create policy "Users can delete own canvases"
  on public.canvases for delete
  using (user_id = auth.uid());

-- Function to auto-update updated_at timestamp
create or replace function public.handle_canvas_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on canvas changes
drop trigger if exists on_canvas_update on public.canvases;
create trigger on_canvas_update
  before update on public.canvases
  for each row
  execute function public.handle_canvas_updated_at();
