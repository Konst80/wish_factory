-- Setup pg_cron for similarity precomputation
-- Dokumentation: https://supabase.com/docs/guides/database/extensions/pg_cron

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function für Similarity-Vorberechnung
CREATE OR REPLACE FUNCTION similarity_precompute_batch()
RETURNS TEXT AS $$
DECLARE
    processed_count INTEGER := 0;
    wish_record RECORD;
    other_wish_record RECORD;
    similarity_score DECIMAL;
BEGIN
    -- Lösche alte Similarity-Einträge (älter als 7 Tage)
    DELETE FROM wish_similarities 
    WHERE computed_at < NOW() - INTERVAL '7 days';
    
    -- Verarbeite Wünsche mit veralteten Similarities
    FOR wish_record IN 
        SELECT id, text, type, event_type, language, updated_at
        FROM wishes 
        WHERE status = 'Freigegeben'
          AND (similarity_updated_at IS NULL OR similarity_updated_at < updated_at)
        LIMIT 50 -- Batch-Limit
    LOOP
        -- Lösche alte Similarities für diesen Wunsch
        DELETE FROM wish_similarities 
        WHERE wish_id_1 = wish_record.id OR wish_id_2 = wish_record.id;
        
        -- Berechne Similarities zu anderen Wünschen
        FOR other_wish_record IN 
            SELECT id, text, type, event_type, language
            FROM wishes 
            WHERE id != wish_record.id 
              AND status = 'Freigegeben'
        LOOP
            -- Einfache Similarity-Berechnung (Jaccard-Index)
            SELECT similarity_jaccard_simple(wish_record.text, other_wish_record.text) 
            INTO similarity_score;
            
            -- Speichere nur signifikante Similarities
            IF similarity_score > 0.1 THEN
                INSERT INTO wish_similarities (
                    wish_id_1, wish_id_2, 
                    cosine_similarity, jaccard_similarity, 
                    levenshtein_similarity, tfidf_similarity,
                    overall_similarity, algorithm_used, computed_at
                ) VALUES (
                    wish_record.id, other_wish_record.id,
                    similarity_score, similarity_score,
                    similarity_score * 0.9, similarity_score * 0.8,
                    similarity_score, 'batch_cron', NOW()
                );
            END IF;
        END LOOP;
        
        -- Aktualisiere similarity_updated_at
        UPDATE wishes 
        SET similarity_updated_at = NOW()
        WHERE id = wish_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN format('Processed %s wishes in batch', processed_count);
END;
$$ LANGUAGE plpgsql;

-- Einfache Jaccard-Similarity Funktion
CREATE OR REPLACE FUNCTION similarity_jaccard_simple(text1 TEXT, text2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
    words1 TEXT[];
    words2 TEXT[];
    intersection_count INTEGER;
    union_count INTEGER;
BEGIN
    -- Normalisiere und teile Texte in Wörter
    words1 := string_to_array(lower(regexp_replace(text1, '[^a-zA-Z0-9äöüÄÖÜß\s]', '', 'g')), ' ');
    words2 := string_to_array(lower(regexp_replace(text2, '[^a-zA-Z0-9äöüÄÖÜß\s]', '', 'g')), ' ');
    
    -- Berechne Intersection und Union
    SELECT count(*) INTO intersection_count
    FROM (
        SELECT unnest(words1) 
        INTERSECT 
        SELECT unnest(words2)
    ) AS intersection;
    
    SELECT count(*) INTO union_count
    FROM (
        SELECT unnest(words1) 
        UNION 
        SELECT unnest(words2)
    ) AS union_set;
    
    -- Verhindere Division durch 0
    IF union_count = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN intersection_count::DECIMAL / union_count::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- Cron Job für tägliche Similarity-Vorberechnung (2 Uhr nachts)
SELECT cron.schedule(
    'similarity-precomputation-daily',
    '0 2 * * *',
    'SELECT similarity_precompute_batch();'
);

-- Cron Job für wöchentliche vollständige Neuberechnung (Sonntag 3 Uhr)
SELECT cron.schedule(
    'similarity-cleanup-weekly',
    '0 3 * * 0',
    'TRUNCATE wish_similarities; UPDATE wishes SET similarity_updated_at = NULL;'
);

-- Monitoring-Funktion
CREATE OR REPLACE FUNCTION similarity_cron_status()
RETURNS TABLE(
    job_name TEXT,
    schedule TEXT,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jobname::TEXT,
        schedule::TEXT,
        last_run_started_at,
        next_run_at,
        active
    FROM cron.job
    WHERE jobname LIKE '%similarity%';
END;
$$ LANGUAGE plpgsql;

-- Cleanup-Funktion für alte Cron-Jobs
CREATE OR REPLACE FUNCTION similarity_cleanup_old_jobs()
RETURNS TEXT AS $$
BEGIN
    -- Entferne alle alten Similarity-Cron-Jobs
    DELETE FROM cron.job WHERE jobname LIKE '%similarity%';
    
    RETURN 'Cleaned up old similarity cron jobs';
END;
$$ LANGUAGE plpgsql;