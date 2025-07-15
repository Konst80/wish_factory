-- Migration: Aktualisiere Wishes-Tabelle für dynamische Sprachen
-- Ersetzt die language enum column mit einer text column und foreign key

-- Schritt 1: Temporäre Spalte für neue Sprach-Referenz hinzufügen
ALTER TABLE wishes ADD COLUMN language_id UUID;

-- Schritt 2: Bestehende Sprach-Codes zu IDs mappen
UPDATE wishes 
SET language_id = (
    SELECT id 
    FROM wish_languages 
    WHERE wish_languages.code = wishes.language::text
);

-- Schritt 3: Prüfen ob alle Wishes erfolgreich gemappt wurden
-- Falls nicht, setze auf erste verfügbare Sprache
UPDATE wishes 
SET language_id = (
    SELECT id 
    FROM wish_languages 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE language_id IS NULL;

-- Schritt 4: Foreign Key Constraint hinzufügen
ALTER TABLE wishes 
ADD CONSTRAINT fk_wishes_language 
FOREIGN KEY (language_id) REFERENCES wish_languages(id);

-- Schritt 5: NOT NULL Constraint hinzufügen
ALTER TABLE wishes ALTER COLUMN language_id SET NOT NULL;

-- Schritt 6: Alte language Spalte entfernen
ALTER TABLE wishes DROP COLUMN language;

-- Schritt 7: Neue Spalte umbenennen
ALTER TABLE wishes RENAME COLUMN language_id TO language;

-- Schritt 8: Index für die neue Spalte hinzufügen
CREATE INDEX IF NOT EXISTS idx_wishes_language_new ON wishes(language);

-- Schritt 9: Check Constraint für ID-Format anpassen
-- Entferne den alten Constraint
ALTER TABLE wishes DROP CONSTRAINT IF EXISTS wishes_id_check;

-- Neuer flexibler Constraint (unterstützt alle Sprach-Codes)
ALTER TABLE wishes ADD CONSTRAINT wishes_id_check 
CHECK (id ~ '^wish_external_[a-z]{2}_\d+$');

-- Schritt 10: Unique Constraint für ID-Generierung anpassen
-- Entferne den alten Constraint
ALTER TABLE wishes DROP CONSTRAINT IF EXISTS wishes_language_created_at_key;

-- Neuer Constraint mit UUID-Referenz
ALTER TABLE wishes ADD CONSTRAINT wishes_language_created_at_key 
UNIQUE (language, created_at);

-- Schritt 11: Update für die ID-Generierung (falls verwendet)
-- Erstelle eine Funktion zur automatischen ID-Generierung
CREATE OR REPLACE FUNCTION generate_wish_id(language_code TEXT)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Hole die nächste Nummer für diese Sprache
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(id FROM 'wish_external_' || language_code || '_(\d+)$') 
            AS INTEGER
        )
    ), 0) + 1
    INTO next_num
    FROM wishes w
    JOIN wish_languages wl ON w.language = wl.id
    WHERE wl.code = language_code;
    
    RETURN 'wish_external_' || language_code || '_' || next_num;
END;
$$ LANGUAGE plpgsql;

-- Schritt 12: Trigger für automatische ID-Generierung (falls gewünscht)
CREATE OR REPLACE FUNCTION set_wish_id()
RETURNS TRIGGER AS $$
DECLARE
    lang_code TEXT;
BEGIN
    -- Hole den Sprach-Code
    SELECT code INTO lang_code
    FROM wish_languages
    WHERE id = NEW.language;
    
    -- Setze die ID nur wenn sie noch nicht gesetzt ist
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id = generate_wish_id(lang_code);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aktiviere den Trigger (optional)
-- CREATE TRIGGER trigger_set_wish_id
--     BEFORE INSERT ON wishes
--     FOR EACH ROW
--     EXECUTE FUNCTION set_wish_id();

-- Schritt 13: View für backward compatibility (optional)
CREATE OR REPLACE VIEW wishes_with_language_code AS
SELECT 
    w.*,
    wl.code as language_code,
    wl.name as language_name,
    wl.flag as language_flag
FROM wishes w
JOIN wish_languages wl ON w.language = wl.id;

-- Kommentar für Dokumentation
COMMENT ON TABLE wishes IS 'Wishes table with dynamic language support via wish_languages table';
COMMENT ON COLUMN wishes.language IS 'References wish_languages.id for flexible language management';
COMMENT ON VIEW wishes_with_language_code IS 'Backward compatibility view showing language codes alongside wishes';