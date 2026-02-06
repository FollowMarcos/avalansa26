-- Create workflows table for storing node-based workflow definitions
create table if not exists public.workflows (
  id uuid default gen_random_uuid() primary key,

  -- Owner
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Metadata
  name text not null default 'Untitled Workflow',
  description text,
  thumbnail_url text,
  is_favorite boolean default false not null,

  -- Workflow definition (nodes, edges, groups, viewport) as JSON
  definition jsonb not null default '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workflows enable row level security;

-- Indexes
create index if not exists idx_workflows_user_id on public.workflows(user_id);
create index if not exists idx_workflows_updated_at on public.workflows(updated_at desc);
create index if not exists idx_workflows_user_favorite
  on public.workflows(user_id, is_favorite) where is_favorite = true;

-- RLS Policies (private only)
create policy "Users can view own workflows"
  on public.workflows for select
  using (user_id = auth.uid());

create policy "Users can insert own workflows"
  on public.workflows for insert
  with check (user_id = auth.uid());

create policy "Users can update own workflows"
  on public.workflows for update
  using (user_id = auth.uid());

create policy "Users can delete own workflows"
  on public.workflows for delete
  using (user_id = auth.uid());

-- Auto-update updated_at trigger
create or replace function public.handle_workflow_updated_at()
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

create trigger on_workflow_update
  before update on public.workflows
  for each row
  execute function public.handle_workflow_updated_at();
