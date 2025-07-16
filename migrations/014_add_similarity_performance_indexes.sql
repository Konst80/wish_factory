-- Migration: Add performance indexes for similarity batch operations
-- Optimiert die Abfrage-Performance für die Ähnlichkeitsanalyse

-- Composite index für die Batch-Abfrage der gecachten Ähnlichkeiten
-- Dieser Index optimiert die OR-Abfrage in getCachedSimilarityResults
CREATE INDEX IF NOT EXISTS idx_wish_similarities_batch_lookup 
ON wish_similarities(wish_id_1, wish_id_2, overall_similarity DESC);

-- Index für threshold-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_wish_similarities_threshold 
ON wish_similarities(overall_similarity DESC, calculated_at DESC) 
WHERE overall_similarity >= 0.7;

-- Partial index für aktuelle Ähnlichkeiten (weniger als 7 Tage alt)
CREATE INDEX IF NOT EXISTS idx_wish_similarities_recent 
ON wish_similarities(wish_id_1, wish_id_2, overall_similarity DESC) 
WHERE calculated_at > NOW() - INTERVAL '7 days';

-- Index für die Wunsch-Abfrage mit Sprachfilter
CREATE INDEX IF NOT EXISTS idx_wishes_language_status 
ON wishes(language, status) 
WHERE status IN ('Freigegeben', 'Entwurf', 'Zur Freigabe');

-- Index für Join-Operationen zwischen wishes und wish_similarities
CREATE INDEX IF NOT EXISTS idx_wishes_join_optimization 
ON wishes(id, text, type, event_type, language, status, relations, age_groups, created_at)
WHERE status IN ('Freigegeben', 'Entwurf', 'Zur Freigabe');

-- Statistiken für Query Planner aktualisieren
ANALYZE wish_similarities;
ANALYZE wishes;