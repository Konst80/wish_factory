# Database Setup Guide

## Step 1: Deploy the Database Schema

1. Open your Supabase Dashboard: <https://supabase.com/dashboard>
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `database/deploy.sql` (the fixed version without subquery issues)
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl/Cmd + Enter)

## Step 2: Create Admin User

### Option A: Using the Admin UI (Recommended)

1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add user**
3. Enter:
   - Email: `admin@example.com`
   - Password: `Konst`
   - Confirm password: `Konst`
4. Click **Create user**
5. Note down the User ID (UUID) that appears

### Option B: Using SQL

1. Go to **SQL Editor** again
2. Create a new query
3. Run this SQL (replace the UUID with the actual user ID from step A.5):

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES
    (
        'YOUR_USER_ID_HERE', -- Replace with actual UUID from auth.users
        'admin@example.com',
        'Administrator',
        'Administrator'
    )
ON CONFLICT (id)
DO UPDATE SET
    role = 'Administrator',
    full_name = 'Administrator';
```

## Step 3: Verify Setup

1. Go to **Table Editor** in Supabase Dashboard
2. Check that these tables exist:
   - `profiles`
   - `wishes`
3. Check that your admin user appears in the `profiles` table with role = 'Administrator'

## Step 4: Test Login

1. Go back to your application: http://localhost:5173/auth/login
2. Login with:
   - Email: `admin@example.com`
   - Password: `Konst`

## Troubleshooting

If you still get "relation does not exist" errors:

1. Make sure RLS (Row Level Security) is enabled on both tables
2. Check that all the database functions were created successfully
3. Verify the user profile was created with the correct role

### Check Tables Exist

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'wishes');
```

### Check User Profile

```sql
SELECT * FROM profiles WHERE email = 'admin@example.com';
```

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public';
```
