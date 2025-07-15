# Supabase Edge Functions

## Similarity Cron Job

### Deployment

```bash
# Function deployen
supabase functions deploy similarity-cron

# Cron-Schedule aktivieren
supabase functions schedule similarity-cron --cron-yaml ./supabase/functions/similarity-cron/cron.yaml

# Status überprüfen
supabase functions list
```

### Manueller Test

```bash
# Lokal testen
supabase functions serve similarity-cron

# Remote testen
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/similarity-cron
```

### Monitoring

```bash
# Logs anzeigen
supabase functions logs similarity-cron

# Cron-Status überprüfen
supabase functions schedule list
```

### Environment Variables

Benötigte Environment Variables in Supabase:

- `SUPABASE_URL`: Automatisch verfügbar
- `SUPABASE_SERVICE_ROLE_KEY`: Automatisch verfügbar
- `CRON_SECRET`: Optional für Webhook-Authentifizierung

### Konfiguration

Die Cron-Jobs laufen:

- **Täglich um 2 Uhr**: Inkrementelle Similarity-Updates
- **Wöchentlich Sonntag 3 Uhr**: Vollständige Neuberechnung

### Funktionsweise

1. **Outdated Wishes Detection**: Findet Wünsche ohne aktuelle Similarity-Berechnungen
2. **Batch Processing**: Verarbeitet max. 100 Wünsche pro Lauf
3. **Similarity Calculation**: Berechnet einfache Jaccard-Similarity
4. **Database Update**: Speichert Ergebnisse in `wish_similarities` Tabelle
5. **Timestamp Update**: Aktualisiert `similarity_updated_at` für verarbeitete Wünsche

### Performance

- **Memory**: ~50MB pro Batch
- **Execution Time**: ~5-10 Sekunden pro 100 Wünsche
- **Database Impact**: Minimale Last durch Batch-Verarbeitung
