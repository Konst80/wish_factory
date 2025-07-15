-- Migration: Erstelle wish_languages Tabelle für zentrale Sprachverwaltung
-- Ersetzt das hardcoded language enum für Wünsche

-- Erstelle die neue Tabelle für Wunsch-Sprachen
CREATE TABLE IF NOT EXISTS wish_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (length(code) = 2 AND code ~ '^[a-z]{2}$'),
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 50),
    flag TEXT NOT NULL CHECK (length(flag) <= 10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS für wish_languages aktivieren
ALTER TABLE wish_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies für wish_languages
-- Alle können lesen (für Dropdown-Auswahl in der App)
CREATE POLICY "wish_languages_select_policy" ON wish_languages
    FOR SELECT
    USING (true);

-- Nur Administratoren können erstellen, bearbeiten und löschen
CREATE POLICY "wish_languages_admin_policy" ON wish_languages
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id 
            FROM profiles 
            WHERE role = 'Administrator'
        )
    );

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_wish_languages_code ON wish_languages(code);
CREATE INDEX IF NOT EXISTS idx_wish_languages_is_active ON wish_languages(is_active);

-- Seed-Daten für die bestehenden Sprachen
INSERT INTO wish_languages (code, name, flag, is_active) VALUES
    ('de', 'Deutsch', '🇩🇪', true),
    ('en', 'English', '🇬🇧', true);

-- Constraint: Mindestens eine Sprache muss aktiv sein
-- Dies wird über eine Funktion und Trigger sichergestellt
CREATE OR REPLACE FUNCTION ensure_at_least_one_active_language()
RETURNS TRIGGER AS $$
BEGIN
    -- Prüfe bei UPDATE oder DELETE, ob mindestens eine Sprache aktiv bleibt
    IF (TG_OP = 'UPDATE' AND NEW.is_active = false) OR TG_OP = 'DELETE' THEN
        IF (SELECT COUNT(*) FROM wish_languages WHERE is_active = true AND id != COALESCE(OLD.id, NEW.id)) = 0 THEN
            RAISE EXCEPTION 'Mindestens eine Wunsch-Sprache muss aktiv sein';
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für die Constraint-Prüfung
CREATE TRIGGER trigger_ensure_active_language
    BEFORE UPDATE OR DELETE ON wish_languages
    FOR EACH ROW
    EXECUTE FUNCTION ensure_at_least_one_active_language();

-- Füge updated_at Trigger hinzu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wish_languages_updated_at
    BEFORE UPDATE ON wish_languages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();