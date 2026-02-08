-- Fix: Allow recipients to read prompts that have been shared with them
-- Without this policy, the Supabase join in getReceivedPromptShares returns null
-- for the prompt data because RLS blocks cross-user reads on the prompts table.
-- Migration: 20260208000000_fix_shared_prompts_rls.sql

create policy "Recipients can view shared prompts"
  on public.prompts for select
  using (
    exists (
      select 1 from public.prompt_shares ps
      where ps.prompt_id = id
        and ps.shared_with = auth.uid()
    )
  );
