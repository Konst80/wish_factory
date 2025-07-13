# WishSnap API Interface Documentation

## Übersicht

Diese Dokumentation beschreibt das öffentliche REST API Interface für die WishSnap Mobile App, um auf freigegebene Wünsche von Wish-Factory zuzugreifen.

## Basis-URL
```
https://your-wish-factory.com/api/public
```

## Authentifizierung

### API Key Authentifizierung (Erforderlich)
Die API ist mit API Key-basierter Authentifizierung gesichert. Sie benötigen einen gültigen API Key um auf die Endpoints zuzugreifen.

**Header-Optionen:**
```http
# Option 1: X-API-Key Header (Empfohlen)
X-API-Key: wsk_abcd1234567890abcdef1234567890abcdef12

# Option 2: Authorization Header
Authorization: Bearer wsk_abcd1234567890abcdef1234567890abcdef12
```

**API Key Format:**
- Prefix: `wsk_` (WishSnap Key)
- Length: 48 Zeichen total
- Beispiel: `wsk_a1b2c3d4567890abcdef1234567890abcdef12`

**API Key erhalten:**
- Kontaktieren Sie den Administrator der Wish-Factory Instanz
- API Keys werden über das Admin Dashboard verwaltet (`/dashboard/api-keys`)
- Jeder API Key hat individuelle Rate Limits und Berechtigungen

### API Key Management

**Für Administratoren:**
- API Keys können über das Admin Dashboard unter `/dashboard/api-keys` verwaltet werden
- Jeder API Key hat folgende Eigenschaften:
  - **Name**: Eindeutiger Bezeichner (z.B. "WishSnap Mobile App")
  - **Beschreibung**: Optionale Beschreibung des Verwendungszwecks
  - **Rate Limit**: Anfragen pro Stunde (Standard: 1000)
  - **Ablaufdatum**: Optionales Verfallsdatum
  - **Status**: Aktiv/Inaktiv
  - **Erlaubte Endpoints**: Standardmäßig `/api/public/wishes`

**API Key Erstellung:**
```bash
# Über Admin Dashboard:
1. Anmeldung als Administrator
2. Navigation zu /dashboard/api-keys
3. "API Key erstellen" anklicken
4. Formular ausfüllen und bestätigen
5. API Key sicher speichern (wird nur einmal angezeigt!)
```

**API Key Sicherheit:**
- API Keys werden mit bcrypt gehasht in der Datenbank gespeichert
- Nur der Key-Prefix ist im Klartext sichtbar
- Keys können jederzeit deaktiviert werden
- Verwendungsstatistiken werden getrackt (Anzahl Anfragen, letzte Nutzung)

## Datenmodell: Released Wish

### ReleasedWish Interface
```typescript
interface ReleasedWish {
  id: string;                    // UUID des released wish
  originalWishId: string;        // UUID des ursprünglichen Wunsches
  type: 'normal' | 'herzlich' | 'humorvoll';
  eventType: 'birthday' | 'anniversary' | 'custom';
  relations: ('friend' | 'family' | 'partner' | 'colleague')[];
  ageGroups: ('all' | 'young' | 'middle' | 'senior')[];
  specificValues: number[];      // Meilensteine wie [18, 30, 50]
  text: string;                  // Der Wunschtext
  belated: boolean;              // Nachträglicher Wunsch
  language: 'de' | 'en';
  length: 'short' | 'medium' | 'long';
  releasedAt: string;           // ISO 8601 Timestamp
}
```

## API Endpoints

### 1. Alle freigegebenen Wünsche abrufen
```http
GET /api/public/wishes
X-API-Key: wsk_your_api_key_here
```

