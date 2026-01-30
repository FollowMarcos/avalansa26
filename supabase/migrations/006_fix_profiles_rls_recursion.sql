-- Migration: Fix profiles RLS infinite recursion
-- Description: Fixes admin policies that cause infinite recursion by using a SECURITY DEFINER function
-- Date: 2026-01-30

-- ============================================
-- 1. DROP PROBLEMATIC POLICIES
-- ============================================

-- Drop the policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- ============================================
-- 2. CREATE SECURITY DEFINER FUNCTION
-- ============================================

-- This function checks if the current user is an admin
-- SECURITY DEFINER allows it to bypass RLS when checking the profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Get the role directly, bypassing RLS
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- 3. RECREATE ADMIN POLICIES
-- ============================================

-- Policy: Admins can view all profiles
-- Uses the security definer function to avoid recursion
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy: Admins can update all profiles
-- Uses the security definer function to avoid recursion
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
