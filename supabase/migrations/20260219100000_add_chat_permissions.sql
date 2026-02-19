-- ============================================================================
-- Chat Permissions Migration
-- Allows admins to delegate channel management to non-admin users.
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS TABLE
-- ============================================================================

create table if not exists public.chat_permissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  permission text not null,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Each user can only have one entry per permission type
  unique(user_id, permission),

  -- Only known permission types allowed
  constraint valid_chat_permission check (permission in ('manage_channels'))
);

-- Index for fast lookups
create index if not exists idx_chat_permissions_user on public.chat_permissions(user_id);
create index if not exists idx_chat_permissions_permission on public.chat_permissions(permission);

-- ============================================================================
-- 2. SECURITY DEFINER FUNCTION
-- ============================================================================

-- Check if a user has a specific chat permission (admins always pass)
create or replace function public.has_chat_permission(p_user_id uuid, p_permission text)
returns boolean as $$
begin
  -- Admins implicitly have all chat permissions
  if exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  ) then
    return true;
  end if;

  -- Check explicit permission grant
  return exists (
    select 1 from public.chat_permissions
    where user_id = p_user_id and permission = p_permission
  );
end;
$$ language plpgsql security definer stable;

grant execute on function public.has_chat_permission(uuid, text) to authenticated;

-- ============================================================================
-- 3. RLS ON CHAT_PERMISSIONS
-- ============================================================================

alter table public.chat_permissions enable row level security;

-- Admins can manage all permissions
create policy "Admins can manage chat permissions"
  on public.chat_permissions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Users can read their own permissions
create policy "Users can read own chat permissions"
  on public.chat_permissions for select
  using (auth.uid() = user_id);

-- ============================================================================
-- 4. UPDATE CHAT_CHANNELS RLS
-- Replace admin-only policy with admin OR manage_channels permission
-- ============================================================================

drop policy if exists "Admins can manage all channels" on public.chat_channels;

create policy "Channel managers can manage all channels"
  on public.chat_channels for all
  using (public.has_chat_permission(auth.uid(), 'manage_channels'))
  with check (public.has_chat_permission(auth.uid(), 'manage_channels'));
