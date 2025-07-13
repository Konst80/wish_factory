# Supabase CLI Management Guide

## Übersicht

Die Supabase CLI ermöglicht die Verwaltung beider Accounts (Development/Production) über die Kommandozeile. Ein spezielles Management-Script vereinfacht den Umgang mit beiden Environments.

## Installation

Die Supabase CLI ist bereits installiert:

```bash
supabase --version
# Output: 2.30.4
```

**Falls erneute Installation benötigt:**

```bash
brew install supabase/tap/supabase
```

## Management Script

### Verwendung

```bash
# Status beider Environments anzeigen
./scripts/supabase-setup.sh status

# Development Environment setup
./scripts/supabase-setup.sh setup-dev

# Production Environment setup (nach Account-Erstellung)
./scripts/supabase-setup.sh setup-prod

# Login zu Development Account
./scripts/supabase-setup.sh login-dev

# Login zu Production Account
./scripts/supabase-setup.sh login-prod

# Alle verfügbaren Projekte auflisten
./scripts/supabase-setup.sh list

# Hilfe anzeigen
./scripts/supabase-setup.sh help
```

### Aktuelle Konfiguration

```
Development Environment:
├── Project ID: kgowrcgwzqfeiqitavdc
├── URL: https://kgowrcgwzqfeiqitavdc.supabase.co
└── Status: ✅ Konfiguriert

Production Environment:
├── Project ID: [Noch zu erstellen]
├── URL: [Wird nach Account-Erstellung verfügbar]
└── Status: ❌ Pending
```

## Workflow für Development

### 1. Login und Setup

```bash
# Erste Einrichtung
./scripts/supabase-setup.sh login-dev
./scripts/supabase-setup.sh setup-dev
```

### 2. Schema-Management

```bash
# Aktuelles Schema anzeigen
supabase db diff

# Lokale Migrations erstellen
supabase migration new add_new_feature

# Migration auf Development anwenden
supabase db push

# Schema dumpen (für Prod-Migration)
supabase db dump --linked > dev_schema.sql
```

### 3. Lokale Entwicklung

```bash
# Lokale Supabase-Instanz starten (optional)
supabase start

# Status prüfen
supabase status

# Stoppen
supabase stop
```

## Workflow für Production

### 1. Account Setup (einmalig)

**Schritt 1: Neuen Supabase Account erstellen**

