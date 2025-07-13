# Supabase Email Redirect URLs Fix

## Problem

E-Mail-Bestätigungen leiten zu `http://localhost:3000` weiter statt zu den Produktions-URLs.

## Lösung

### 1. Development Supabase (kgowrcgwzqfeiqitavdc)

Gehe zu: https://supabase.com/dashboard/project/kgowrcgwzqfeiqitavdc/auth/url-configuration

**Site URL setzen auf:**

```
https://7476a4de.wish-factory-dev.pages.dev
```

**Redirect URLs hinzufügen:**

```
https://7476a4de.wish-factory-dev.pages.dev/**
http://localhost:5173/**
```

### 2. Production Supabase (bnbzkfwowcqnecrdqdas)

Gehe zu: https://supabase.com/dashboard/project/bnbzkfwowcqnecrdqdas/auth/url-configuration

**Site URL setzen auf:**

```
https://factory.wishsnap.app
```

**Redirect URLs hinzufügen:**

```
https://factory.wishsnap.app/**
http://localhost:5173/**
```

### 3. Teste nach der Änderung

**Development:**

- Registrierung: https://7476a4de.wish-factory-dev.pages.dev/auth/register
- E-Mail sollte zu: `https://7476a4de.wish-factory-dev.pages.dev/?code=...` weiterleiten

**Production:**

- Registrierung: https://factory.wishsnap.app/auth/register
- E-Mail sollte zu: `https://factory.wishsnap.app/?code=...` weiterleiten

## Zusätzliche Fixes

- ✅ `supabase/config.toml` aktualisiert
- ✅ `/reset-password` Route erstellt für Passwort-Reset-E-Mails

## Wichtig

Die Dashboard-Einstellungen haben Vorrang vor der config.toml - beide müssen geändert werden!
