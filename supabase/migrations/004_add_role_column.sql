-- Migration: Add role column to profiles table
-- Description: Adds a role field for admin access control

-- Create enum type for user roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
END$$;

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';

-- Create index for role lookups (useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add RLS policy for admins to view all profiles with full details
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Add RLS policy for admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

COMMENT ON COLUMN public.profiles.role IS 'User role for access control (user or admin)';
