-- Check if the profile creation trigger exists and is working
-- Run this in Supabase SQL Editor

-- Check if the trigger function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_profile_on_signup';

-- Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'create_profile_trigger';

-- Check auth.users table (make sure the user exists)
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@example.com';

-- Test the trigger function manually (if needed)
-- This will create a profile for any auth user that doesn't have one
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
    'Redakteur'::user_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;