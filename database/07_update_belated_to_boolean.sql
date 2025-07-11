-- Migration: Update belated field from TEXT to BOOLEAN
-- This changes the wish model to use a boolean flag instead of separate text field

-- First, backup any existing data and set a temporary default
ALTER TABLE wishes ADD COLUMN belated_new BOOLEAN DEFAULT false;

-- Update existing records: if belated text is not empty, set to true
UPDATE wishes SET belated_new = true WHERE belated IS NOT NULL AND length(trim(belated)) > 0;

-- Drop the old column and constraints
ALTER TABLE wishes DROP COLUMN belated;

-- Rename the new column to belated
ALTER TABLE wishes RENAME COLUMN belated_new TO belated;

-- Update the full-text search index to only use text column
DROP INDEX IF EXISTS idx_wishes_text_search;
CREATE INDEX IF NOT EXISTS idx_wishes_text_search ON wishes USING GIN(to_tsvector('german', text));

-- Update any comments or documentation
COMMENT ON COLUMN wishes.belated IS 'Boolean flag indicating if this is a belated wish';