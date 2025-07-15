# Cron-Lösungen für Cloudflare Pages

## Problem

Cloudflare Pages unterstützt keine nativen Cron Jobs oder Background-Prozesse.

## Lösungsansätze

### 1. GitHub Actions → Cloudflare Pages (✅ Empfohlen)

**Funktionsweise:**

- GitHub Actions läuft auf GitHub-Servern (kostenlos)
- Ruft Webhook auf deiner Cloudflare Pages App auf
- Deine SvelteKit-App verarbeitet die Anfrage

**Vorteile:**

- ✅ 100% kostenlos
- ✅ Zuverlässig
- ✅ Einfache Konfiguration
- ✅ Logging bei GitHub

**Setup:**

```yaml
# .github/workflows/similarity-cron.yml
name: Similarity Cron
on:
  schedule:
    - cron: '0 2 * * *' # Täglich 2 Uhr
jobs:
  trigger-similarity:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cloudflare Pages Webhook
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://your-app.pages.dev/api/similarity/cron"
```

### 2. Cloudflare Workers + Pages (💰 Kostenpflichtig)

**Funktionsweise:**

- Cloudflare Worker mit Cron Trigger
- Worker ruft Pages-Endpoint auf
- Pages verarbeitet Similarity-Berechnung

**Kosten:**

- Workers: $5/Monat (nach Free Tier)
- Pages: Kostenlos

**Setup:**

```javascript
// worker.js
export default {
	async scheduled(event, env, ctx) {
		await fetch('https://your-app.pages.dev/api/similarity/cron', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.CRON_SECRET}`
			}
		});
	}
};
```

### 3. Externe Cron-Services (✅ Kostenlos)

**Services:**

- **cron-job.org**: Kostenlos, bis 5 Jobs
- **UptimeRobot**: Kostenlos, 50 Monitors
- **Zapier**: Kostenlos, bis 100 Tasks/Monat

**Beispiel mit cron-job.org:**

1. Account erstellen
2. Cron Job konfigurieren:
   - URL: `https://your-app.pages.dev/api/similarity/cron`
   - Method: POST
   - Headers: `Authorization: Bearer your-secret`
   - Schedule: `0 2 * * *`

### 4. Vercel Cron (Alternative Hosting)

**Wenn du zu Vercel wechseln möchtest:**

```json
// vercel.json
{
	"crons": [
		{
			"path": "/api/similarity/cron",
			"schedule": "0 2 * * *"
		}
	]
}
```

## Empfehlung für dein Setup

### ✅ **GitHub Actions (Beste Option)**

**Warum:**

- Kostenlos und zuverlässig
- Du bleibst bei Cloudflare Pages
- Einfache Konfiguration
- Gute Monitoring-Möglichkeiten

**Einrichtung:**

1. Webhook-Endpoint in SvelteKit erstellen
2. GitHub Action konfigurieren
3. Secrets in GitHub Repository setzen
4. Fertig!

**Konfiguration:**

```bash
# GitHub Secrets setzen
gh secret set CRON_SECRET --body "your-super-secret-key"
gh secret set PAGES_URL --body "https://your-app.pages.dev"
```

## Monitoring & Debugging

### Logs in GitHub Actions:

- Workflow-Logs direkt in GitHub
- Erfolg/Fehler-Status sichtbar
- Manuelle Ausführung möglich

### Logs in Cloudflare Pages:

- Function-Logs in Cloudflare Dashboard
- Real-time Monitoring
- Fehler-Tracking

## Skalierung

### Wenn mehr Performance nötig:

1. **Cloudflare Workers**: Für echte Background-Jobs
2. **Supabase Edge Functions**: Für komplexere Logik
3. **Railway/Render**: Für traditionelle Cron-Jobs

### Batch-Optimierung:

- Verarbeite nur 50 Wünsche pro Lauf
- Implementiere Retry-Mechanismus
- Nutze Exponential Backoff
