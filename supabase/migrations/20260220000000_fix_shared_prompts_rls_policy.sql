-- Fix: "Recipients can view shared prompts" RLS policy has a scoping bug.
-- The unqualified `id` in `ps.prompt_id = id` resolved to `ps.id` (inner scope)
-- instead of `prompts.id` (outer policy row), so the policy never matches.
-- Migration: 20260220000000_fix_shared_prompts_rls_policy.sql

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
