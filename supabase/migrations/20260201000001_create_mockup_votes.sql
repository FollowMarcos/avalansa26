-- Migration: Create mockup_votes table for labs experiments
-- This table stores user votes (like/dislike) on design mockups

-- Create mockup_votes table
CREATE TABLE IF NOT EXISTS mockup_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mockup_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  feedback TEXT, -- Optional text feedback from user
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user can only vote once per mockup
  UNIQUE(user_id, mockup_id)
);

-- Create index for fast lookups
CREATE INDEX idx_mockup_votes_user_id ON mockup_votes(user_id);
CREATE INDEX idx_mockup_votes_mockup_id ON mockup_votes(mockup_id);

-- Enable RLS
ALTER TABLE mockup_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own votes
CREATE POLICY "Users can view their own votes"
  ON mockup_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes"
  ON mockup_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON mockup_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON mockup_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mockup_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mockup_votes_updated_at
  BEFORE UPDATE ON mockup_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_mockup_votes_updated_at();
