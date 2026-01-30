-- Add website column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS website text;

-- Add a constraint to ensure the website is a valid-ish URL (optional, but good for basic safety)
-- We'll handle stricter validation in the application logic
ALTER TABLE public.profiles
ADD CONSTRAINT website_length_check CHECK (char_length(website) <= 255);
