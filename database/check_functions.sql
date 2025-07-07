-- Check if all required functions exist
-- Run this in Supabase SQL Editor

-- Check if generate_wish_id function exists
SELECT routine_name, routine_type, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_wish_id';

-- Check if validate_status_transition function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'validate_status_transition';

-- Check if get_user_role function exists (from our RLS fix)
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_role';

-- Test the generate_wish_id function
SELECT generate_wish_id('de'::language) as test_id_de;
SELECT generate_wish_id('en'::language) as test_id_en;