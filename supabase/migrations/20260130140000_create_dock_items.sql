-- Enable moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create dock_items table
create table if not exists public.dock_items (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  icon text not null,
  href text,
  dropdown_items jsonb, -- Array of { label, href, icon }
  "order" integer not null default 0,
  is_visible boolean default true,
  required_role public.user_role, -- 'admin' or null
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.dock_items enable row level security;

-- Policies for dock_items
-- Everyone can read visible items
create policy "Visible dock items are viewable by everyone"
  on public.dock_items for select
  using ( is_visible = true );

-- Admins can do everything
create policy "Admins can manage all dock items"
  on public.dock_items for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at
create trigger handle_updated_at before update on public.dock_items
  for each row execute procedure moddatetime (updated_at);
