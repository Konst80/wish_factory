-- Migration: Add AI Prompt Settings to user_settings table
-- This migration adds configurable AI prompt templates to the user_settings table

-- Add new columns for AI prompt settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS ai_prompt_system TEXT DEFAULT 'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.',
ADD COLUMN IF NOT EXISTS ai_prompt_template_de TEXT DEFAULT 'Du bist ein Experte für das Schreiben von Glückwünschen auf Deutsch. Generiere {count} {countText} basierend auf folgenden Kriterien:

**Wichtige Regeln:**
- Verwende IMMER geschlechtsneutrale Sprache (keine "er/sie" Annahmen)
- Nutze die Platzhalter [Name], [Alter], [Anlass] wo sinnvoll
- Der Stil soll "{style}" sein
- Anlass: {eventText}
- Beziehung: {relationTexts}
- Zielgruppe: {ageGroupTexts}
{specificValues}
{additionalInstructions}

**Stil-Definitionen:**
- normal: Freundlich und herzlich, aber nicht übertrieben
- herzlich: Emotional und warmherzig, persönlich
- humorvoll: Lustig und spielerisch, aber respektvoll
- formell: Höflich und professionell, respektvoll

Generiere für jeden Wunsch sowohl einen normalen Text als auch einen nachträglichen (belated) Text.

**Antwortformat (JSON):**
{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches",
      "belated": "Nachträglicher Text",
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}',
ADD COLUMN IF NOT EXISTS ai_prompt_template_en TEXT DEFAULT 'You are an expert at writing greetings in English. Generate {count} greeting{countPlural} based on these criteria:

**Important Rules:**
- ALWAYS use gender-neutral language (no "he/she" assumptions)
- Use placeholders [Name], [Age], [Occasion] where appropriate
- Style should be "{style}"
- Occasion: {eventType}
- Relationship: {relations}
- Target audience: {ageGroups}
{specificValues}
{additionalInstructions}

**Style Definitions:**
- normal: Friendly and warm, but not excessive
- herzlich: Emotional and heartfelt, personal
- humorvoll: Funny and playful, but respectful
- formell: Polite and professional, respectful

Generate both a regular text and a belated text for each wish.

**Response Format (JSON):**
{
  "wishes": [
    {
      "text": "Main greeting text",
      "belated": "Belated greeting text",
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}',
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'anthropic/claude-3.5-sonnet',
ADD COLUMN IF NOT EXISTS ai_temperature DECIMAL(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS ai_max_tokens INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS ai_top_p DECIMAL(3,2) DEFAULT 0.9,
ADD COLUMN IF NOT EXISTS ai_frequency_penalty DECIMAL(3,2) DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS ai_presence_penalty DECIMAL(3,2) DEFAULT 0.1;

-- Update existing default settings object
UPDATE user_settings 
SET 
    ai_prompt_system = 'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.',
    ai_model = 'anthropic/claude-3.5-sonnet',
    ai_temperature = 0.8,
    ai_max_tokens = 2000,
    ai_top_p = 0.9,
    ai_frequency_penalty = 0.1,
    ai_presence_penalty = 0.1
WHERE ai_prompt_system IS NULL; 