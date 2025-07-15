# Manuelle Similarity-Triggers - Anleitung

## Ja, du kannst den Prozess manuell triggern! 🎯

Es gibt mehrere Wege, die Similarity-Vorberechnung manuell zu starten:

## 1. GitHub Actions (Empfohlen)

### Über GitHub Web-Interface:

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf `Actions` Tab
3. Wähle `Similarity Precomputation Cron` Workflow
4. Klicke `Run workflow` → `Run workflow`

### Über GitHub CLI:

```bash
# Workflow manuell starten
gh workflow run similarity-cron.yml

# Status in Echtzeit verfolgen
gh run watch

# Alle Runs anzeigen
gh run list --workflow=similarity-cron.yml

# Logs des letzten Runs
gh run view --log
```

## 2. Direkter API-Aufruf

### Lokal (Development):

```bash
# Grundlegender Aufruf
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
  http://localhost:5173/api/similarity/cron

# Mit detailliertem Output
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "batch_size": 50,
    "force_rebuild": false
  }' \
  http://localhost:5173/api/similarity/cron
```

### Production (Cloudflare Pages):

```bash
# Ersetze your-app.pages.dev mit deiner Domain
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual"}' \
  https://your-app.pages.dev/api/similarity/cron

# Health-Check vorher
curl -X GET \
  -H "Authorization: Bearer your-secret-key" \
  https://your-app.pages.dev/api/similarity/cron
```

## 3. Browser-basierter Trigger

### JavaScript in Browser-Console:

```javascript
// Für lokale Entwicklung
async function triggerSimilarityPrecomputation() {
	const response = await fetch('/api/similarity/cron', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer your-secret-key',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			source: 'browser-manual',
			timestamp: new Date().toISOString()
		})
	});

	const result = await response.json();
	console.log('Similarity precomputation result:', result);
	return result;
}

// Ausführen
triggerSimilarityPrecomputation();
```

### Bookmarklet (für einfache Nutzung):

```javascript
// Als Bookmark speichern:
javascript: (function () {
	fetch('/api/similarity/cron', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer your-secret-key',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ source: 'bookmarklet' })
	})
		.then((r) => r.json())
		.then((data) => alert('Similarity job: ' + (data.success ? 'SUCCESS' : 'FAILED')))
		.catch((e) => alert('Error: ' + e));
})();
```

## 4. Admin-Panel Integration

### Svelte-Component für Admin-Dashboard:

