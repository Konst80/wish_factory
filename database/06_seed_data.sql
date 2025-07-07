-- Testdaten für Wish-Factory Entwicklung und Testing
-- Diese Daten werden nur in der Entwicklungsumgebung verwendet

-- =======================
-- TEST PROFILES
-- =======================

-- Erstelle Test-Administrator (UUID wird durch Auth generiert)
INSERT INTO profiles (id, email, full_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@wish-factory.com', 'Test Administrator', 'Administrator'),
    ('550e8400-e29b-41d4-a716-446655440001', 'redakteur@wish-factory.com', 'Test Redakteur', 'Redakteur'),
    ('550e8400-e29b-41d4-a716-446655440002', 'redakteur2@wish-factory.com', 'Test Redakteur 2', 'Redakteur')
ON CONFLICT (id) DO NOTHING;

-- =======================
-- TEST WISHES
-- =======================

-- Deutsche Test-Wishes
INSERT INTO wishes (
    id, type, event_type, relations, age_groups, specific_values, 
    text, belated, status, language, created_by
) VALUES
    (
        'wish_external_de_1',
        'normal',
        'birthday',
        ARRAY['friend', 'family']::relation[],
        ARRAY['young', 'middle']::age_group[],
        ARRAY[18, 21, 25, 30],
        'Alles Gute zum Geburtstag, liebe(r) [Name]! Du wirst heute [Age] Jahre alt - möge dieses neue Lebensjahr voller Freude und Erfolg sein.',
        'Nachträglich alles Gute zum Geburtstag, [Name]! Ich hoffe, du hattest einen wunderschönen Tag und bist gut ins neue Lebensjahr gestartet.',
        'Freigegeben',
        'de',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'wish_external_de_2',
        'funny',
        'birthday',
        ARRAY['friend']::relation[],
        ARRAY['young']::age_group[],
        ARRAY[18, 20, 21],
        'Happy Birthday [Name]! Du bist jetzt [Age] Jahre alt - Zeit für mehr Kaffee und weniger Sorgen! 🎉',
        'Sorry, dass ich deinen [Age]. Geburtstag verpasst habe, [Name]! Aber hey, wenigstens vergesse ich dich nicht komplett! 😄',
        'Freigegeben',
        'de',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'wish_external_de_3',
        'normal',
        'anniversary',
        ARRAY['partner', 'family']::relation[],
        ARRAY['all']::age_group[],
        ARRAY[1, 5, 10, 25, 50],
        'Herzlichen Glückwunsch zum [Age]-jährigen Jubiläum! [Name], was für eine wunderbare Reise das war.',
        'Nachträglich herzlichen Glückwunsch zum [Age]-jährigen Jubiläum, [Name]! Mögen noch viele weitere Jahre folgen.',
        'Entwurf',
        'de',
        '550e8400-e29b-41d4-a716-446655440002'
    ),
    (
        'wish_external_de_4',
        'normal',
        'custom',
        ARRAY['colleague']::relation[],
        ARRAY['middle', 'senior']::age_group[],
        ARRAY[]::INTEGER[],
        'Liebe(r) [Name], herzlichen Glückwunsch zu diesem besonderen Anlass! Du hast es dir wirklich verdient.',
        'Nachträglich herzlichen Glückwunsch, [Name]! Ich hoffe, die Feier war wunderbar.',
        'Zur Freigabe',
        'de',
        '550e8400-e29b-41d4-a716-446655440002'
    ),

    -- Englische Test-Wishes
    (
        'wish_external_en_1',
        'normal',
        'birthday',
        ARRAY['friend', 'family']::relation[],
        ARRAY['all']::age_group[],
        ARRAY[16, 18, 21, 30, 40, 50],
        'Happy Birthday [Name]! Wishing you a fantastic [Age]th birthday filled with joy, laughter, and wonderful memories.',
        'Belated Happy Birthday [Name]! Hope your [Age]th birthday was absolutely amazing and filled with love.',
        'Freigegeben',
        'en',
        '550e8400-e29b-41d4-a716-446655440000'
    ),
    (
        'wish_external_en_2',
        'funny',
        'birthday',
        ARRAY['friend']::relation[],
        ARRAY['young', 'middle']::age_group[],
        ARRAY[25, 30, 35, 40],
        'Happy Birthday [Name]! You''re now [Age] years old - that''s like 18 with [Age-18] years of experience! 🎂',
        'Oops! Missed your [Age]th birthday [Name]! But hey, at least I''m consistently late! 🎉',
        'Freigegeben',
        'en',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'wish_external_en_3',
        'normal',
        'anniversary',
        ARRAY['partner']::relation[],
        ARRAY['middle', 'senior']::age_group[],
        ARRAY[1, 5, 10, 15, 20, 25],
        'Congratulations on your [Age]th anniversary, [Name]! What a beautiful journey it has been.',
        'Belated congratulations on your [Age]th anniversary, [Name]! Wishing you many more years of happiness.',
        'Archiviert',
        'en',
        '550e8400-e29b-41d4-a716-446655440000'
    );

-- =======================
-- WISHES MIT VERSCHIEDENEN STATUS FÜR TESTING
-- =======================

-- Weitere Entwürfe für Testing
INSERT INTO wishes (
    id, type, event_type, relations, age_groups, specific_values,
    text, belated, status, language, created_by
) VALUES
    (
        'wish_external_de_5',
        'normal',
        'birthday',
        ARRAY['family']::relation[],
        ARRAY['senior']::age_group[],
        ARRAY[60, 65, 70, 75, 80],
        'Liebe(r) [Name], zu deinem [Age]. Geburtstag wünsche ich dir Gesundheit, Glück und viele schöne Momente.',
        'Nachträglich alles Gute zum [Age]. Geburtstag, [Name]! Mögest du noch viele gesunde Jahre erleben.',
        'Entwurf',
        'de',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'wish_external_en_4',
        'funny',
        'custom',
        ARRAY['colleague']::relation[],
        ARRAY['young', 'middle']::age_group[],
        ARRAY[]::INTEGER[],
        'Congratulations [Name]! You did it! Now time for coffee and celebration! ☕🎉',
        'Better late than never - congratulations [Name]! Hope the celebration was epic!',
        'Zur Freigabe',
        'en',
        '550e8400-e29b-41d4-a716-446655440002'
    );