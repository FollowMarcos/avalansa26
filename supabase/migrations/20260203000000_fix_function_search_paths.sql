-- Migration: Fix Function Search Path Security Issues
-- Fixes Supabase security warning: "Function Search Path Mutable"
-- Setting search_path prevents SQL injection via search path manipulation

-- ============================================================================
-- 1. Fix encrypt_api_key
-- ============================================================================
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(
    extensions.pgp_sym_encrypt(plain_key, encryption_key),
    'base64'
  );
END;
$$;

-- ============================================================================
-- 2. Fix decrypt_api_key
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    encryption_key
  );
END;
$$;

-- ============================================================================
-- 3. Fix update_mockup_votes_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_mockup_votes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Fix handle_canvas_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_canvas_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. Fix is_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    user_role user_role;
BEGIN
    -- Get the role directly, bypassing RLS
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN user_role = 'admin';
END;
$$;

-- ============================================================================
-- 6. Fix handle_updated_at (generic trigger function)
-- Note: Some tables use moddatetime extension, but if a custom function exists:
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 7. Fix handle_new_user (auth trigger)
-- This function handles new user registration
-- NOTE: This function may have been created via Supabase dashboard.
--       Verify the INSERT columns match your profiles table structure.
--       Run this SQL in Supabase SQL Editor to see current definition:
--       SELECT pg_get_functiondef('public.handle_new_user'::regproc);
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
