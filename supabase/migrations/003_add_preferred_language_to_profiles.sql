-- Add preferred_language column to profiles table
ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'de' CHECK (preferred_language IN ('de', 'en'));