-- Clean up any test wishes created during debugging
DELETE FROM wishes WHERE text LIKE '%Test-Wunsch%' OR text LIKE '%Alles Gute zum Geburtstag, liebe(r) [Name]!%';

-- Show remaining wishes
SELECT id, text, status, created_at FROM wishes ORDER BY created_at DESC;