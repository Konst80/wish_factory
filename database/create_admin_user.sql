-- Create Admin User
-- Run this after deploying the main schema and creating the auth user

-- Insert admin profile (replace the UUID with your actual user ID from auth.users)
-- You can find your user ID in the Supabase Dashboard > Authentication > Users

INSERT INTO profiles (id, email, full_name, role)
VALUES 
    (
        -- Replace this UUID with the actual ID from your auth.users table
        '00000000-0000-0000-0000-000000000000', 
        'admin@example.com',
        'Administrator',
        'Administrator'
    )
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'Administrator',
    full_name = 'Administrator';

-- Alternative: Update existing user to admin role
-- UPDATE profiles 
-- SET role = 'Administrator', full_name = 'Administrator'
-- WHERE email = 'admin@example.com';