-- Migration: Similarity Caching Database Schema
-- Erstellt Tabellen und Indizes für das Caching von Ähnlichkeitsberechnungen

-- Tabelle für vorberechnete Ähnlichkeiten zwischen Wünschen
CREATE TABLE IF NOT EXISTS wish_similarities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wish_id_1 TEXT NOT NULL,
    wish_id_2 TEXT NOT NULL,
    cosine_similarity FLOAT NOT NULL DEFAULT 0,
    jaccard_similarity FLOAT NOT NULL DEFAULT 0,
    levenshtein_similarity FLOAT NOT NULL DEFAULT 0,
    tfidf_similarity FLOAT NOT NULL DEFAULT 0,
    overall_similarity FLOAT NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wish_id_1, wish_id_2),
    FOREIGN KEY (wish_id_1) REFERENCES wishes(id) ON DELETE CASCADE,
    FOREIGN KEY (wish_id_2) REFERENCES wishes(id) ON DELETE CASCADE,
    CONSTRAINT check_different_wishes CHECK (wish_id_1 != wish_id_2),
    CONSTRAINT check_similarity_range CHECK (
        cosine_similarity >= 0 AND cosine_similarity <= 1 AND
        jaccard_similarity >= 0 AND jaccard_similarity <= 1 AND
        levenshtein_similarity >= 0 AND levenshtein_similarity <= 1 AND
        tfidf_similarity >= 0 AND tfidf_similarity <= 1 AND
        overall_similarity >= 0 AND overall_similarity <= 1
    )
);

-- Erweitere wishes-Tabelle um Similarity-Metadaten
ALTER TABLE wishes 
ADD COLUMN IF NOT EXISTS similarity_hash TEXT,
ADD COLUMN IF NOT EXISTS similarity_vectors JSONB,
ADD COLUMN IF NOT EXISTS similarity_updated_at TIMESTAMP WITH TIME ZONE;

-- Indizes für Performance-Optimierung
CREATE INDEX IF NOT EXISTS idx_wish_similarities_wish1 ON wish_similarities(wish_id_1);
CREATE INDEX IF NOT EXISTS idx_wish_similarities_wish2 ON wish_similarities(wish_id_2);
CREATE INDEX IF NOT EXISTS idx_wish_similarities_overall ON wish_similarities(overall_similarity DESC);
CREATE INDEX IF NOT EXISTS idx_wish_similarities_calculated_at ON wish_similarities(calculated_at);
CREATE INDEX IF NOT EXISTS idx_wishes_similarity_hash ON wishes(similarity_hash);
CREATE INDEX IF NOT EXISTS idx_wishes_similarity_updated_at ON wishes(similarity_updated_at);

-- Composite Index für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_wish_similarities_lookup ON wish_similarities(wish_id_1, overall_similarity DESC);
CREATE INDEX IF NOT EXISTS idx_wish_similarities_lookup_reverse ON wish_similarities(wish_id_2, overall_similarity DESC);

-- Funktion zur automatischen Aktualisierung der similarity_updated_at
CREATE OR REPLACE FUNCTION update_similarity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.similarity_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatische Zeitstempel-Updates
CREATE TRIGGER IF NOT EXISTS trigger_update_similarity_timestamp
    BEFORE UPDATE ON wishes
    FOR EACH ROW
    WHEN (OLD.text IS DISTINCT FROM NEW.text OR OLD.type IS DISTINCT FROM NEW.type OR OLD.event_type IS DISTINCT FROM NEW.event_type)
    EXECUTE FUNCTION update_similarity_timestamp();

-- Bereinigungsfunktion für veraltete Ähnlichkeiten
CREATE OR REPLACE FUNCTION cleanup_stale_similarities(days_threshold INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM wish_similarities 
    WHERE calculated_at < NOW() - INTERVAL '1 day' * days_threshold;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Statistik-View für Monitoring
CREATE OR REPLACE VIEW similarity_stats AS
SELECT 
    (SELECT COUNT(*) FROM wishes) as total_wishes,
    (SELECT COUNT(*) FROM wish_similarities) as total_similarities,
    (SELECT COUNT(*) FROM wish_similarities WHERE calculated_at > NOW() - INTERVAL '24 hours') as recent_similarities,
    (SELECT COUNT(*) FROM wish_similarities WHERE calculated_at < NOW() - INTERVAL '7 days') as stale_similarities,
    (SELECT AVG(overall_similarity) FROM wish_similarities) as avg_similarity,
    (SELECT MAX(overall_similarity) FROM wish_similarities) as max_similarity,
    (SELECT COUNT(*) FROM wish_similarities WHERE overall_similarity >= 0.9) as high_similarities,
    (SELECT COUNT(*) FROM wish_similarities WHERE overall_similarity >= 0.6) as medium_similarities;

-- Kommentare für Dokumentation
COMMENT ON TABLE wish_similarities IS 'Caching-Tabelle für vorberechnete Ähnlichkeiten zwischen Wünschen';
COMMENT ON COLUMN wish_similarities.overall_similarity IS 'Höchster Ähnlichkeitswert aller Algorithmen';
COMMENT ON COLUMN wishes.similarity_hash IS 'MD5-Hash des normalisierten Wunschtextes für schnelle Duplikatserkennung';
COMMENT ON COLUMN wishes.similarity_vectors IS 'JSON-Feld für vorberechnete Ähnlichkeitsvektoren';
COMMENT ON VIEW similarity_stats IS 'Statistik-View für Monitoring der Ähnlichkeits-Performance';

-- Initiale Daten-Migration (falls erforderlich)
-- UPDATE wishes SET similarity_updated_at = NOW() WHERE similarity_updated_at IS NULL;