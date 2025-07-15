# GitHub Actions Setup für Cloudflare Pages

## Voraussetzungen

1. **Repository auf GitHub**: Dein Code muss auf GitHub liegen
2. **Cloudflare Pages**: Deine App muss auf Cloudflare Pages deployed sein
3. **Webhook-Endpoint**: `/api/similarity/cron` muss verfügbar sein

## Setup-Schritte

### 1. GitHub Secrets konfigurieren

```bash
# Im Repository-Verzeichnis ausführen
cd /Users/konstantin/Development/code/svelte/wish_factory

# Secrets setzen (GitHub CLI erforderlich)
gh secret set CRON_SECRET --body "your-super-secret-key-here"
gh secret set CLOUDFLARE_PAGES_URL --body "https://your-app.pages.dev"
```

**Oder über GitHub Web-Interface:**

1. Gehe zu `Settings > Secrets and variables > Actions`
2. Klicke `New repository secret`
3. Füge hinzu:
   - `CRON_SECRET`: Ein starkes Passwort für Webhook-Authentifizierung
   - `CLOUDFLARE_PAGES_URL`: Die URL deiner Cloudflare Pages App

### 2. Environment-Variable in SvelteKit

```bash
# .env.local (lokal)
CRON_SECRET=your-super-secret-key-here

# .env.example (für andere Entwickler)
CRON_SECRET=your-secret-key
```

### 3. Cloudflare Pages Environment Variables

1. Gehe zu Cloudflare Dashboard
2. Wähle deine Pages-App
3. Gehe zu `Settings > Environment variables`
4. Füge hinzu:
   - `CRON_SECRET`: Derselbe Wert wie in GitHub

### 4. Workflow testen

```bash
# Manuell triggern
gh workflow run similarity-cron.yml

# Status überprüfen
gh run list --workflow=similarity-cron.yml

# Logs anzeigen
gh run view --log
```

## Monitoring

### GitHub Actions Logs:

- Gehe zu `Actions` Tab in deinem Repository
- Klicke auf den Workflow-Run
- Überprüfe die Logs für jeden Step

### Cloudflare Pages Logs:

- Gehe zu Cloudflare Dashboard
- Wähle deine Pages-App
- Gehe zu `Functions > Logs`
- Überprüfe die Function-Logs

## Troubleshooting

### Häufige Probleme:

1. **401 Unauthorized**:
   - Prüfe ob `CRON_SECRET` in beiden Systemen gleich ist
   - Prüfe ob Authorization Header korrekt gesetzt ist

2. **404 Not Found**:
   - Prüfe ob `/api/similarity/cron` Endpoint existiert
   - Prüfe ob die URL korrekt ist

3. **500 Internal Server Error**:
   - Prüfe Cloudflare Pages Function-Logs
   - Prüfe ob Supabase-Verbindung funktioniert

4. **Workflow läuft nicht**:
   - Prüfe ob die Cron-Expression korrekt ist
   - GitHub Actions benötigt Repository-Activity

### Debug-Befehle:

```bash
# Teste Webhook lokal
curl -X POST \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  http://localhost:5173/api/similarity/cron

# Teste Health-Check
curl -X GET \
  -H "Authorization: Bearer your-secret" \
  https://your-app.pages.dev/api/similarity/cron
```

## Erweiterte Konfiguration

### Mehrere Cron-Schedules:

```yaml
on:
  schedule:
    - cron: '0 2 * * *' # Täglich 2 Uhr
    - cron: '0 14 * * *' # Täglich 14 Uhr
    - cron: '0 3 * * 0' # Sonntag 3 Uhr (wöchentlich)
```

### Conditional Execution:

```yaml
- name: Run only on weekdays
  if: github.event.schedule == '0 2 * * 1-5'
  run: echo "Weekday execution"
```

### Notification Setup:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{"text": "Similarity cron job failed!"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Performance-Optimierung

### Batch-Verarbeitung:

- Limitiere auf 50 Wünsche pro Lauf
- Verwende Pagination für große Datenmengen
- Implementiere Timeout-Handling

### Fehlerbehandlung:

- Retry-Mechanismus für transiente Fehler
- Exponential Backoff bei Rate-Limiting
- Graceful Degradation bei Teilfehlern

## Kosten

### GitHub Actions (Free Tier):

- ✅ 2.000 Minuten/Monat kostenlos
- ✅ Private Repositories unterstützt
- ✅ Public Repositories: Unbegrenzt

### Cloudflare Pages (Free Tier):

- ✅ 100.000 Requests/Tag
- ✅ 500 Builds/Monat
- ✅ Custom Domains

**Geschätzte Nutzung:**

- 1 Cron-Job/Tag = 30 Requests/Monat
- ~2 Minuten Ausführungszeit/Monat
- Weit unter allen Limits!
