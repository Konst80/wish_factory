# Deployment Guide - Wish Factory

## Übersicht

Das Wish Factory Projekt verwendet eine **Dual-Environment Deployment-Strategie** mit automatischen Deployments über GitHub Actions und Cloudflare Pages.

## Environment-Struktur

| Environment     | Branch    | URL                                   | Zweck               |
| --------------- | --------- | ------------------------------------- | ------------------- |
| **Development** | `develop` | `https://wish-factory-dev.pages.dev/` | Entwicklung & Tests |
| **Production**  | `main`    | `https://wish-factory.pages.dev/`     | Live-Anwendung      |

### Custom Domains (manuell einzurichten)

- **Development**: `dev.factory.wishsnap.app`
- **Production**: `factory.wishsnap.app`

## Branch-Strategie

### Development Workflow

```bash
# 1. Feature entwickeln
git checkout develop
git pull origin develop

# 2. Neues Feature implementieren
# ... code changes ...

# 3. Commit & Push
git add .
git commit -m "feat: add user analytics dashboard"
git push origin develop
```

**Resultat:** Automatisches Deployment auf Development-Environment

### Production Release

```bash
# 1. Zur main branch wechseln
git checkout main
git pull origin main

# 2. Develop branch mergen
git merge develop

# 3. Release erstellen
git push origin main
```

**Resultat:** Automatisches Deployment auf Production-Environment

## GitHub Actions Workflow

### Automatische Prozesse

**Bei Push auf `develop`:**

1. ✅ Dependencies installieren
2. ✅ TypeScript-Prüfung (`npm run check`)
3. ✅ Linting (`npm run lint`)
4. ✅ Build (`npm run build`)
5. 🚀 Deployment auf Development-Environment

**Bei Push auf `main`:**

1. ✅ Dependencies installieren
2. ✅ TypeScript-Prüfung (`npm run check`)
3. ✅ Linting (`npm run lint`)
4. ✅ Build (`npm run build`)
5. 🚀 Deployment auf Production-Environment

**Bei Pull Request:**

- Führt Tests und Build durch
- Kommentiert PR mit Deployment-Info

### Setup Requirements

#### 1. Cloudflare API Token erstellen

1. Besuche [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Erstelle Token mit folgenden Permissions:
   - Zone:Zone:Read
   - Zone:Page Rule:Edit
   - Account:Cloudflare Pages:Edit

#### 2. GitHub Secret hinzufügen

1. Repository → Settings → Secrets and variables → Actions
2. Neues Secret: `CLOUDFLARE_API_TOKEN`
3. Wert: Der erstellte API Token

## Manuelle Deployments

### Development Deployment

```bash
npm run build
wrangler pages deploy .svelte-kit/output/client --project-name=wish-factory-dev
```

### Production Deployment

```bash
npm run build
wrangler pages deploy .svelte-kit/output/client --project-name=wish-factory
```

## Custom Domain Setup

### Cloudflare Dashboard Konfiguration

1. **Development Domain** (`dev.factory.wishsnap.app`)
   - Cloudflare Dashboard → Pages → `wish-factory-dev`
   - Custom domains → "Set up a custom domain"
   - Domain eingeben: `dev.factory.wishsnap.app`

2. **Production Domain** (`factory.wishsnap.app`)
   - Cloudflare Dashboard → Pages → `wish-factory`
   - Custom domains → "Set up a custom domain"
   - Domain eingeben: `factory.wishsnap.app`

## Projekt-Konfiguration

### Cloudflare Pages Projekte

| Projekt     | Cloudflare Project Name | Production Branch | URL                                |
| ----------- | ----------------------- | ----------------- | ---------------------------------- |
| Development | `wish-factory-dev`      | `develop`         | https://wish-factory-dev.pages.dev |
| Production  | `wish-factory`          | `main`            | https://wish-factory.pages.dev     |

### Build-Einstellungen

```yaml
Framework: SvelteKit
Build command: npm run build
Build output directory: .svelte-kit/output/client
Root directory: /
Node.js version: 18
```

## Troubleshooting

### Häufige Probleme

#### 1. Deployment schlägt fehl

- **Prüfen:** GitHub Actions Logs
- **Lösung:** `npm run check` und `npm run lint` lokal ausführen

#### 2. Build-Fehler

```bash
# Lokal testen
npm ci
npm run check
npm run lint
npm run build
```

#### 3. Cloudflare API Token Probleme

- Token-Permissions prüfen
- Neuen Token erstellen
- GitHub Secret aktualisieren

#### 4. Branch-Synchronisation

```bash
# Branches synchronisieren
git checkout develop
git pull origin develop
git checkout main
git pull origin main
```

## Monitoring

### Deployment Status prüfen

1. **GitHub Actions**: Repository → Actions Tab
2. **Cloudflare Dashboard**: Pages → Projektstatus
3. **Live-URLs**: Websites direkt besuchen

### Logs einsehen

- **GitHub Actions**: Detailed Workflow-Logs
- **Cloudflare Pages**: Function/Build Logs im Dashboard

## Best Practices

### Development

- ✅ Immer auf `develop` branch entwickeln
- ✅ Features vor Merge ausgiebig testen
- ✅ Descriptive Commit-Messages verwenden
- ✅ Pull Requests für größere Features

### Production

- ✅ Nur stabile Versionen auf `main` mergen
- ✅ Release-Notes für wichtige Updates
- ✅ Rollback-Plan bei kritischen Fehlern
- ✅ Monitoring nach Production-Deployments

### Sicherheit

- 🔒 API Tokens sicher verwalten
- 🔒 Secrets nie in Code committen
- 🔒 Regular Token-Rotation
- 🔒 Access-Logs regelmäßig prüfen

## Schnellreferenz

```bash
# Development
git checkout develop
# ... entwickeln ...
git push origin develop  # → Auto-Deploy auf dev.factory.wishsnap.app

# Production Release
git checkout main
git merge develop
git push origin main     # → Auto-Deploy auf factory.wishsnap.app

# Manueller Build
npm run build
wrangler pages deploy .svelte-kit/output/client --project-name=wish-factory

# Status prüfen
wrangler pages project list
```

---

**Erstellt:** $(date +"%Y-%m-%d")  
**Projekt:** Wish Factory CMS  
**Version:** 1.0
