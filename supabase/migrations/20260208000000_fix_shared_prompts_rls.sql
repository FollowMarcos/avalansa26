-- Fix prompt sharing: two issues
-- 1. Recipients can't read shared prompts due to RLS (prompts table only allows user_id = auth.uid())
-- 2. process_prompt_share() checks shared_with = auth.uid() but is called by the sharer
-- Migration: 20260208000000_fix_shared_prompts_rls.sql

-- ============================================
-- 1. Allow recipients to read prompts shared with them
-- ============================================

-- Drop if exists so migration is idempotent
drop policy if exists "Recipients can view shared prompts" on public.prompts;

create policy "Recipients can view shared prompts"
  on public.prompts for select
  using (
    exists (
      select 1 from public.prompt_shares ps
      where ps.prompt_id = prompts.id
        and ps.shared_with = auth.uid()
    )
  );

-- ============================================
-- 2. Fix process_prompt_share to work when called by the sharer
--    Instead of relying on auth.uid() for the recipient, use
--    the shared_with field from the share record itself.
-- ============================================

create or replace function public.process_prompt_share(p_share_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share prompt_shares%rowtype;
  v_original prompts%rowtype;
  v_new_id uuid;
begin
  -- Get the share (caller must be the sharer or recipient, and not yet processed)
  select * into v_share from prompt_shares
  where id = p_share_id
    and (shared_with = auth.uid() or shared_by = auth.uid())
    and duplicated_prompt_id is null;

  if v_share is null then
    raise exception 'Share not found or already processed';
  end if;

  -- Get the original prompt
  select * into v_original from prompts where id = v_share.prompt_id;

  if v_original is null then
    raise exception 'Original prompt not found';
  end if;

  -- Create the copy for the RECIPIENT (use shared_with, not auth.uid())
  insert into prompts (
    user_id,
    name,
    description,
    prompt_text,
    negative_prompt,
    settings,
    original_prompt_id,
    original_author_id
  ) values (
    v_share.shared_with,
    v_original.name,
    v_original.description,
    v_original.prompt_text,
    v_original.negative_prompt,
    v_original.settings,
    v_original.id,
    v_original.user_id
  )
  returning id into v_new_id;

  -- Update the share record
  update prompt_shares
  set duplicated_prompt_id = v_new_id, is_seen = true
  where id = p_share_id;

  return v_new_id;
end;
$$;
