-- Create dock preferences table for storing user dock customization
-- Migration: 005_create_dock_preferences.sql

-- Create enum for dock types
CREATE TYPE dock_type AS ENUM ('milky_dream_light', 'milky_dream_dark', 'floating_islands_light', 'floating_islands_dark');

-- Create dock_preferences table
CREATE TABLE IF NOT EXISTS dock_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dock_type dock_type NOT NULL DEFAULT 'milky_dream_light',
    icon_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only have one dock preference
    CONSTRAINT unique_user_dock UNIQUE (user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_dock_preferences_user_id ON dock_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE dock_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own dock preferences
CREATE POLICY "Users can view own dock preferences"
    ON dock_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own dock preferences
CREATE POLICY "Users can insert own dock preferences"
    ON dock_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own dock preferences
CREATE POLICY "Users can update own dock preferences"
    ON dock_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own dock preferences
CREATE POLICY "Users can delete own dock preferences"
    ON dock_preferences
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER handle_dock_preferences_updated_at
    BEFORE UPDATE ON dock_preferences
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add comment to table
COMMENT ON TABLE dock_preferences IS 'Stores user dock customization preferences including dock type and icon positions';
COMMENT ON COLUMN dock_preferences.icon_positions IS 'JSON array of icon positions: [{id: string, x: number, y: number, order: number}]';
