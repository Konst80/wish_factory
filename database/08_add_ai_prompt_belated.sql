-- Migration: Add ai_prompt_belated column to user_settings table
-- This adds support for belated wish prompts in AI settings

-- Add the new column to user_settings table
ALTER TABLE user_settings ADD COLUMN ai_prompt_belated TEXT;

-- Update the column comment
COMMENT ON COLUMN user_settings.ai_prompt_belated IS 'AI prompt instructions for generating belated/late wishes';

-- Set a default value for existing records (optional)
UPDATE user_settings 
SET ai_prompt_belated = 'Formuliere den Wunsch als nachträglichen Glückwunsch. Beginne mit einer höflichen Entschuldigung für die Verspätung (z.B. "Auch wenn ich etwas spät dran bin..." oder "Nachträglich aber von Herzen..."). Der Ton sollte dennoch warm und herzlich bleiben, ohne übermäßig entschuldigend zu wirken.'
WHERE ai_prompt_belated IS NULL;