-- Fix RLS Policies to prevent infinite recursion
-- Run this in Supabase SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON profiles;

-- Recreate profiles policies without circular references
-- Policy 1: Users can view their own profile (no subquery needed)
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (no subquery needed)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Service role can view all profiles (for admin operations)
CREATE POLICY "Service role can view all profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 4: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Now fix the wishes policies to avoid circular references
-- Drop existing policies
DROP POLICY IF EXISTS "Redakteur can view their own wishes" ON wishes;
DROP POLICY IF EXISTS "Redakteur can create wishes" ON wishes;
DROP POLICY IF EXISTS "Redakteur can update their own wishes" ON wishes;
DROP POLICY IF EXISTS "Administrator can view all wishes" ON wishes;
DROP POLICY IF EXISTS "Administrator can create wishes" ON wishes;
DROP POLICY IF EXISTS "Administrator can update all wishes" ON wishes;
DROP POLICY IF EXISTS "Administrator can delete wishes" ON wishes;
DROP POLICY IF EXISTS "Public can view approved wishes" ON wishes;

-- Create a function to safely get user role without circular dependency
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Use security definer to bypass RLS for this function
    SELECT role INTO user_role_val
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role_val, 'Redakteur'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate wishes policies using the function
CREATE POLICY "Users can view their own wishes" ON wishes
    FOR SELECT USING (
        created_by = auth.uid() OR 
        get_user_role() = 'Administrator'
    );

CREATE POLICY "Users can create wishes" ON wishes
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update wishes based on role" ON wishes
    FOR UPDATE USING (
        (created_by = auth.uid()) OR 
        (get_user_role() = 'Administrator')
    );

CREATE POLICY "Administrators can delete wishes" ON wishes
    FOR DELETE USING (get_user_role() = 'Administrator');

-- Public API Policy - unchanged
CREATE POLICY "Public can view approved wishes" ON wishes
    FOR SELECT USING (status = 'Freigegeben');

-- Verify the policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;