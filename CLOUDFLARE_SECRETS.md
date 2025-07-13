# Cloudflare Pages Secrets Konfiguration

Die folgenden Secrets müssen im Cloudflare Dashboard konfiguriert werden:

## Für Production Environment:

```
PUBLIC_SUPABASE_ANON_KEY = [Production Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY = [Production Supabase Service Role Key]
OPENROUTER_API_KEY = [OpenRouter API Key]
```

## Für Preview Environment:

```
PUBLIC_SUPABASE_ANON_KEY = [Development Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY = [Development Supabase Service Role Key]
OPENROUTER_API_KEY = [OpenRouter API Key]
```

## So konfigurierst du die Secrets:

1. Gehe zu: https://dash.cloudflare.com/
2. Pages → wish-factory → Settings → Environment variables
3. Unter "Production environment" die Production Secrets hinzufügen
4. Unter "Preview environment" die Development Secrets hinzufügen
5. Klicke "Encrypt" für jede Variable

## Testen:

Nach der Konfiguration teste mit:

- Production: https://factory.wishsnap.app/auth/status
- Development: https://7476a4de.wish-factory-dev.pages.dev/auth/status

Die Status-Seite zeigt an, ob alle Umgebungsvariablen korrekt geladen wurden.
