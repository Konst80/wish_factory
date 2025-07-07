-- =======================
-- WISH-FACTORY DATABASE DEPLOYMENT SCRIPT
-- =======================
-- This script creates the complete database schema for the Wish-Factory CMS
-- Run this script in your Supabase SQL editor or via CLI
-- 
-- Prerequisites:
-- - Supabase project created
-- - Database accessible via Supabase dashboard or CLI
-- - Run each section in order
-- =======================

-- 1. CREATE ENUMS
-- =======================

-- Enum für Wish-Typen
CREATE TYPE wish_type AS ENUM ('normal', 'funny');

-- Enum für Event-Typen
CREATE TYPE event_type AS ENUM ('birthday', 'anniversary', 'custom');

-- Enum für Wish-Status (Workflow)
CREATE TYPE wish_status AS ENUM ('Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert');

-- Enum für Sprachen
CREATE TYPE language AS ENUM ('de', 'en');

-- Enum für Beziehungen
CREATE TYPE relation AS ENUM ('friend', 'family', 'partner', 'colleague');

-- Enum für Altersgruppen
CREATE TYPE age_group AS ENUM ('all', 'young', 'middle', 'senior');

-- Enum für Benutzerrollen
CREATE TYPE user_role AS ENUM ('Redakteur', 'Administrator');

-- 2. CREATE TABLES
-- =======================

-- Profiles Table (erweitert auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Redakteur',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wishes Table (Haupttabelle für Wünsche)
CREATE TABLE IF NOT EXISTS wishes (
    id TEXT PRIMARY KEY,
    type wish_type NOT NULL,
    event_type event_type NOT NULL,
    relations relation[] NOT NULL,
    age_groups age_group[] NOT NULL,
    specific_values INTEGER[] DEFAULT '{}',
    text TEXT NOT NULL,
    belated TEXT NOT NULL,
    status wish_status NOT NULL DEFAULT 'Entwurf',
    language language NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_wish_id CHECK (id ~ '^wish_external_(de|en)_\d+$'),
    CONSTRAINT text_length CHECK (length(text) >= 10 AND length(text) <= 1000),
    CONSTRAINT belated_length CHECK (length(belated) >= 10 AND length(belated) <= 1000),
    CONSTRAINT relations_not_empty CHECK (array_length(relations, 1) > 0),
    CONSTRAINT age_groups_not_empty CHECK (array_length(age_groups, 1) > 0)
    -- positive_specific_values will be validated by trigger
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_language ON wishes(language);
CREATE INDEX IF NOT EXISTS idx_wishes_event_type ON wishes(event_type);
CREATE INDEX IF NOT EXISTS idx_wishes_created_by ON wishes(created_by);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at);

-- Full-text search index für Textsuche
CREATE INDEX IF NOT EXISTS idx_wishes_text_search ON wishes USING gin(to_tsvector('german', text || ' ' || belated));

-- 3. ROW LEVEL SECURITY POLICIES
-- =======================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administrators can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

-- Wishes Policies for Redakteur
CREATE POLICY "Redakteur can view their own wishes" ON wishes
    FOR SELECT USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Redakteur'
        )
    );

CREATE POLICY "Redakteur can create wishes" ON wishes
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Redakteur'
        )
    );

CREATE POLICY "Redakteur can update their own wishes" ON wishes
    FOR UPDATE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Redakteur'
        )
    );

-- Wishes Policies for Administrator
CREATE POLICY "Administrator can view all wishes" ON wishes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

CREATE POLICY "Administrator can create wishes" ON wishes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

CREATE POLICY "Administrator can update all wishes" ON wishes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

CREATE POLICY "Administrator can delete wishes" ON wishes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Administrator'
        )
    );

-- Public API Policy - Nur freigegebene Wishes
CREATE POLICY "Public can view approved wishes" ON wishes
    FOR SELECT USING (status = 'Freigegeben');

-- 4. FUNCTIONS
-- =======================

-- Funktion zur automatischen ID-Generierung
CREATE OR REPLACE FUNCTION generate_wish_id(wish_language language)
RETURNS TEXT AS $$
DECLARE
    last_num INTEGER := 0;
    new_id TEXT;
