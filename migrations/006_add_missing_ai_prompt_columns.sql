-- Migration: Add missing AI prompt age-specific columns
-- These columns are used for age-specific prompt instructions

-- Add age-specific prompt columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS ai_prompt_age_young TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_prompt_age_middle TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_prompt_age_senior TEXT DEFAULT '';

-- Set default values for existing users
UPDATE user_settings 
SET 
    ai_prompt_age_young = COALESCE(ai_prompt_age_young, ''),
    ai_prompt_age_middle = COALESCE(ai_prompt_age_middle, ''),
    ai_prompt_age_senior = COALESCE(ai_prompt_age_senior, '')
WHERE ai_prompt_age_young IS NULL 
   OR ai_prompt_age_middle IS NULL 
   OR ai_prompt_age_senior IS NULL; 