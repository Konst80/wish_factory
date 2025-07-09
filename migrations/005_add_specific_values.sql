-- Migration: Add specific values for events and languages
-- This migration adds columns for storing specific values for different event types and languages

-- Add columns for specific values - now as descriptive text
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_birthday_de TEXT DEFAULT '';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_birthday_en TEXT DEFAULT '';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_anniversary_de TEXT DEFAULT '';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_anniversary_en TEXT DEFAULT '';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_custom_de TEXT DEFAULT '';

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS specific_values_custom_en TEXT DEFAULT '';

-- Update existing records with default descriptive values
UPDATE user_settings SET 
  specific_values_birthday_de = '16 Jahre (Sweet Sixteen - Übergang zur Jugend), 18 Jahre (Volljährigkeit - rechtliche Selbstständigkeit), 21 Jahre (Erwachsenwerden - traditionelle Mündigkeit), 30 Jahre (Lebensmitte - berufliche Etablierung), 40 Jahre (Midlife-Meilenstein), 50 Jahre (Goldener Geburtstag - Lebenserfahrung), 60 Jahre (Rentenalter), 65 Jahre (Ruhestand), 70 Jahre (Lebensweisheit), 80 Jahre (Ehrwürdiges Alter), 90 Jahre (Seltener Meilenstein), 100 Jahre (Jahrhundert-Geburtstag)',
  specific_values_birthday_en = '16 years (Sweet Sixteen - transition to youth), 18 years (Coming of age - legal independence), 21 years (Adult milestone - traditional maturity), 30 years (Life milestone - professional establishment), 40 years (Midlife milestone), 50 years (Golden birthday - life experience), 60 years (Retirement age), 65 years (Senior years), 70 years (Life wisdom), 80 years (Venerable age), 90 years (Rare milestone), 100 years (Century birthday)',
  specific_values_anniversary_de = '1 Jahr (Papierhochzeit - noch zerbrechlich), 5 Jahre (Holzhochzeit - erste Festigkeit), 10 Jahre (Rosenhochzeit - Liebe blüht), 15 Jahre (Kristallhochzeit - Klarheit), 20 Jahre (Porzellanhochzeit - Zerbrechlichkeit überwunden), 25 Jahre (Silberhochzeit - wertvolle Verbindung), 30 Jahre (Perlenhochzeit - Schönheit durch Zeit), 40 Jahre (Rubinhochzeit - leidenschaftliche Liebe), 50 Jahre (Goldene Hochzeit - unvergängliche Liebe), 60 Jahre (Diamantenhochzeit - unzerstörbare Verbindung), 70 Jahre (Gnadenhochzeit - seltener Segen)',
  specific_values_anniversary_en = '1 year (Paper anniversary - still fragile), 5 years (Wood anniversary - gaining strength), 10 years (Tin anniversary - flexible yet strong), 15 years (Crystal anniversary - clarity), 20 years (China anniversary - delicate beauty), 25 years (Silver anniversary - precious connection), 30 years (Pearl anniversary - beauty through time), 40 years (Ruby anniversary - passionate love), 50 years (Golden anniversary - enduring love), 60 years (Diamond anniversary - unbreakable bond), 70 years (Platinum anniversary - rare blessing)',
  specific_values_custom_de = '5 Jahre (Lustrum - erste Bewährung), 10 Jahre (Dekade - Beständigkeit), 15 Jahre (Kontinuität), 20 Jahre (Bewährte Treue), 25 Jahre (Vierteljahrhundert - lange Treue), 30 Jahre (Generationswechsel)',
  specific_values_custom_en = '5 years (Lustrum - first proving), 10 years (Decade - consistency), 15 years (Continuity), 20 years (Proven loyalty), 25 years (Quarter century - long loyalty), 30 years (Generational milestone)'
WHERE specific_values_birthday_de IS NULL;