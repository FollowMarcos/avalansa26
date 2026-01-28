-- Migration: Add INSERT policy for profiles
-- Description: Allow users to insert their own profile (for upsert operations)
-- Date: 2026-01-28

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Grant INSERT permission to authenticated users
GRANT INSERT ON public.profiles TO authenticated;
