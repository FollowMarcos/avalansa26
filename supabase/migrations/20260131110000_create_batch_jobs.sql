-- Create batch job status enum
do $$ begin
  create type public.batch_job_status as enum (
    'pending',      -- Job created, not yet submitted
    'submitted',    -- Submitted to provider
    'processing',   -- Being processed by provider
    'completed',    -- Successfully completed
    'failed',       -- Job failed
    'cancelled'     -- Cancelled by user
  );
exception
  when duplicate_object then null;
end $$;

-- Create batch_jobs table for tracking async generation jobs
create table if not exists public.batch_jobs (
  id uuid default gen_random_uuid() primary key,

  -- User who created the job
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Which API config was used
  api_config_id uuid references public.api_configs(id) on delete set null,

  -- Provider-specific job ID (e.g., Gemini batch job name)
  provider_job_id text,

  -- Job status
  status public.batch_job_status default 'pending'::public.batch_job_status not null,

  -- Original requests (array of prompts with settings)
  requests jsonb not null default '[]',

  -- Results when completed (array of generated image URLs/data)
  results jsonb,

  -- Error message if failed
  error_message text,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  completed_at timestamp with time zone,

  -- Estimated completion time (set by provider)
  estimated_completion timestamp with time zone
);

-- Enable RLS
alter table public.batch_jobs enable row level security;

-- Index for user lookup
create index if not exists idx_batch_jobs_user_id on public.batch_jobs(user_id);

-- Index for status lookup (for polling pending jobs)
create index if not exists idx_batch_jobs_status on public.batch_jobs(status);

-- Index for provider job lookup
create index if not exists idx_batch_jobs_provider_job_id on public.batch_jobs(provider_job_id);

-- RLS Policies

-- Users can only see their own batch jobs
create policy "Users can view their own batch jobs"
  on public.batch_jobs for select
  using (user_id = auth.uid());

-- Users can create their own batch jobs
create policy "Users can create their own batch jobs"
  on public.batch_jobs for insert
  with check (user_id = auth.uid());

-- Users can update their own batch jobs (for cancellation)
create policy "Users can update their own batch jobs"
  on public.batch_jobs for update
  using (user_id = auth.uid());

-- Admins can manage all batch jobs
create policy "Admins can manage all batch jobs"
  on public.batch_jobs for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
