-- Allow users to keep their wallpapers page public independently of profile visibility
alter table public.profiles
  add column if not exists wallpapers_public boolean default true not null;
