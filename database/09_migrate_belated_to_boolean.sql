-- Migration: Convert belated field from text to boolean
-- This migration clears all existing belated text values and converts the field to boolean

-- First, clear all existing belated text values
UPDATE wishes SET belated = NULL WHERE belated IS NOT NULL;

-- Convert the column type from TEXT to BOOLEAN
ALTER TABLE wishes ALTER COLUMN belated TYPE BOOLEAN USING (
  CASE 
    WHEN belated IS NULL THEN FALSE
    WHEN belated = '' THEN FALSE
    WHEN belated = 'true' THEN TRUE
    ELSE FALSE
  END
);

-- Set default value to FALSE for new records
ALTER TABLE wishes ALTER COLUMN belated SET DEFAULT FALSE;

-- Update any NULL values to FALSE
UPDATE wishes SET belated = FALSE WHERE belated IS NULL;

-- Add NOT NULL constraint
ALTER TABLE wishes ALTER COLUMN belated SET NOT NULL;

-- Update column comment
COMMENT ON COLUMN wishes.belated IS 'Boolean flag indicating if this is a belated/late wish';