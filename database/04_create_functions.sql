-- Datenbankfunktionen für Wish-Factory
-- ID-Generierung, Triggers und Hilfsfunktionen

-- =======================
-- WISH ID GENERIERUNG
-- =======================

-- Funktion zur automatischen Generierung der nächsten Wish-ID
CREATE OR REPLACE FUNCTION generate_wish_id(wish_language language)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_id TEXT;
BEGIN
    -- Finde die höchste Nummer für die gegebene Sprache
    SELECT COALESCE(
        MAX(
            CAST(
                substring(id from 'wish_external_' || wish_language::text || '_(\d+)$') 
                AS INTEGER
            )
        ), 
        0
    ) + 1
    INTO next_number
    FROM wishes
    WHERE id ~ ('^wish_external_' || wish_language::text || '_\d+$');
    
    -- Generiere neue ID
    new_id := 'wish_external_' || wish_language::text || '_' || next_number::text;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- STATUS VALIDIERUNG
-- =======================

-- Funktion zur Validierung von Status-Übergängen
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status wish_status,
    new_status wish_status,
    user_role user_role
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Redakteur Berechtigungen
    IF user_role = 'Redakteur' THEN
        -- Kann von Entwurf zu "Zur Freigabe" wechseln
        IF old_status = 'Entwurf' AND new_status = 'Zur Freigabe' THEN
            RETURN TRUE;
        END IF;
        -- Kann von "Zur Freigabe" zurück zu Entwurf wechseln
        IF old_status = 'Zur Freigabe' AND new_status = 'Entwurf' THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Administrator Berechtigungen (kann alle Übergänge)
    IF user_role = 'Administrator' THEN
        CASE old_status
            WHEN 'Entwurf' THEN
                RETURN new_status IN ('Zur Freigabe', 'Archiviert');
            WHEN 'Zur Freigabe' THEN
                RETURN new_status IN ('Entwurf', 'Freigegeben', 'Archiviert');
            WHEN 'Freigegeben' THEN
                RETURN new_status = 'Archiviert';
            WHEN 'Archiviert' THEN
                RETURN new_status = 'Entwurf'; -- Reaktivierung möglich
            ELSE
                RETURN FALSE;
        END CASE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- TRIGGER FUNCTIONS
-- =======================

-- Trigger-Funktion für automatische Profilerstellung bei Benutzerregistrierung
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Neuer Benutzer'),
        'Redakteur'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger-Funktion für automatische Timestamp-Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger-Funktion für Wish Status-Validierung
CREATE OR REPLACE FUNCTION validate_wish_status_change()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Hole die Rolle des aktuellen Benutzers
    SELECT role INTO user_role_val
    FROM profiles
    WHERE id = auth.uid();
    
    -- Bei neuen Wishes ist Status-Validierung nicht nötig
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Validiere Status-Übergang bei Updates
    IF OLD.status != NEW.status THEN
        IF NOT validate_status_transition(OLD.status, NEW.status, user_role_val) THEN
            RAISE EXCEPTION 'Status-Übergang von % zu % ist für Rolle % nicht erlaubt', 
                OLD.status, NEW.status, user_role_val;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- HILFSFUNKTIONEN
-- =======================

-- Funktion für Wish-Suche mit Volltext
CREATE OR REPLACE FUNCTION search_wishes(
    search_query TEXT,
    lang language DEFAULT NULL,
    status_filter wish_status DEFAULT NULL,
    event_filter event_type DEFAULT NULL
)
RETURNS SETOF wishes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM wishes w
    WHERE 
        (search_query IS NULL OR to_tsvector('german', w.text || ' ' || w.belated) @@ plainto_tsquery('german', search_query))
        AND (lang IS NULL OR w.language = lang)
        AND (status_filter IS NULL OR w.status = status_filter)
        AND (event_filter IS NULL OR w.event_type = event_filter)
    ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion zum Abrufen von Wishes mit Filterung (für öffentliche API)
CREATE OR REPLACE FUNCTION get_approved_wishes(
    lang language DEFAULT NULL,
    event_filter event_type DEFAULT NULL,
    relation_filters relation[] DEFAULT NULL,
    age_group_filters age_group[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 100,
    offset_count INTEGER DEFAULT 0
)
RETURNS SETOF wishes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM wishes w
    WHERE 
        w.status = 'Freigegeben'
        AND (lang IS NULL OR w.language = lang)
        AND (event_filter IS NULL OR w.event_type = event_filter)
        AND (relation_filters IS NULL OR w.relations && relation_filters)
        AND (age_group_filters IS NULL OR w.age_groups && age_group_filters)
    ORDER BY w.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;