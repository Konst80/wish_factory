-- Ensure all required enums exist for system initialization
-- This should be run before the main migrations

-- Drop existing enums if they exist (to recreate them)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS wish_type CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS wish_status CASCADE;
DROP TYPE IF EXISTS language CASCADE;
DROP TYPE IF EXISTS relation CASCADE;
DROP TYPE IF EXISTS age_group CASCADE;

-- Recreate all enums
CREATE TYPE user_role AS ENUM (
    'Redakteur',
    'Administrator'
);

CREATE TYPE wish_type AS ENUM (
    'normal',
    'funny'
);

CREATE TYPE event_type AS ENUM (
    'birthday',
    'anniversary', 
    'custom'
);

CREATE TYPE wish_status AS ENUM (
    'Entwurf',
    'Zur Freigabe',
    'Freigegeben',
    'Archiviert'
);

CREATE TYPE language AS ENUM (
    'de',
    'en'
);

CREATE TYPE relation AS ENUM (
    'friend',
    'family',
    'partner',
    'colleague'
);

CREATE TYPE age_group AS ENUM (
    'all',
    'young',
    'middle',
    'senior'
);