```svelte
<!-- src/lib/components/admin/SimilarityControls.svelte -->
<script lang="ts">
	let isRunning = false;
	let lastResult: any = null;
	let error: string | null = null;

	async function triggerSimilarity() {
		isRunning = true;
		error = null;

		try {
			const response = await fetch('/api/similarity/cron', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${import.meta.env.VITE_CRON_SECRET}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					source: 'admin-panel',
					timestamp: new Date().toISOString()
				})
			});

			lastResult = await response.json();

			if (!response.ok) {
				throw new Error(lastResult.error || 'Unknown error');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			isRunning = false;
		}
	}

	async function checkHealth() {
		try {
			const response = await fetch('/api/similarity/cron', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${import.meta.env.VITE_CRON_SECRET}`
				}
			});

			const health = await response.json();
			console.log('Health status:', health);
			return health;
		} catch (err) {
			console.error('Health check failed:', err);
		}
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Similarity Precomputation</h2>

		<div class="stats stats-vertical lg:stats-horizontal">
			<div class="stat">
				<div class="stat-title">Status</div>
				<div class="stat-value text-sm">
					{isRunning ? 'Running...' : 'Ready'}
				</div>
			</div>

			{#if lastResult}
				<div class="stat">
					<div class="stat-title">Last Run</div>
					<div class="stat-value text-sm">
						{lastResult.processed || 0} processed
					</div>
				</div>
			{/if}
		</div>

		<div class="card-actions justify-end">
			<button class="btn btn-outline btn-sm" onclick={checkHealth}> Health Check </button>

			<button class="btn btn-primary btn-sm" onclick={triggerSimilarity} disabled={isRunning}>
				{isRunning ? 'Running...' : 'Run Precomputation'}
			</button>
		</div>

		{#if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{/if}

		{#if lastResult}
			<div class="alert alert-success">
				<span>
					Processed {lastResult.processed} wishes,
					{lastResult.errors} errors
				</span>
			</div>
		{/if}
	</div>
</div>
```

## 5. Development-Helpers

### NPM Scripts für package.json:

```json
{
	"scripts": {
		"similarity:trigger": "curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" -H \"Content-Type: application/json\" -d '{\"source\": \"npm-script\"}' http://localhost:5173/api/similarity/cron",
		"similarity:health": "curl -X GET -H \"Authorization: Bearer $CRON_SECRET\" http://localhost:5173/api/similarity/cron",
		"similarity:prod": "curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" -H \"Content-Type: application/json\" -d '{\"source\": \"npm-script\"}' https://your-app.pages.dev/api/similarity/cron"
	}
}
```

### Verwendung:

```bash
# Lokal triggern
npm run similarity:trigger

# Health-Check
npm run similarity:health

# Production triggern
npm run similarity:prod
```

## 6. Monitoring & Debugging

### Logs in Echtzeit verfolgen:

```bash
# GitHub Actions Logs
gh run watch

# Cloudflare Pages Logs (im Browser)
# Dashboard → Pages → Deine App → Functions → Logs

# Supabase Logs (optional)
# Dashboard → Project → Logs
```

### Status-Checks:

```bash
# Wie viele Wünsche brauchen Updates?
curl -s -X GET \
  -H "Authorization: Bearer your-secret-key" \
  https://your-app.pages.dev/api/similarity/cron | jq '.outdatedWishes'

# Letzte Ausführung
curl -s -X GET \
  -H "Authorization: Bearer your-secret-key" \
  https://your-app.pages.dev/api/similarity/cron | jq '.lastExecution'
```

## 7. Wann solltest du manuell triggern?

### Empfohlene Szenarien:

- **Nach größeren Datenimporten**: Viele neue Wünsche hinzugefügt
- **Nach Algorithmus-Updates**: Similarity-Engine wurde geändert
- **Vor wichtigen Demos**: Stelle sicher, dass alle Similarities aktuell sind
- **Bei Performance-Problemen**: Wenn Live-Berechnungen zu langsam sind
- **Nach Wartung**: Nach Database-Maintenance oder Updates

### Trigger-Strategien:

```bash
# Kleiner Batch (für Testing)
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual", "batch_size": 10}' \
  https://your-app.pages.dev/api/similarity/cron

# Vollständiger Rebuild (bei Algorithmus-Änderungen)
curl -X POST \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual", "force_rebuild": true}' \
  https://your-app.pages.dev/api/similarity/cron
```

## 8. Automatisierung für Entwicklung

### Pre-commit Hook (optional):

```bash
#!/bin/sh
# .git/hooks/pre-commit
if [[ "$1" == "similarity" ]]; then
  echo "🔄 Triggering similarity precomputation..."
  npm run similarity:trigger
fi
```

### VS Code Tasks:

```json
// .vscode/tasks.json
{
	"version": "2.0.0",
	"tasks": [
		{
			"label": "Trigger Similarity Precomputation",
			"type": "shell",
			"command": "npm run similarity:trigger",
			"group": "build",
			"presentation": {
				"echo": true,
				"reveal": "always",
				"focus": false,
				"panel": "shared"
			}
		}
	]
}
```

## Zusammenfassung

**Ja, du kannst den Similarity-Prozess jederzeit manuell triggern!** 🚀

Die einfachsten Methoden sind:

1. **GitHub Actions** (über Web-Interface oder CLI)
2. **Direkter API-Aufruf** (curl oder fetch)
3. **Admin-Panel** (wenn implementiert)

Die automatischen Cron-Jobs sind nur eine Ergänzung - du behältst die volle Kontrolle über wann und wie oft die Similarity-Berechnungen laufen.
