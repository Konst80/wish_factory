-- Test creating a wish directly with proper data to see if it works
-- This will help us determine if the issue is frontend or backend

-- Generate a test ID
SELECT generate_wish_id('de'::language) as test_id;

-- Create a test wish manually with valid data
INSERT INTO wishes (
    id, 
    type, 
    event_type, 
    relations, 
    age_groups, 
    specific_values, 
    text, 
    belated, 
    status, 
    language, 
    created_by
) VALUES (
    generate_wish_id('de'::language),
    'normal'::wish_type,
    'birthday'::event_type,
    ARRAY['friend']::relation[],
    ARRAY['all']::age_group[],
    ARRAY[]::INTEGER[],
    'Alles Gute zum Geburtstag, liebe(r) [Name]! Möge dein [Age]. Geburtstag wunderbar werden.',
    'Nachträglich alles Gute zum Geburtstag! Ich hoffe, dein [Age]. Geburtstag war fantastisch.',
    'Entwurf'::wish_status,
    'de'::language,
    '8ef0ae50-858b-4adb-a45a-0227b5c7c4a7'  -- Your user ID
);

-- Check if the wish was created
SELECT id, text, status, created_at FROM wishes ORDER BY created_at DESC LIMIT 1;