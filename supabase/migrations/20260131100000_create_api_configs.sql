-- Enable pgcrypto extension for API key encryption
create extension if not exists pgcrypto schema extensions;

-- Create access level enum for API configs
do $$ begin
  create type public.api_access_level as enum ('public', 'authenticated', 'restricted');
exception
  when duplicate_object then null;
end $$;

-- Create api_configs table
create table if not exists public.api_configs (
  id uuid default gen_random_uuid() primary key,

  -- Ownership: null = global/admin API, user_id = personal API
  owner_id uuid references public.profiles(id) on delete cascade,

  -- Basic info
  name text not null,
  provider text not null,
  description text,

  -- API configuration
  endpoint text not null,
  api_key_encrypted text not null,
  model_id text,
  model_info jsonb,

  -- Access control
  access_level public.api_access_level default 'authenticated'::public.api_access_level not null,
  allowed_users uuid[] default '{}',

  -- Status
  is_active boolean default true,

  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  constraint valid_name check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint valid_provider check (char_length(provider) >= 1 and char_length(provider) <= 50)
);

-- Enable RLS
alter table public.api_configs enable row level security;

-- Index for owner lookup (for user personal APIs)
create index if not exists idx_api_configs_owner_id on public.api_configs(owner_id);

-- Index for access queries
create index if not exists idx_api_configs_access_level on public.api_configs(access_level);

-- Create trigger to update updated_at
create trigger handle_api_configs_updated_at before update on public.api_configs
  for each row execute procedure moddatetime (updated_at);

-- RLS Policies

-- Policy 1: Admins can manage all global APIs (owner_id IS NULL)
create policy "Admins can manage global APIs"
  on public.api_configs for all
  using (
    owner_id is null
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy 2: Users can manage their own personal APIs
create policy "Users can manage their own APIs"
  on public.api_configs for all
  using (owner_id = auth.uid());

-- Policy 3: Public APIs are readable by everyone (authenticated)
create policy "Public APIs are viewable by authenticated users"
  on public.api_configs for select
  using (
    is_active = true
    and access_level = 'public'
    and auth.uid() is not null
  );

-- Policy 4: Authenticated APIs are viewable by logged-in users
create policy "Authenticated APIs are viewable by logged-in users"
  on public.api_configs for select
  using (
    is_active = true
    and access_level = 'authenticated'
    and auth.uid() is not null
  );

-- Policy 5: Restricted APIs are viewable by allowed users
create policy "Restricted APIs are viewable by allowed users"
  on public.api_configs for select
  using (
    is_active = true
    and access_level = 'restricted'
    and (
      auth.uid() = owner_id
      or auth.uid() = any(allowed_users)
      or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
      )
    )
  );

-- Function to encrypt API keys (server-side only via service role)
create or replace function public.encrypt_api_key(plain_key text, encryption_key text)
returns text as $$
begin
  return encode(
    extensions.pgp_sym_encrypt(plain_key, encryption_key),
    'base64'
  );
end;
$$ language plpgsql security definer;

-- Function to decrypt API keys (server-side only via service role)
create or replace function public.decrypt_api_key(encrypted_key text, encryption_key text)
returns text as $$
begin
  return extensions.pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    encryption_key
  );
end;
$$ language plpgsql security definer;
