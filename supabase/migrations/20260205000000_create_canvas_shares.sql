-- Create canvas_shares table for shareable canvas links
create table if not exists public.canvas_shares (
  id uuid default gen_random_uuid() primary key,
  canvas_id uuid references public.canvases(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Cryptographically secure share token (32-char hex string)
  share_token text unique not null default encode(gen_random_bytes(16), 'hex'),

  -- Optional custom metadata for shared view
  title text,
  description text,

  -- Expiration settings (null = never expires)
  expires_at timestamp with time zone,

  -- Analytics
  view_count integer default 0 not null,

  -- Privacy/display settings
  show_prompts boolean default true not null,
  allow_download boolean default false not null,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.canvas_shares enable row level security;

-- Indexes for performance
create unique index if not exists idx_canvas_shares_token on public.canvas_shares(share_token);
create index if not exists idx_canvas_shares_user_id on public.canvas_shares(user_id);
create index if not exists idx_canvas_shares_canvas_id on public.canvas_shares(canvas_id);

-- RLS Policies

-- Users can view their own shares
create policy "Users can view own shares"
  on public.canvas_shares for select
  using (user_id = auth.uid());

-- Users can create shares for their own canvases
create policy "Users can create shares for own canvases"
  on public.canvas_shares for insert
  with check (
    user_id = auth.uid() and
    exists (select 1 from public.canvases where id = canvas_id and user_id = auth.uid())
  );

-- Users can update their own shares
create policy "Users can update own shares"
  on public.canvas_shares for update
  using (user_id = auth.uid());

-- Users can delete their own shares
create policy "Users can delete own shares"
  on public.canvas_shares for delete
  using (user_id = auth.uid());

-- Auto-update timestamp trigger
create or replace trigger on_canvas_share_update
  before update on public.canvas_shares
  for each row
  execute function public.handle_canvas_updated_at();

-- Function for public access to shared canvases (bypasses RLS via security definer)
-- This is the only way to access a canvas publicly - by providing a valid share token
create or replace function public.get_shared_canvas(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_canvas record;
  v_owner record;
begin
  -- Get the share record (check expiration)
  select * into v_share from canvas_shares
  where share_token = p_token
  and (expires_at is null or expires_at > now());

  if v_share is null then
    return null;
  end if;

  -- Increment view count
  update canvas_shares set view_count = view_count + 1 where id = v_share.id;

  -- Get the canvas
  select * into v_canvas from canvases where id = v_share.canvas_id;

  if v_canvas is null then
    return null;
  end if;

  -- Get owner info (minimal public info only)
  select username, avatar_url into v_owner from profiles where id = v_share.user_id;

  -- Return structured JSON response
  return jsonb_build_object(
    'share', jsonb_build_object(
      'id', v_share.id,
      'title', coalesce(v_share.title, v_canvas.name),
      'description', v_share.description,
      'show_prompts', v_share.show_prompts,
      'allow_download', v_share.allow_download,
      'created_at', v_share.created_at,
      'view_count', v_share.view_count + 1
    ),
    'canvas', jsonb_build_object(
      'name', v_canvas.name,
      'nodes', v_canvas.nodes,
      'edges', v_canvas.edges,
      'viewport', v_canvas.viewport
    ),
    'owner', jsonb_build_object(
      'username', v_owner.username,
      'avatar_url', v_owner.avatar_url
    )
  );
end;
$$;
