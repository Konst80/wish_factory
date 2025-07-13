# GitHub Secrets Setup Guide

## Übersicht

Für automatische Deployments müssen folgende Secrets im GitHub Repository konfiguriert werden.

## Required Secrets

### Cloudflare Pages
```
CLOUDFLARE_API_TOKEN
```

### Production Supabase
```
PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY  
PROD_SUPABASE_SERVICE_ROLE_KEY
```

## Setup-Anleitung

### 1. GitHub Repository Secrets

**Navigation:**
1. Repository → Settings
2. Secrets and variables → Actions
3. "New repository secret"

### 2. Cloudflare API Token

**Token erstellen:**
1. Besuche: https://dash.cloudflare.com/profile/api-tokens
2. "Create Token" → "Custom token"
3. **Permissions:**
   - Zone:Zone:Read
   - Zone:Page Rule:Edit  
   - Account:Cloudflare Pages:Edit
4. **Zone Resources:**
   - Include: All zones (oder specific: wishsnap.app)
5. Token kopieren

**GitHub Secret:**
```
Name: CLOUDFLARE_API_TOKEN
Value: [Your Cloudflare API Token]
```

### 3. Production Supabase Secrets

**URLs und Keys finden:**
1. Gehe zu: https://bnbzkfwowcqnecrdqdas.supabase.co
2. Settings → API

**GitHub Secrets hinzufügen:**

```
Name: PROD_SUPABASE_URL
Value: https://bnbzkfwowcqnecrdqdas.supabase.co

Name: PROD_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnprZndvd2NxbmVjcmRxZGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTMwMDQsImV4cCI6MjA2Nzk4OTAwNH0.8qEaXz0PJgsszmosACVuKjAJi167C11Y5_mqDK2B_PA

Name: PROD_SUPABASE_SERVICE_ROLE_KEY
Value: [Your Production Service Role Key - from Supabase Dashboard]
```

## Verification

### Secrets prüfen
```bash
# Im Repository → Settings → Secrets
# Sollte zeigen:
✅ CLOUDFLARE_API_TOKEN
✅ PROD_SUPABASE_URL  
✅ PROD_SUPABASE_ANON_KEY
✅ PROD_SUPABASE_SERVICE_ROLE_KEY
```

### Test Deployment
```bash
# Push auf main branch sollte Production deployment triggern
git checkout main
git merge develop
git push origin main

# Check GitHub Actions → Deploy to Cloudflare Pages
```

## Security Best Practices

### Token-Management
- 🔒 **Minimale Permissions** - nur was benötigt wird
- 🔒 **Rotation Schedule** - alle 3-6 Monate
- 🔒 **Monitoring** - Access Logs regelmäßig prüfen
- 🔒 **Backup** - Sichere Kopie der aktuellen Tokens

### Supabase Keys
- 🔒 **Service Role Key** - nur für Server-Side Operations
- 🔒 **Anon Key** - für Client-Side (weniger kritisch)
- 🔒 **Separate Keys** - Development ≠ Production
- 🔒 **RLS Policies** - Row Level Security aktiviert

## Troubleshooting

### Deployment schlägt fehl

**Check 1: Secrets vorhanden**
```bash
# GitHub Actions → Failed workflow → Environment variables
# Fehler: "secret not found"
```

**Check 2: Token-Permissions**
```bash
# Cloudflare Dashboard → API Tokens → Verify permissions
```

**Check 3: Supabase Connection**
```bash
# Local test:
npm run supabase:prod
supabase projects list
```

### Token expired/invalid

**Cloudflare:**
1. Dashboard → API Tokens → Status prüfen
2. Falls expired: Neuen Token erstellen
3. GitHub Secret aktualisieren

**Supabase:**
1. Dashboard → Settings → API → Keys regenerieren
2. .env.production lokale Datei aktualisieren
3. GitHub Secrets aktualisieren

## Automated Setup

### Quick Setup Script
```bash
# Nach dem kompletten .env.production Setup:
./scripts/setup-production-env.sh

# Zeigt alle erforderlichen Werte für GitHub Secrets
```

### Environment Sync
```bash
# Development environment testen
npm run supabase:dev
npm run dev

# Production environment testen  
npm run supabase:prod
npm run build
```

---

**Nächste Schritte nach Secret-Setup:**
1. ✅ Test deployment auf develop branch
2. ✅ Merge develop → main für production deployment
3. ✅ Custom Domains konfigurieren
4. ✅ Monitoring setup

**Erstellt:** 2025-07-13  
**Projekt:** Wish Factory CMS