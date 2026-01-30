-- Migration: Add avatar_history to profiles
-- Description: Adds a column to store recently used avatar URLs

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_history text[] DEFAULT '{}';

-- Optional: Update existing records to include their current avatar in history if it exists
UPDATE public.profiles 
SET avatar_history = ARRAY[avatar_url] 
WHERE avatar_url IS NOT NULL AND (avatar_history IS NULL OR CARDINALITY(avatar_history) = 0);
