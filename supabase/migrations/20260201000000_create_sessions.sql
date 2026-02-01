-- Create sessions table for grouping generations into work sessions
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,

  -- Owner of the session
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Optional canvas association
  canvas_id uuid references public.canvases(id) on delete set null,

  -- User-defined name (auto-generated if null: "Session 1", "Session 2", etc.)
  name text,

  -- Session time boundaries
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone, -- NULL means session is still active

  -- Row metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Indices for efficient queries
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_started_at on public.sessions(started_at desc);
create index if not exists idx_sessions_canvas_id on public.sessions(canvas_id);

-- RLS Policies: Sessions are PRIVATE to the owner

-- Users can only view their own sessions
create policy "Users can view own sessions"
  on public.sessions for select
  using (user_id = auth.uid());

-- Users can only insert their own sessions
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (user_id = auth.uid());

-- Users can update their own sessions (for renaming, ending)
create policy "Users can update own sessions"
  on public.sessions for update
  using (user_id = auth.uid());

-- Users can delete their own sessions
create policy "Users can delete own sessions"
  on public.sessions for delete
  using (user_id = auth.uid());

-- Add session_id column to generations table
alter table public.generations
  add column if not exists session_id uuid references public.sessions(id) on delete set null;

-- Index for efficient session lookups on generations
create index if not exists idx_generations_session_id on public.generations(session_id);
