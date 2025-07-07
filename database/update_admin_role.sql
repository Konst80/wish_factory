-- Update the admin user role
-- Replace 'admin@example.com' with the actual email if different
-- This will set the user role to Administrator

UPDATE profiles 
SET 
    role = 'Administrator',
    full_name = 'Administrator'
WHERE email = 'admin@example.com';

-- Verify the update
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@example.com';