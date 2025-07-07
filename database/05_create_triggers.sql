-- Trigger für automatisierte Datenbankoperationen

-- =======================
-- PROFILE TRIGGERS
-- =======================

-- Trigger für automatische Profilerstellung bei Benutzerregistrierung
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- Trigger für automatische Timestamp-Aktualisierung bei Profil-Updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- WISHES TRIGGERS
-- =======================

-- Trigger für automatische Timestamp-Aktualisierung bei Wish-Updates
CREATE TRIGGER update_wishes_updated_at
    BEFORE UPDATE ON wishes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für Status-Validierung bei Wish-Changes
CREATE TRIGGER validate_wish_status_trigger
    BEFORE UPDATE ON wishes
    FOR EACH ROW
    EXECUTE FUNCTION validate_wish_status_change();

-- =======================
-- AUDIT LOGGING (Optional)
-- =======================

-- Erstelle Audit-Log Tabelle für wichtige Änderungen
CREATE TABLE IF NOT EXISTS wish_audit_log (
    id BIGSERIAL PRIMARY KEY,
    wish_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS für Audit Log
ALTER TABLE wish_audit_log ENABLE ROW LEVEL SECURITY;

-- Nur Administratoren können Audit Logs lesen
CREATE POLICY "Administrators can read audit logs"
ON wish_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
);

-- Audit-Trigger Funktion
CREATE OR REPLACE FUNCTION log_wish_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log bei INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO wish_audit_log (wish_id, action, new_values, changed_by)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    
    -- Log bei UPDATE (nur wenn sich relevante Felder ändern)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status OR 
           OLD.text != NEW.text OR 
           OLD.belated != NEW.belated THEN
            INSERT INTO wish_audit_log (wish_id, action, old_values, new_values, changed_by)
            VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        END IF;
        RETURN NEW;
    END IF;
    
    -- Log bei DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO wish_audit_log (wish_id, action, old_values, changed_by)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit Trigger für Wishes
CREATE TRIGGER wish_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON wishes
    FOR EACH ROW
    EXECUTE FUNCTION log_wish_changes();