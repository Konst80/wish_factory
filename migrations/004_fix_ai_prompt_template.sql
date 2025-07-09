-- Migration: Fix AI Prompt Template Structure and Update JSON Format
-- This migration consolidates AI prompt templates and updates them with strict JSON format

-- First, add the unified ai_prompt_template column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS ai_prompt_template TEXT;

-- Update the unified template with the new strict JSON format
UPDATE user_settings 
SET ai_prompt_template = 'Du bist ein Experte für das Schreiben von Glückwünschen. Generiere {count} {countText} in der Sprache "{language}" basierend auf folgenden Kriterien:

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

**KRITISCH WICHTIG: Du MUSST exakt in diesem JSON-Format antworten - KEIN anderes Format ist erlaubt:**

{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches hier",
      "belated": "Nachträglicher Text hier", 
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}

**ANTWORTE NUR MIT DIESEM JSON - KEIN zusätzlicher Text, keine Markdown-Formatierung, keine Erklärungen!**'
WHERE ai_prompt_template IS NULL OR ai_prompt_template = '';

-- Update the system prompt as well for better JSON enforcement
UPDATE user_settings 
SET ai_prompt_system = 'Du bist ein Experte für das Schreiben von Glückwünschen. Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt.'
WHERE ai_prompt_system IS NULL OR ai_prompt_system = 'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.';

-- Set default values for new users
ALTER TABLE user_settings 
ALTER COLUMN ai_prompt_template SET DEFAULT 'Du bist ein Experte für das Schreiben von Glückwünschen. Generiere {count} {countText} in der Sprache "{language}" basierend auf folgenden Kriterien:

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

**KRITISCH WICHTIG: Du MUSST exakt in diesem JSON-Format antworten - KEIN anderes Format ist erlaubt:**

{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches hier",
      "belated": "Nachträglicher Text hier", 
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}

**ANTWORTE NUR MIT DIESEM JSON - KEIN zusätzlicher Text, keine Markdown-Formatierung, keine Erklärungen!**';

ALTER TABLE user_settings 
ALTER COLUMN ai_prompt_system SET DEFAULT 'Du bist ein Experte für das Schreiben von Glückwünschen. Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt.'; 