1. Neue E-Mail verwenden (z.B. `konstantin+prod@example.com`)
2. Bei [supabase.com](https://supabase.com) registrieren
3. Neues Projekt erstellen: `wish-factory-production`

**Schritt 2: Script konfigurieren**

```bash
# scripts/supabase-setup.sh editieren
# Zeile 21 ändern:
PROD_PROJECT_ID="your_new_prod_project_id"
```

**Schritt 3: Production Setup**

```bash
./scripts/supabase-setup.sh login-prod
./scripts/supabase-setup.sh setup-prod
```

### 2. Schema-Migration

```bash
# Method 1: CLI Migration
supabase db dump --linked > dev_schema.sql
# Manual review and cleanup
supabase db push --project-ref YOUR_PROD_PROJECT_ID

# Method 2: Manual via Dashboard
# Copy CREATE TABLE statements from Dev → Prod
```

## Account-Switching

### Development Account

```bash
# Login zu Development
./scripts/supabase-setup.sh login-dev

# Arbeiten mit Development
supabase projects list
supabase link --project-ref kgowrcgwzqfeiqitavdc
```

### Production Account

```bash
# Login zu Production (andere E-Mail!)
./scripts/supabase-setup.sh login-prod

# Arbeiten mit Production
supabase projects list
supabase link --project-ref YOUR_PROD_PROJECT_ID
```

## Häufige CLI-Befehle

### Projekt-Management

```bash
# Alle Projekte auflisten
supabase projects list

# Projekt-Details anzeigen
supabase projects api-keys --project-ref PROJECT_ID

# Projekt verlinken
supabase link --project-ref PROJECT_ID
```

### Datenbank-Management

```bash
# Schema-Unterschiede anzeigen
supabase db diff

# Migration erstellen
supabase migration new migration_name

# Lokale Migrations anwenden
supabase db reset

# Remote Migrations anwenden
supabase db push

# Datenbank dumpen
supabase db dump --linked

# SQL ausführen
supabase db query "SELECT * FROM wishes LIMIT 5"
```

### Edge Functions

```bash
# Neue Edge Function erstellen
supabase functions new function_name

# Function deployen
supabase functions deploy function_name

# Function-Logs anzeigen
supabase functions logs function_name
```

## Authentifizierung

### Access Tokens

Für CI/CD oder automatisierte Scripts:

```bash
# Token generieren (via Dashboard)
# Settings → API → Generate new token

# Token verwenden
export SUPABASE_ACCESS_TOKEN="your_token_here"
supabase projects list

# Oder direkt im Script
./scripts/supabase-setup.sh login-dev --token YOUR_TOKEN
```

### Session-Management

```bash
# Aktueller Login-Status
supabase auth whoami

# Logout
supabase auth logout
```

## Automatisierung

### CI/CD Integration

**GitHub Actions Beispiel:**

```yaml
- name: Setup Supabase CLI
  run: |
    brew install supabase/tap/supabase
    supabase auth login --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}

- name: Apply migrations to Production
  run: |
    supabase link --project-ref ${{ secrets.PROD_PROJECT_ID }}
    supabase db push
```

### Scripted Workflows

```bash
# Auto-Migration Script
#!/bin/bash
./scripts/supabase-setup.sh login-dev
supabase db dump --linked > temp_schema.sql

./scripts/supabase-setup.sh login-prod
supabase link --project-ref $PROD_PROJECT_ID
supabase db push --file temp_schema.sql
```

## Troubleshooting

### Häufige Probleme

**1. Docker Daemon nicht verfügbar**

```bash
# Problem: "Cannot connect to Docker daemon"
# Lösung: Docker Desktop starten oder ohne lokale Instanz arbeiten
supabase status --remote
```

**2. Authentifizierung fehlgeschlagen**

```bash
# Problem: "Invalid access token"
# Lösung: Erneut einloggen
supabase auth logout
./scripts/supabase-setup.sh login-dev
```

**3. Projekt nicht gefunden**

```bash
# Problem: "Project not found"
# Lösung: Korrekte Project-ID prüfen
supabase projects list
supabase link --project-ref CORRECT_PROJECT_ID
```

**4. Schema-Konflikte**

```bash
# Problem: Migration conflicts
# Lösung: Reset und clean migration
supabase db reset
supabase migration repair
```

### Debug-Modus

```bash
# Verbose output für Debugging
./scripts/supabase-setup.sh status --debug
supabase --debug db push
```

## Best Practices

### Development

- ✅ Immer zuerst lokal testen mit `supabase start`
- ✅ Migrations vor Remote-Push validieren
- ✅ Regelmäßige Schema-Backups erstellen
- ✅ Feature-Branches für große DB-Änderungen

### Production

- ✅ Nie direkt in Production experimentieren
- ✅ Staging-Umgebung für Pre-Production Tests
- ✅ Rollback-Plan für kritische Migrations
- ✅ Monitoring nach Schema-Änderungen

### Sicherheit

- 🔒 Access Tokens sicher verwalten
- 🔒 Separate Tokens für Dev/Prod
- 🔒 Regelmäßige Token-Rotation
- 🔒 Minimale Permissions für CI/CD

## Schema-Synchronisation

### Development → Production

```bash
# 1. Development Schema exportieren
./scripts/supabase-setup.sh login-dev
supabase db dump --linked --schema public > dev_schema.sql

# 2. Schema reviewen und anpassen
# ... manual review ...

# 3. Production Schema updaten
./scripts/supabase-setup.sh login-prod
supabase db push --file dev_schema.sql
```

### Automated Sync (Vorsicht!)

```bash
# Nur für unkritische Entwicklungsumgebungen
supabase db diff --linked --schema public | supabase db push --linked
```

## Monitoring & Maintenance

### Regelmäßige Aufgaben

**Täglich:**

```bash
# Projekt-Status prüfen
./scripts/supabase-setup.sh status
```

**Wöchentlich:**

```bash
# Schema-Drift überprüfen
supabase db diff --linked
```

**Monatlich:**

```bash
# Backups erstellen
supabase db dump --linked > backup_$(date +%Y%m%d).sql
```

---

**Quick Commands Reference:**

```bash
# Status
./scripts/supabase-setup.sh status

# Development
./scripts/supabase-setup.sh login-dev
supabase db push

# Production
./scripts/supabase-setup.sh login-prod
supabase db push

# Migration
supabase migration new feature_name
supabase db reset && supabase db push
```

**Erstellt:** 2025-07-13  
**CLI Version:** 2.30.4  
**Projekt:** Wish Factory CMS
