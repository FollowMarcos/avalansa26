-- Migration: Add onboarding fields to profiles
-- Description: Adds bio, interests, and onboarding_completed fields
-- Date: 2026-01-28

-- ============================================
-- 1. ADD NEW COLUMNS
-- ============================================

-- Add bio field for short user description
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add interests as a text array for tags
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Add onboarding completion flag (default false for new users)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- 2. ADD COLUMN CONSTRAINTS
-- ============================================

-- Bio should be limited to 500 characters
ALTER TABLE public.profiles
ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500);

-- ============================================
-- 3. ADD INDEXES
-- ============================================

-- Index on onboarding_completed for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON public.profiles(onboarding_completed)
WHERE onboarding_completed = FALSE;

-- ============================================
-- 4. UPDATE COMMENTS
-- ============================================

COMMENT ON COLUMN public.profiles.bio IS 'Short user biography (~200 chars)';
COMMENT ON COLUMN public.profiles.interests IS 'Array of interest tags';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed onboarding';
