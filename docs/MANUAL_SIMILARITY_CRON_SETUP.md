# Manual Similarity Cron Setup - Implementation Guide

## Überblick

Das System implementiert einen **manuellen Similarity Cron-Job** mit einer Admin-Interface und optionaler GitHub Actions-Integration. Dies bietet die perfekte Balance zwischen Kontrolle und Automatisierung.

## Implementierte Komponenten

### 1. Admin-Interface (`SimilarityCronControl.svelte`)

**Features:**

- ✅ **Manueller Trigger** - Direkter Start über Button
- ✅ **Live-Statistiken** - Echtzeitüberwachung der Similarity-Abdeckung
- ✅ **Execution-Logs** - Detaillierte Ausgabe des Verarbeitungsfortschritts
- ✅ **GitHub Actions Setup** - Integrierte Anleitung für Automatisierung
- ✅ **Health-Monitoring** - Überwachung verwaister Wünsche

**Darstellung:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Similarity Cron Job Control                                    │
├─────────────────────────────────────────────────────────────────┤
│ Status: [Enabled]  Orphaned: [5]  Success Rate: [95.2%]       │
│ Last Execution: [2024-01-15 02:00:00]                         │
├─────────────────────────────────────────────────────────────────┤
│ [Run Manual Cron] [Refresh Stats] [Show Logs] [GitHub Setup]  │
├─────────────────────────────────────────────────────────────────┤
│ Recommendations:                                               │
│ ⚠️  5 wishes need processing - consider running manual cron    │
│ 💡 Set up GitHub Actions for automatic daily processing       │
└─────────────────────────────────────────────────────────────────┘
```

### 2. API-Endpoints

#### **POST /api/admin/similarity-cron**

- **Zweck**: Manueller Cron-Job Trigger
- **Authentifizierung**: Admin-only
- **Parameter**: `batchSize`, `forceRebuild`, `source`
- **Response**: Verarbeitungsstatus und Statistiken

#### **GET /api/admin/similarity-cron**

- **Zweck**: Health-Check und Statistiken
- **Response**: Systemstatus und Empfehlungen

#### **GET /api/admin/similarity-stats**

- **Zweck**: Live-Statistiken für UI-Updates
- **Response**: Aktuelle Similarity-Abdeckung

### 3. GitHub Actions-Integration

**Workflow:** `.github/workflows/similarity-cron.yml`

- **Trigger**: Täglich um 2 Uhr oder manuell
- **Target**: `/api/admin/similarity-cron`
- **Authentifizierung**: Über GitHub Secrets

## Setup-Anleitung

### **Schritt 1: Admin-Route hinzufügen**

```typescript
// src/routes/dashboard/admin/+page.svelte
<script lang="ts">
  import SimilarityCronControl from '$lib/components/admin/SimilarityCronControl.svelte';
  // ... weitere Imports
</script>

<SimilarityCronControl
  isEnabled={data.similarityCron.isEnabled}
  orphanedWishes={data.similarityCron.orphanedWishes}
  lastExecution={data.similarityCron.lastExecution}
  githubActionsConfigured={data.similarityCron.githubActionsConfigured}
  stats={data.similarityCron.stats}
/>
```

### **Schritt 2: Navigation erweitern**

```svelte
<!-- Hauptnavigation -->
{#if user.role === 'Administrator'}
	<a href="/dashboard/admin" class="btn btn-ghost"> Admin Dashboard </a>
{/if}
```

### **Schritt 3: Permissions einrichten**

```typescript
// Admin-Layout mit Zugriffskontrolle
export const load: LayoutServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!profile || profile.role !== 'Administrator') {
		throw redirect(302, '/dashboard/wishes');
	}
};
```

## Nutzung

### **Manueller Betrieb**

1. **Admin-Dashboard aufrufen**: `/dashboard/admin`
2. **Statistiken prüfen**: Anzahl verwaister Wünsche
3. **Cron-Job starten**: Button "Run Manual Cron" klicken
4. **Logs verfolgen**: Execution-Logs in Echtzeit ansehen
5. **Ergebnis prüfen**: Statistiken werden automatisch aktualisiert

### **Automatisierung mit GitHub Actions**

#### **Setup (einmalig):**

```bash
# GitHub Secrets konfigurieren
gh secret set CRON_SECRET --body "your-super-secret-key"
gh secret set CLOUDFLARE_PAGES_URL --body "https://your-app.pages.dev"

# Environment-Variable in Cloudflare Pages
CRON_SECRET=your-super-secret-key
GITHUB_ACTIONS_CONFIGURED=true
```

#### **Workflow aktivieren:**

```bash
# Workflow manuell testen
gh workflow run similarity-cron.yml

# Status prüfen
gh run list --workflow=similarity-cron.yml

