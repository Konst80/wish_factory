# Wish-Factory Database Setup

This directory contains the complete database schema and setup scripts for the Wish-Factory CMS.

## Quick Start

### Option 1: Single Deployment Script

Run the complete deployment script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of deploy.sql
```

### Option 2: Individual Scripts (for development)

Run the scripts in this order:

1. `01_create_enums.sql` - Creates PostgreSQL enums
2. `02_create_tables.sql` - Creates tables and indexes
3. `03_create_rls_policies.sql` - Sets up Row Level Security
4. `04_create_functions.sql` - Creates database functions
5. `05_create_triggers.sql` - Creates triggers
6. `06_seed_data.sql` - Adds test data (optional)

## Database Schema

### Tables

#### `profiles`

Extends Supabase auth.users with custom fields:

- `id` - UUID (references auth.users)
- `email` - Email address
- `full_name` - Full name
- `role` - User role (Redakteur/Administrator)
- `created_at`, `updated_at` - Timestamps

#### `wishes`

Main wishes table:

- `id` - Format: `wish_external_{language}_{number}`
- `type` - normal/funny
- `event_type` - birthday/anniversary/custom
- `relations` - Array of target relationships
- `age_groups` - Array of target age groups
- `specific_values` - Array of specific milestone numbers
- `text` - Main wish text with placeholders
- `belated` - Belated wish text
- `status` - Workflow status
- `language` - de/en
- `created_by` - Creator UUID
- Timestamps

### Enums

- `wish_type`: normal, funny
- `event_type`: birthday, anniversary, custom
- `wish_status`: Entwurf, Zur Freigabe, Freigegeben, Archiviert
- `language`: de, en
- `relation`: friend, family, partner, colleague
- `age_group`: all, young, middle, senior
- `user_role`: Redakteur, Administrator

### Row Level Security (RLS)

#### Redakteur Permissions

- Can view/edit/create their own wishes
- Can view their own profile
- Can transition wishes: Entwurf ↔ Zur Freigabe

#### Administrator Permissions

- Can view/edit/create all wishes
- Can view all profiles
- Can perform all status transitions
- Can delete wishes

#### Public API

- Can view only approved wishes (status = 'Freigegeben')

### Functions

#### `generate_wish_id(language)`

Generates unique wish IDs in format `wish_external_{lang}_{number}`

#### `validate_status_transition(current, new, role)`

Validates workflow status transitions based on user role

#### `search_wishes(...)`

Advanced search with filtering by:

- Text search
- Language
- Status
- Event type
- Relations
- Age groups
- Pagination

### Triggers

#### `create_profile_trigger`

Automatically creates a profile when a new user signs up via Supabase Auth

#### `validate_wish_status_trigger`

Validates status transitions and updates timestamps

#### `update_profiles_updated_at`

Updates the updated_at timestamp on profile changes

## Development Setup

1. Create a new Supabase project
2. Go to the SQL editor in your Supabase dashboard
3. Copy and paste the contents of `deploy.sql`
4. Run the script
5. For development/testing, uncomment the seed data section

## Testing the Setup

After deployment, you can test the setup:

```sql
-- Test enum creation
SELECT unnest(enum_range(NULL::wish_type));

-- Test table creation
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'wishes');

-- Test RLS policies
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public';

-- Test functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%wish%';
```

## Environment Variables

Make sure to set these in your `.env` file:

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

1. **Authentication Setup**: Implement Supabase auth in your SvelteKit app
2. **Type Safety**: Use the generated TypeScript types
3. **API Integration**: Connect your frontend to the database
4. **Testing**: Create tests for the database functions
5. **Monitoring**: Set up logging and monitoring for the database

## Troubleshooting

### Common Issues

1. **RLS Policies Not Working**: Make sure you're authenticated and have the correct user role
2. **Status Transitions Failing**: Check that the transition is allowed for your role
3. **ID Generation Issues**: Verify the wish ID format matches the regex pattern

### Useful Queries

```sql
-- Check current user and role
SELECT auth.uid(), p.role
FROM profiles p
WHERE p.id = auth.uid();

-- View all wishes with creator info
SELECT w.*, p.full_name as creator_name
FROM wishes w
JOIN profiles p ON w.created_by = p.id;

-- Test search function
SELECT * FROM search_wishes('birthday', 'de', 'Freigegeben');
```
