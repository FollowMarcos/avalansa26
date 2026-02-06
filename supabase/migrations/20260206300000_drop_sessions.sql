-- Drop sessions feature (feature removed)
-- Remove session_id column and index from generations first, then drop sessions table

DROP INDEX IF EXISTS idx_generations_session_id;
ALTER TABLE IF EXISTS generations DROP COLUMN IF EXISTS session_id;

DROP TABLE IF EXISTS sessions CASCADE;