# Logs anzeigen
gh run view --log
```

## Monitoring & Debugging

### **Dashboard-Metriken:**

- **Orphaned Wishes**: Anzahl Wünsche ohne Similarities
- **Success Rate**: Prozentsatz verarbeiteter Wünsche
- **Last Execution**: Zeitpunkt der letzten Ausführung
- **Processing Time**: Dauer der letzten Verarbeitung

### **Logs-Analyse:**

```
[14:30:25] 🔄 Starting manual similarity cron job...
[14:30:25] 📊 Found 5 wishes needing similarity updates
[14:30:26] 🔍 Processing wish wish-001...
[14:30:30] ✅ Processed wish wish-001 (1/5)
[14:30:34] ✅ Processed wish wish-002 (2/5)
[14:30:38] 🎉 Cron job completed: 5 processed, 0 errors, 12500ms
```

### **Fehlerbehebung:**

```typescript
// Häufige Probleme und Lösungen:
const troubleshooting = {
	'No orphaned wishes found': 'System ist bereits aktuell',
	'Timeout during processing': 'Batch-Größe reduzieren',
	'Authentication failed': 'CRON_SECRET prüfen',
	'Database connection error': 'Supabase-Verbindung prüfen'
};
```

## Konfiguration

### **Batch-Größe anpassen:**

```typescript
// Standardkonfiguration
const config = {
	batchSize: 50, // Wünsche pro Lauf
	forceRebuild: false, // Vollständige Neuberechnung
	timeout: 300000, // 5 Minuten Timeout
	cleanup: true // Alte Einträge bereinigen
};
```

### **Cron-Schedule anpassen:**

```yaml
# .github/workflows/similarity-cron.yml
on:
  schedule:
    - cron: '0 2 * * *' # Täglich 2 Uhr
    - cron: '0 14 * * *' # Zusätzlich 14 Uhr
    - cron: '0 3 * * 0' # Wöchentlich Sonntag 3 Uhr
```

## Erweiterte Features

### **Force Rebuild:**

```typescript
// Vollständige Neuberechnung (z.B. nach Algorithmus-Update)
const forceRebuild = {
	description: 'Löscht alle Similarities und berechnet neu',
	useCase: 'Nach Algorithmus-Updates oder Inkonsistenzen',
	trigger: 'Checkbox im Admin-Interface',
	impact: 'Längere Verarbeitungszeit'
};
```

### **Batch-Verarbeitung:**

```typescript
// Intelligente Batch-Größe basierend auf Systemlast
const adaptiveBatch = {
	small: 25, // Bei hoher Server-Last
	medium: 50, // Standard
	large: 100, // Bei niedriger Server-Last
	autoDetect: true // Automatische Anpassung
};
```

### **Monitoring-Integration:**

```typescript
// Metriken für externe Monitoring-Systeme
const metrics = {
	orphanedWishesCount: orphanedWishes.length,
	successRate: stats.successRate,
	lastExecutionTime: lastExecution,
	averageProcessingTime: duration / processed,
	errorRate: errors / total
};
```

## Best Practices

### **Wann manuell triggern:**

1. **Nach Datenimporten**: Viele neue Wünsche hinzugefügt
2. **Nach Algorithmus-Updates**: Similarity-Engine geändert
3. **Bei Performance-Problemen**: Zu viele Live-Berechnungen
4. **Vor wichtigen Präsentationen**: Alle Daten aktuell halten

### **Monitoring-Empfehlungen:**

1. **Täglich prüfen**: Anzahl verwaister Wünsche
2. **Wöchentlich analysieren**: Success Rate und Trends
3. **Alert einrichten**: Bei >10 verwaisten Wünschen
4. **Logs überwachen**: Fehlerpattern identifizieren

### **Performance-Optimierung:**

1. **Batch-Größe anpassen**: Je nach Server-Kapazität
2. **Timing optimieren**: Außerhalb der Hauptnutzungszeiten
3. **Cleanup regelmäßig**: Alte Similarity-Einträge bereinigen
4. **Monitoring**: Execution-Zeit überwachen

## Fazit

Das manuelle Similarity Cron-System bietet:

### **Vorteile:**

- ✅ **Volle Kontrolle** über Timing und Ausführung
- ✅ **Transparenz** durch detaillierte Logs und Statistiken
- ✅ **Flexibilität** zwischen manuell und automatisiert
- ✅ **Skalierbarkeit** durch anpassbare Batch-Größen
- ✅ **Monitoring** mit Echtzeit-Feedback

### **Optionale Automatisierung:**

- 🔄 **GitHub Actions** für tägliche Ausführung
- 📊 **Intelligent Scheduling** basierend auf Systemlast
- 🔔 **Alerting** bei Problemen oder hoher Anzahl verwaister Wünsche

**Das System ist perfekt für Administratoren, die Kontrolle behalten möchten, aber trotzdem die Option zur Automatisierung haben! 🚀**
