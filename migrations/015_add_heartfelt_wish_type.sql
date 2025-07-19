-- Migration 015: Add 'heartfelt' wish type to enum
-- This adds the new 'heartfelt' type to support the international API specification

-- Add 'heartfelt' to the wish_type enum
ALTER TYPE wish_type ADD VALUE 'heartfelt';

-- Update any existing 'herzlich' wishes to use 'heartfelt' for API consistency
UPDATE wishes 
SET type = 'heartfelt' 
WHERE type = 'herzlich';

-- Update any existing 'humorvoll' wishes to use 'funny' for API consistency  
UPDATE wishes 
SET type = 'funny' 
WHERE type = 'humorvoll';

-- Remove the old German enum values (this will fail if any data still references them)
-- Note: PostgreSQL doesn't allow removing enum values that are still referenced
-- So we need to ensure all data is migrated first

-- Create a comment to document this change
COMMENT ON TYPE wish_type IS 'Wish types: normal, heartfelt, funny (updated in migration 015)';