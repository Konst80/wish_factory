-- Debug profiles table to find the issue
-- Run this in Supabase SQL Editor to identify the problem

-- Check if there are multiple profiles for the same user
SELECT id, email, full_name, role, created_at, COUNT(*) as count
FROM profiles 
GROUP BY id, email, full_name, role, created_at
HAVING COUNT(*) > 1;

-- Check all profiles
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at;

-- Check for profiles without corresponding auth users
SELECT p.id, p.email, p.full_name, p.role
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Check for auth users without profiles
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;