BEGIN
    -- Finde die höchste Nummer für diese Sprache
    SELECT COALESCE(MAX(
        CAST(substring(id FROM 'wish_external_' || wish_language || '_(\d+)') AS INTEGER)
    ), 0) INTO last_num
    FROM wishes 
    WHERE id LIKE 'wish_external_' || wish_language || '_%';
    
    -- Generiere neue ID
    new_id := 'wish_external_' || wish_language || '_' || (last_num + 1);
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion zur Status-Validierung
CREATE OR REPLACE FUNCTION validate_status_transition(
    current_status wish_status,
    new_status wish_status,
    user_role user_role
) RETURNS BOOLEAN AS $$
BEGIN
    -- Redakteur Berechtigungen
    IF user_role = 'Redakteur' THEN
        RETURN (
            (current_status = 'Entwurf' AND new_status = 'Zur Freigabe') OR
            (current_status = 'Zur Freigabe' AND new_status = 'Entwurf')
        );
    END IF;
    
    -- Administrator Berechtigungen
    IF user_role = 'Administrator' THEN
        RETURN (
            (current_status = 'Entwurf' AND new_status IN ('Zur Freigabe', 'Archiviert')) OR
            (current_status = 'Zur Freigabe' AND new_status IN ('Entwurf', 'Freigegeben', 'Archiviert')) OR
            (current_status = 'Freigegeben' AND new_status = 'Archiviert') OR
            (current_status = 'Archiviert' AND new_status = 'Entwurf')
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Funktion für erweiterte Wish-Suche
CREATE OR REPLACE FUNCTION search_wishes(
    search_term TEXT DEFAULT NULL,
    filter_language language DEFAULT NULL,
    filter_status wish_status DEFAULT NULL,
    filter_event_type event_type DEFAULT NULL,
    filter_relations relation[] DEFAULT NULL,
    filter_age_groups age_group[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
    id TEXT,
    type wish_type,
    event_type event_type,
    relations relation[],
    age_groups age_group[],
    specific_values INTEGER[],
    text TEXT,
    belated TEXT,
    status wish_status,
    language language,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    creator_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.type,
        w.event_type,
        w.relations,
        w.age_groups,
        w.specific_values,
        w.text,
        w.belated,
        w.status,
        w.language,
        w.created_at,
        w.updated_at,
        w.created_by,
        p.full_name as creator_name
    FROM wishes w
    JOIN profiles p ON w.created_by = p.id
    WHERE 
        (search_term IS NULL OR w.text ILIKE '%' || search_term || '%' OR w.belated ILIKE '%' || search_term || '%')
        AND (filter_language IS NULL OR w.language = filter_language)
        AND (filter_status IS NULL OR w.status = filter_status)
        AND (filter_event_type IS NULL OR w.event_type = filter_event_type)
        AND (filter_relations IS NULL OR w.relations && filter_relations)
        AND (filter_age_groups IS NULL OR w.age_groups && filter_age_groups)
    ORDER BY w.updated_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGERS
-- =======================

-- Trigger für automatische Profil-Erstellung
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unnamed User'),
        'Redakteur'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_on_signup();

-- Trigger für Status-Validierung
CREATE OR REPLACE FUNCTION validate_wish_status_change()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role;
    val INTEGER;
BEGIN
    -- Hole die Benutzerrolle
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.id = auth.uid();
    
    -- Validiere Status-Übergang nur bei Updates
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NOT validate_status_transition(OLD.status, NEW.status, user_role) THEN
            RAISE EXCEPTION 'Status-Übergang von % zu % ist für Rolle % nicht erlaubt', 
                OLD.status, NEW.status, user_role;
        END IF;
    END IF;
    
    -- Validiere specific_values (positive Zahlen)
    IF NEW.specific_values IS NOT NULL AND array_length(NEW.specific_values, 1) > 0 THEN
        FOREACH val IN ARRAY NEW.specific_values
        LOOP
            IF val <= 0 THEN
                RAISE EXCEPTION 'specific_values müssen positive Zahlen sein. Gefunden: %', val;
            END IF;
        END LOOP;
    END IF;
    
    -- Setze updated_at
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_wish_status_trigger
    BEFORE INSERT OR UPDATE ON wishes
    FOR EACH ROW
    EXECUTE FUNCTION validate_wish_status_change();

-- Trigger für updated_at bei Profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 6. SEED DATA (Optional - nur für Entwicklung)
-- =======================
-- Uncomment the following section for development/testing data

/*
-- Test Profiles
INSERT INTO profiles (id, email, full_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@wish-factory.com', 'Test Administrator', 'Administrator'),
    ('550e8400-e29b-41d4-a716-446655440001', 'redakteur@wish-factory.com', 'Test Redakteur', 'Redakteur'),
    ('550e8400-e29b-41d4-a716-446655440002', 'redakteur2@wish-factory.com', 'Test Redakteur 2', 'Redakteur')
ON CONFLICT (id) DO NOTHING;

-- Test Wishes
INSERT INTO wishes (
    id, type, event_type, relations, age_groups, specific_values, 
    text, belated, status, language, created_by
) VALUES
    (
        'wish_external_de_1',
        'normal',
        'birthday',
        ARRAY['friend', 'family']::relation[],
        ARRAY['young', 'middle']::age_group[],
        ARRAY[18, 21, 25, 30],
        'Alles Gute zum Geburtstag, liebe(r) [Name]! Du wirst heute [Age] Jahre alt - möge dieses neue Lebensjahr voller Freude und Erfolg sein.',
        'Nachträglich alles Gute zum Geburtstag, [Name]! Ich hoffe, du hattest einen wunderschönen Tag und bist gut ins neue Lebensjahr gestartet.',
        'Freigegeben',
        'de',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'wish_external_en_1',
        'normal',
        'birthday',
        ARRAY['friend', 'family']::relation[],
        ARRAY['all']::age_group[],
        ARRAY[16, 18, 21, 30, 40, 50],
        'Happy Birthday [Name]! Wishing you a fantastic [Age]th birthday filled with joy, laughter, and wonderful memories.',
        'Belated Happy Birthday [Name]! Hope your [Age]th birthday was absolutely amazing and filled with love.',
        'Freigegeben',
        'en',
        '550e8400-e29b-41d4-a716-446655440000'
    );
*/

-- =======================
-- DEPLOYMENT COMPLETE
-- =======================
-- 
-- Next steps:
-- 1. Verify all tables and functions were created successfully
-- 2. Test RLS policies with different user roles
-- 3. Create your first user accounts via Supabase Auth
-- 4. Test the wish creation and approval workflow
-- 
-- For local development, uncomment the seed data section above
-- =======================