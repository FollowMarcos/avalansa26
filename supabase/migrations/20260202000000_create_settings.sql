-- Create create_settings table for admin-managed creation settings
-- This is a singleton table (single row for global settings)

create table if not exists public.create_settings (
  id uuid default gen_random_uuid() primary key,

  -- Quality restrictions
  allowed_image_sizes text[] default array['1K', '2K', '4K']::text[] not null,

  -- Output count limits
  max_output_count integer default 4 not null,

  -- Aspect ratio restrictions
  allowed_aspect_ratios text[] default array[
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
  ]::text[] not null,

  -- Maintenance mode
  maintenance_mode boolean default false not null,
  maintenance_message text,

  -- Generation speed restrictions
  allow_fast_mode boolean default true not null,
  allow_relaxed_mode boolean default true not null,

  -- Metadata
  updated_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  constraint valid_max_output_count check (max_output_count >= 1 and max_output_count <= 4),
  constraint valid_image_sizes check (array_length(allowed_image_sizes, 1) >= 1),
  constraint valid_aspect_ratios check (array_length(allowed_aspect_ratios, 1) >= 1),
  constraint at_least_one_speed_mode check (allow_fast_mode = true or allow_relaxed_mode = true)
);

-- Enable RLS
alter table public.create_settings enable row level security;

-- Create trigger to update updated_at
create trigger handle_create_settings_updated_at before update on public.create_settings
  for each row execute procedure moddatetime (updated_at);

-- RLS Policies

-- Policy 1: Admins can manage settings
create policy "Admins can manage create settings"
  on public.create_settings for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy 2: All authenticated users can read settings
create policy "Authenticated users can read create settings"
  on public.create_settings for select
  using (auth.uid() is not null);

-- Insert default settings (singleton row with fixed UUID)
insert into public.create_settings (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
