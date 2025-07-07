-- Test wish creation functionality
-- Run this in Supabase SQL Editor to debug wish creation issues

-- 1. Test if the generate_wish_id function exists and works
SELECT generate_wish_id('de'::language) as generated_id_de;
SELECT generate_wish_id('en'::language) as generated_id_en;

-- 2. Check if all required enums exist
SELECT unnest(enum_range(NULL::wish_type)) as wish_types;
SELECT unnest(enum_range(NULL::event_type)) as event_types;
SELECT unnest(enum_range(NULL::wish_status)) as wish_statuses;
SELECT unnest(enum_range(NULL::language)) as languages;
SELECT unnest(enum_range(NULL::relation)) as relations;
SELECT unnest(enum_range(NULL::age_group)) as age_groups;

-- 3. Test a simple wish insertion manually
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
    'wish_external_de_999',
    'normal'::wish_type,
    'birthday'::event_type,
    ARRAY['friend']::relation[],
    ARRAY['all']::age_group[],
    ARRAY[18, 21, 30],
    'Test-Wunsch: Alles Gute zum Geburtstag! Du wirst [Age] Jahre alt.',
    'Nachträglich alles Gute zum Geburtstag! Hoffe, dein [Age]. Geburtstag war schön.',
    'Entwurf'::wish_status,
    'de'::language,
    '8ef0ae50-858b-4adb-a45a-0227b5c7c4a7'  -- Your user ID
)
ON CONFLICT (id) DO NOTHING;

-- 4. Check if the test wish was created
SELECT * FROM wishes WHERE id = 'wish_external_de_999';