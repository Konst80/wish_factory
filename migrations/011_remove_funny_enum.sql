-- Migration: Remove 'funny' enum value and keep only German terms
-- This ensures consistency with the German interface

-- Note: We cannot directly remove enum values in PostgreSQL
-- We need to recreate the enum type

-- 1. Create a new temporary enum with the correct values
CREATE TYPE wish_type_new AS ENUM ('normal', 'herzlich', 'humorvoll');

-- 2. Update the wishes table to use the new enum
ALTER TABLE wishes 
ALTER COLUMN type TYPE wish_type_new 
USING (
  CASE 
    WHEN type = 'funny' THEN 'humorvoll'::wish_type_new
    ELSE type::text::wish_type_new
  END
);

-- 3. Update the released_wishes table 
UPDATE released_wishes 
SET type = 'humorvoll' 
WHERE type = 'funny';

-- 4. Drop the old enum and rename the new one
DROP TYPE wish_type;
ALTER TYPE wish_type_new RENAME TO wish_type;