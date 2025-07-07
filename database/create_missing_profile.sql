-- Create missing profile for admin user
-- First, let's see what auth users exist without profiles

SELECT u.id, u.email, u.created_at, u.raw_user_meta_data
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Now create the admin profile for the user with email 'admin@example.com'
-- This will handle the case where the trigger didn't create the profile

INSERT INTO profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Administrator'),
    'Administrator'::user_role
FROM auth.users u
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
    role = 'Administrator',
    full_name = 'Administrator';

-- Verify the profile was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@example.com';