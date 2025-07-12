-- Migration: Add length field to wishes table
-- This migration adds the length field to track desired wish length (short, medium, long)

-- Add length column to wishes table
ALTER TABLE wishes 
ADD COLUMN IF NOT EXISTS length TEXT DEFAULT 'medium';

-- Add check constraint to ensure only valid length values
ALTER TABLE wishes 
ADD CONSTRAINT check_length_values 
CHECK (length IN ('short', 'medium', 'long'));

-- Update existing wishes to have default length
UPDATE wishes 
SET length = 'medium' 
WHERE length IS NULL;

-- Make length column NOT NULL after setting defaults
ALTER TABLE wishes 
ALTER COLUMN length SET NOT NULL;