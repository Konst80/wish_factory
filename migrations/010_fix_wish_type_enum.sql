-- Migration: Fix wish_type enum to match TypeScript schema
-- Adds missing enum values 'herzlich' and 'humorvoll' to wish_type

-- Add new enum values to match TypeScript schema
ALTER TYPE wish_type ADD VALUE IF NOT EXISTS 'herzlich';
ALTER TYPE wish_type ADD VALUE IF NOT EXISTS 'humorvoll';

-- Note: We keep 'funny' for backward compatibility
-- The TypeScript schema should be updated to include all values:
-- z.enum(['normal', 'funny', 'herzlich', 'humorvoll'])