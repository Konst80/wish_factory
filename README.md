# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Wish Factory

Ein webbasiertes CMS für KI-gestützte Glückwünsche.

## 🚀 Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Environment-Variablen konfigurieren

Erstellen Sie eine `.env` Datei im Projektroot mit folgenden Variablen:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_url_here
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenRouter AI Configuration (ERFORDERLICH für KI-Generierung)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Datenbank Setup

```bash
# Datenbank-Schema deployen
npm run db:deploy

# Admin-Benutzer erstellen (optional)
npm run setup:admin
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

## 🤖 KI-Konfiguration

### OpenRouter API Key erhalten

1. Besuchen Sie [openrouter.ai](https://openrouter.ai)
2. Erstellen Sie ein Konto
3. Generieren Sie einen API-Key
4. Fügen Sie den Key zu Ihrer `.env` Datei hinzu:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxx...
   ```

### Unterstützte Modelle

- **Claude 3.5 Sonnet** (Empfohlen) - Beste Qualität für deutsche Texte
- **Claude 3 Haiku** - Schnell und kostengünstig
- **GPT-4o** - OpenAI Alternative
- **GPT-4o Mini** - Kompakte Version

### KI-Troubleshooting

Wenn die KI-Generierung nicht funktioniert:

1. **API-Key prüfen**:

   ```bash
   # Health-Check ausführen
   curl http://localhost:5173/api/ai/generate
   ```

2. **Logs überprüfen**:
   - Browser Developer Console für Frontend-Fehler
   - Server-Terminal für Backend-Fehler

3. **Häufige Fehler**:
   - `KI-Service nicht konfiguriert`: API-Key fehlt in `.env`
   - `Keine Berechtigung`: Benutzer ist nicht als Administrator/Redakteur konfiguriert
   - `OpenRouter API error`: Rate-Limit erreicht oder API-Key ungültig

## 📊 Funktionen

- **Wunsch-Management**: Erstellen, bearbeiten, genehmigen
- **KI-Generierung**: Automatische Texterstellung mit OpenRouter
- **Multi-Sprach-Support**: Deutsch und Englisch
- **Benutzerrollen**: Administrator und Redakteur
- **Export**: JSON, CSV, XML
- **API**: REST-API für freigegebene Wünsche

## 🔧 Entwicklung

```bash
# Type-Check
npm run check

# Linting
npm run lint

# Formatierung
npm run format

# Tests
npm run test
```
