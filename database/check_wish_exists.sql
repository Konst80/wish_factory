-- Check if the wish exists and what data it has
SELECT * FROM wishes WHERE id = 'wish_external_de_9';

-- Also check all wishes to see what we have
SELECT id, text, status, created_at FROM wishes ORDER BY created_at DESC;