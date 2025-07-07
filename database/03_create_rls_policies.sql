-- Row Level Security Policies für Wish-Factory
-- Basierend auf FRS-Rollen-Berechtigungen

-- =======================
-- PROFILES RLS POLICIES
-- =======================

-- Benutzer können ihr eigenes Profil lesen
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Benutzer können ihr eigenes Profil aktualisieren (außer Rolle)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Administratoren können alle Profile lesen
CREATE POLICY "Administrators can read all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
);

-- Administratoren können Rollen verwalten
CREATE POLICY "Administrators can manage user roles"
ON profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
);

-- Neue Profile werden automatisch bei Registrierung erstellt (via Trigger)
CREATE POLICY "Enable insert for service role"
ON profiles FOR INSERT
WITH CHECK (true);

-- =======================
-- WISHES RLS POLICIES
-- =======================

-- Alle authentifizierten Benutzer können Wishes lesen
-- (Filterung nach Status erfolgt in der Anwendungslogik)
CREATE POLICY "Authenticated users can read wishes"
ON wishes FOR SELECT
USING (auth.role() = 'authenticated');

-- Redakteure können Wishes erstellen
CREATE POLICY "Redakteure can create wishes"
ON wishes FOR INSERT
WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('Redakteur', 'Administrator')
    )
);

-- Benutzer können ihre eigenen Wishes bearbeiten (Redakteure)
CREATE POLICY "Users can update own wishes"
ON wishes FOR UPDATE
USING (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('Redakteur', 'Administrator')
    )
)
WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('Redakteur', 'Administrator')
    )
);

-- Administratoren können alle Wishes bearbeiten
CREATE POLICY "Administrators can update all wishes"
ON wishes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
);

-- Administratoren können Wishes löschen (Archivierung bevorzugt)
CREATE POLICY "Administrators can delete wishes"
ON wishes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'Administrator'
    )
);

-- =======================
-- ÖFFENTLICHE API POLICY
-- =======================

-- Öffentlicher Zugriff auf freigegebene Wishes (für externe API)
-- Diese Policy wird für den Service Role Key verwendet
CREATE POLICY "Public access to approved wishes"
ON wishes FOR SELECT
USING (
    status = 'Freigegeben'
    OR auth.role() = 'service_role'
);