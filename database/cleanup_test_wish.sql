-- Clean up the test wish we created
DELETE FROM wishes WHERE id = 'wish_external_de_999';

-- Verify it was deleted
SELECT COUNT(*) as remaining_test_wishes FROM wishes WHERE id = 'wish_external_de_999';