**Query Parameter:**
- `language` (optional): 'de' | 'en' - Filtert nach Sprache
- `type` (optional): 'normal' | 'herzlich' | 'humorvoll' - Filtert nach Typ
- `eventType` (optional): 'birthday' | 'anniversary' | 'custom' - Filtert nach Anlass
- `length` (optional): 'short' | 'medium' | 'long' - Filtert nach Länge
- `belated` (optional): 'true' | 'false' - Filtert nachträgliche Wünsche
- `relations` (optional): Komma-getrennte Liste - Filtert nach Beziehungen
- `ageGroups` (optional): Komma-getrennte Liste - Filtert nach Altersgruppen
- `specificValues` (optional): Komma-getrennte Zahlen - Filtert nach Meilensteinen
- `limit` (optional): Anzahl der Ergebnisse (default: 100, max: 500)
- `offset` (optional): Offset für Pagination (default: 0)
- `since` (optional): ISO 8601 Timestamp - Nur Wishes seit diesem Datum

**Response Headers:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1999
X-RateLimit-Reset: 2025-01-15T11:30:00Z
X-API-Key-Name: WishSnap Mobile App
Cache-Control: public, max-age=300
```

**Response:**
```json
{
  "wishes": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "originalWishId": "123e4567-e89b-12d3-a456-426614174001",
      "type": "normal",
      "eventType": "birthday",
      "relations": ["friend", "family"],
      "ageGroups": ["young", "middle"],
      "specificValues": [18, 21, 30],
      "text": "Herzlichen Glückwunsch zum {age}. Geburtstag! Mögen all deine Träume in Erfüllung gehen.",
      "belated": false,
      "language": "de",
      "length": "medium",
      "releasedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0,
  "hasMore": false
}
```

### 2. Einzelnen freigegebenen Wunsch abrufen
```http
GET /api/public/wishes/{id}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "originalWishId": "123e4567-e89b-12d3-a456-426614174001",
  "type": "normal",
  "eventType": "birthday",
  "relations": ["friend"],
  "ageGroups": ["young"],
  "specificValues": [18],
  "text": "Herzlichen Glückwunsch zum {age}. Geburtstag!",
  "belated": false,
  "language": "de",
  "length": "short",
  "releasedAt": "2025-01-15T10:30:00Z"
}
```

### 3. Metadata für Filteroptionen abrufen
```http
GET /api/public/wishes/metadata
```

**Response:**
```json
{
  "types": ["normal", "herzlich", "humorvoll"],
  "eventTypes": ["birthday", "anniversary", "custom"],
  "relations": ["friend", "family", "partner", "colleague"],
  "ageGroups": ["all", "young", "middle", "senior"],
  "languages": ["de", "en"],
  "lengths": ["short", "medium", "long"],
  "totalCount": 1337,
  "lastUpdated": "2025-01-15T10:30:00Z"
}
```

## Platzhalter im Wunschtext

Der `text` kann folgende Platzhalter enthalten:
- `{age}` - Alter/Meilenstein
- `{name}` - Name der Person (von der App zu ersetzen)
- `{relation}` - Beziehung (von der App zu ersetzen)

## Offline-Synchronisation für WishSnap

### Empfohlener Sync-Prozess:
1. **Initial Sync**: Alle Wishes mit `GET /api/public/wishes?limit=500` laden
2. **Incremental Sync**: Periodisch mit `since` Parameter neue Wishes abrufen
3. **Lokale Speicherung**: SQLite Datenbank in der App
4. **Conflict Resolution**: Server-Daten sind immer führend (Read-Only)

### Beispiel Sync-Request:
```http
GET /api/public/wishes?since=2025-01-15T10:30:00Z&limit=500
```

## Error Responses

```json
{
  "error": {
    "code": "WISH_NOT_FOUND",
    "message": "Released wish not found",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `MISSING_API_KEY` (401) - Fehlender API Key
- `INVALID_API_KEY` (401) - Ungültiger oder abgelaufener API Key
- `RATE_LIMIT_EXCEEDED` (429) - Rate Limit überschritten
- `WISH_NOT_FOUND` (404) - Wunsch nicht gefunden
- `INVALID_PARAMETER` (400) - Ungültiger Query Parameter
- `INTERNAL_ERROR` (500) - Server-Fehler

**Authentifizierung Error Beispiele:**
```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "API key is required. Please provide it via X-API-Key header or Authorization header.",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "rateLimitReset": "2025-01-15T11:30:00Z",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## Rate Limiting
- **Per API Key**: Individuell konfigurierbar (Standard: 1000 Requests/Stunde)
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Überschreitung**: HTTP 429 mit `rateLimitReset` Timestamp
- **Reset**: Rate Limit wird stündlich zurückgesetzt

## Caching
- Response wird 5 Minuten gecacht
- Header: `Cache-Control: public, max-age=300`
- ETag Support für effizientes Caching

## CORS
- **Origins**: Alle Origins erlaubt (`*`)
- **Methoden**: GET, HEAD, OPTIONS
- **Headers**: Content-Type, X-API-Key, Authorization
- **Preflight**: OPTIONS Request wird unterstützt

## Beispiel-Integration für KI

```typescript
// WishSnap API Client Beispiel
class WishSnapAPI {
  constructor(private apiKey: string, private baseUrl: string) {}

  async getWishes(filters?: WishFilters): Promise<WishResponse> {
    const params = new URLSearchParams();
    if (filters?.language) params.set('language', filters.language);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    
    const response = await fetch(`${this.baseUrl}/api/public/wishes?${params}`, {
      headers: {
        'X-API-Key': this.apiKey,
        'User-Agent': 'WishSnap-App/1.0'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error.code, error.error.message);
    }

    return await response.json();
  }
}

// Für KI-Prompting in WishSnap
const wishContext = {
  availableWishes: wishes,
  userRequest: {
    eventType: "birthday",
    age: 25,
    relation: "friend",
    language: "de"
  },
  filtering: {
    byEventType: wishes.filter(w => w.eventType === "birthday"),
    byRelation: wishes.filter(w => w.relations.includes("friend")),
    byLanguage: wishes.filter(w => w.language === "de"),
    byAge: wishes.filter(w => 
      w.ageGroups.includes("young") || 
      w.specificValues.includes(25)
    )
  }
};

// KI kann dann passende Wishes auswählen und Platzhalter ersetzen
```

## Admin Interface für API Key Management

Wish-Factory stellt ein webbasiertes Admin Interface zur Verwaltung von API Keys bereit:

### Dashboard-Zugang
```
URL: https://your-wish-factory.com/dashboard/api-keys
Berechtigung: Nur Administratoren
```

### Verfügbare Aktionen

**API Key Übersicht:**
- Liste aller erstellten API Keys mit Status
- Anzeige von Verwendungsstatistiken (Gesamtanfragen, letzte Nutzung)
- Filter nach Status (Aktiv/Inaktiv)

**API Key Erstellung:**
- Formular zur Erstellung neuer API Keys
- Konfiguration von Name, Beschreibung, Rate Limits
- Optionale Ablaufzeit-Einstellung
- Einmalige Anzeige des vollständigen API Keys

**API Key Verwaltung:**
- Deaktivierung von API Keys
- Anzeige der Verwendungsstatistiken
- Monitoring von Rate Limit Überschreitungen

### Interface-Features
- **Sicherheitswarnung**: API Keys werden nur einmal vollständig angezeigt
- **Copy-to-Clipboard**: Einfaches Kopieren der generierten Keys
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Echtzeit-Updates**: Sofortige Aktualisierung nach Änderungen

## Sicherheitshinweise

### API Key Sicherheit
- **Niemals** API Keys in Client-Code einbetten
- Verwenden Sie sichere Speicherung (Keychain/Keystore)
- Rotieren Sie API Keys regelmäßig
- Überwachen Sie die Nutzung im Admin Dashboard

### Rate Limiting Best Practices
- Implementieren Sie exponential backoff bei 429 Responses
- Cachen Sie Responses lokal wenn möglich
- Verwenden Sie `since` Parameter für inkrementelle Updates

## Änderungshistorie
- v1.1: API Key Authentifizierung hinzugefügt (2025-01-15)
- v1.0: Initial Release (2025-01-15)