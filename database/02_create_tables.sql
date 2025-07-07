-- Erstelle Tabellen für die Wish-Factory Anwendung
-- Basierend auf FRS-Spezifikation und TypeScript-Interfaces

-- User Profiles Tabelle (erweitert Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
    role user_role NOT NULL DEFAULT 'Redakteur',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS für Profiles aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Wishes Tabelle (Haupttabelle der Anwendung)
CREATE TABLE IF NOT EXISTS wishes (
    -- Eindeutige ID im Format: wish_external_{sprache}_{laufende_nummer}
    id TEXT PRIMARY KEY CHECK (id ~ '^wish_external_(de|en)_\d+$'),
    
    -- Wish-Eigenschaften basierend auf FRS
    type wish_type NOT NULL,
    event_type event_type NOT NULL,
    relations relation[] NOT NULL CHECK (array_length(relations, 1) > 0),
    age_groups age_group[] NOT NULL CHECK (array_length(age_groups, 1) > 0),
    specific_values INTEGER[] NOT NULL DEFAULT '{}' CHECK (
        CASE 
            WHEN specific_values IS NULL THEN true
            WHEN array_length(specific_values, 1) IS NULL THEN true
            ELSE array_length(specific_values, 1) = (
                SELECT COUNT(*) 
                FROM unnest(specific_values) AS val 
                WHERE val > 0
            )
        END
    ),
    
    -- Texte mit Platzhaltern
    text TEXT NOT NULL CHECK (length(text) >= 10 AND length(text) <= 1000),
    belated TEXT NOT NULL CHECK (length(belated) >= 10 AND length(belated) <= 1000),
    
    -- Status und Sprache
    status wish_status NOT NULL DEFAULT 'Entwurf',
    language language NOT NULL,
    
    -- Metadaten
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    
    -- Unique constraint für ID-Generierung pro Sprache
    UNIQUE (language, created_at)
);

-- RLS für Wishes aktivieren
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_language ON wishes(language);
CREATE INDEX IF NOT EXISTS idx_wishes_event_type ON wishes(event_type);
CREATE INDEX IF NOT EXISTS idx_wishes_created_by ON wishes(created_by);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at);
CREATE INDEX IF NOT EXISTS idx_wishes_relations ON wishes USING GIN(relations);
CREATE INDEX IF NOT EXISTS idx_wishes_age_groups ON wishes USING GIN(age_groups);

-- Volltext-Suche Index für text und belated
CREATE INDEX IF NOT EXISTS idx_wishes_text_search ON wishes USING GIN(to_tsvector('german', text || ' ' || belated));

-- Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);