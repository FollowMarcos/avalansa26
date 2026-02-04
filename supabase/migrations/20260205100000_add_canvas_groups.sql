-- Add groups column to canvases table for storing node groups
-- Groups are visual containers that organize nodes on the canvas

ALTER TABLE canvases
ADD COLUMN IF NOT EXISTS groups JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN canvases.groups IS 'Array of GroupData objects for visual node grouping';
