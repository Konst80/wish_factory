# Supabase Dual-Account Setup Guide

## Übersicht

Das Wish Factory Projekt nutzt eine **Dual-Account Strategie** mit zwei separaten Supabase-Instanzen für komplette Isolation zwischen Development und Production.

## Account-Struktur

| Environment     | Account           | Supabase Projekt       | Domain                     |
| --------------- | ----------------- | ---------------------- | -------------------------- |
| **Development** | Aktueller Account | `kgowrcgwzqfeiqitavdc` | `dev.factory.wishsnap.app` |
| **Production**  | Neuer Account     | `TBD`                  | `factory.wishsnap.app`     |

## Vorteile der Dual-Account Strategie

- ✅ **Kostenlos** - 2x Free Tier (50k Rows, 1GB Storage pro Account)
- ✅ **Komplette Isolation** - keine Datenkonflikte zwischen Dev/Prod
- ✅ **Separate Limits** - Development beeinflusst nicht Production
- ✅ **Unabhängige Backups** - getrennte Disaster Recovery
- ✅ **Team Management** - verschiedene Zugriffsrechte möglich
- ✅ **Schema-Experimente** - sichere Tests ohne Prod-Risiko

## Setup-Anleitung

### 1. Production Account erstellen

**Schritt 1: Neuen Supabase Account erstellen**

```bash
# Verwende eine neue E-Mail oder +alias
# z.B. konstantin+prod@example.com
```

