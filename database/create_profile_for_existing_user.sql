-- Create profile for the existing user k.rudnizki@gmail.com
-- and set them as Administrator

INSERT INTO profiles (id, email, full_name, role)
VALUES (
    '8ef0ae50-858b-4adb-a45a-0227b5c7c4a7',
    'k.rudnizki@gmail.com',
    'Administrator',
    'Administrator'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'Administrator',
    full_name = 'Administrator';

-- Verify the profile was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE id = '8ef0ae50-858b-4adb-a45a-0227b5c7c4a7';