1. Besuche [supabase.com](https://supabase.com)
2. "Start your project" mit neuer E-Mail
3. Neues Projekt erstellen: `wish-factory-production`
4. Region wählen: `EU Central (Frankfurt)` (gleich wie Dev)

**Schritt 2: Schema von Development exportieren**

```sql
-- In Development Supabase Dashboard → SQL Editor
-- Alle Tabellen-Definitionen kopieren
-- CREATE TABLE statements sammeln
```

**Schritt 3: Schema in Production importieren**

```sql
-- In Production Supabase Dashboard → SQL Editor
-- Alle CREATE TABLE statements ausführen
-- Initialisierungs-Daten einfügen (falls gewünscht)
```

### 2. Environment Variables konfigurieren

**Development (.env.development) - bereits konfiguriert**

```env
PUBLIC_SUPABASE_URL=https://kgowrcgwzqfeiqitavdc.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Production (.env.production) - zu aktualisieren**

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT_ID.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_PRODUCTION_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRODUCTION_SERVICE_ROLE_KEY
```

### 3. GitHub Secrets konfigurieren

**Repository → Settings → Secrets and variables → Actions**

Folgende Secrets hinzufügen:

```
CLOUDFLARE_API_TOKEN=your_cloudflare_token
PROD_SUPABASE_URL=https://your_prod_project.supabase.co
PROD_SUPABASE_ANON_KEY=your_prod_anon_key
PROD_SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
```

## Deployment-Workflow

### Development Deployment

```bash
# 1. Feature entwickeln
git checkout develop
git pull origin develop

# 2. Änderungen committen
git add .
git commit -m "feat: new feature"
git push origin develop
```

**Automatisch:**

- ✅ Uses Development Supabase (aktuelle Instanz)
- ✅ Deployed auf dev.factory.wishsnap.app
- ✅ Sichere Testumgebung

### Production Release

```bash
# 1. Develop → Main mergen
git checkout main
git merge develop
git push origin main
```

**Automatisch:**

- ✅ Uses Production Supabase (neuer Account)
- ✅ Deployed auf factory.wishsnap.app
- ✅ Live-Umgebung für Kunden

## Schema-Synchronisation

### Bei Datenbankänderungen

**1. Development Schema ändern**

```sql
-- In Development Supabase → SQL Editor
ALTER TABLE wishes ADD COLUMN new_field VARCHAR(255);
```

**2. Migration testen**

```bash
# Lokale Tests auf Development
npm run dev
# Feature testen
```

**3. Production Schema aktualisieren**

```sql
-- In Production Supabase → SQL Editor
-- Gleiche Migration ausführen
ALTER TABLE wishes ADD COLUMN new_field VARCHAR(255);
```

**4. Production Release**

```bash
git checkout main
git merge develop
git push origin main
```

## Monitoring & Wartung

### Regelmäßige Aufgaben

**Wöchentlich:**

- 📊 Free Tier Limits prüfen (Database Usage)
- 🔄 Schema-Drift zwischen Dev/Prod vergleichen
- 📈 Performance-Metriken überprüfen

**Monatlich:**

- 🗄️ Backups erstellen (SQL Export)
- 🔐 API Keys rotieren
- 📝 Nutzungsstatistiken analysieren

### Limit-Monitoring

**Development Account:**

- Rows: X / 50,000
- Storage: X MB / 1,024 MB
- Bandwidth: X MB / 2,048 MB

**Production Account:**

- Rows: X / 50,000
- Storage: X MB / 1,024 MB
- Bandwidth: X MB / 2,048 MB

## Troubleshooting

### Häufige Probleme

**1. Schema-Drift zwischen Dev/Prod**

```sql
-- Schemas vergleichen
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**2. Environment Variable Konflikte**

```bash
# Lokale .env prüfen
cat .env

# GitHub Secrets prüfen
# Repository → Settings → Secrets
```

**3. Free Tier Limits erreicht**

- **Sofort**: Alte Test-Daten löschen
- **Mittelfristig**: Archivierungs-Strategie implementieren
- **Langfristig**: Upgrade auf Pro Plan erwägen

### Recovery-Strategien

**1. Development Database Reset**

```sql
-- Alle Tabellen leeren (Development only!)
TRUNCATE wishes, users, api_keys CASCADE;
-- Test-Daten neu importieren
```

**2. Production Rollback**

```bash
# Falls kritischer Fehler in Production
git checkout main
git revert HEAD
git push origin main
# Automatisches Rollback-Deployment
```

## Best Practices

### Entwicklung

- ✅ **Immer** zuerst auf Development testen
- ✅ **Nie** direkt in Production entwickeln
- ✅ Schema-Änderungen dokumentieren
- ✅ Migrations zuerst auf Dev, dann auf Prod

### Sicherheit

- 🔒 **Separate Credentials** für Dev/Prod
- 🔒 **Minimale Permissions** für API Keys
- 🔒 **Regelmäßige** Key-Rotation
- 🔒 **Monitoring** von Zugriffs-Logs

### Performance

- 📈 **Indexe** in beiden Environments synchron halten
- 📈 **Query-Performance** auf Development messen
- 📈 **Realistic Test Data** für valide Messungen

## Migration Guide

### Von Single-Account zu Dual-Account

Wenn du bereits eine Single-Account Setup hast:

**1. Backup erstellen**

```bash
# Aktuelles Schema exportieren
pg_dump "postgresql://..." > backup.sql
```

**2. Production Account setup**

- Neuen Account erstellen
- Schema importieren
- Environment Variables anpassen

**3. Testing**

```bash
# Development testen
git checkout develop
npm run dev

# Production testen
git checkout main
npm run build
```

## Kosten-Optimierung

### Free Tier maximal nutzen

**Development:**

- Regelmäßig Test-Daten aufräumen
- Alte Feature-Branches DB-clean
- Monitoring für 80% Limit-Warnung

**Production:**

- Daten-Archivierung implementieren
- Effiziente Indexe für weniger Storage
- CDN für Assets (reduziert Bandwidth)

### Upgrade-Kriterien

**Development → Pro ($25/month):**

- \> 40k Rows konstant
- Team mit >2 Entwicklern
- Erweiterte Analytics benötigt

**Production → Pro ($25/month):**

- \> 40k aktive User-Records
- Business-Critical Application
- 24/7 Support Requirements

---

**Nächste Schritte:**

1. ✅ Development Environment ist bereits konfiguriert
2. 🔲 Production Supabase Account erstellen
3. 🔲 GitHub Secrets konfigurieren
4. 🔲 Schema-Migration durchführen
5. 🔲 Production Deployment testen

**Erstellt:** 2025-07-13  
**Projekt:** Wish Factory CMS  
**Version:** 1.0
