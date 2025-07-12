# WishSnap API Interface Documentation

## Übersicht

Diese Dokumentation beschreibt das öffentliche REST API Interface für die WishSnap Mobile App, um auf freigegebene Wünsche von Wish-Factory zuzugreifen.

## Basis-URL
```
https://your-wish-factory.com/api/public
```

## Authentifizierung
Keine Authentifizierung erforderlich. Alle Endpoints sind öffentlich zugänglich.

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
- `WISH_NOT_FOUND` (404) - Wunsch nicht gefunden
- `INVALID_PARAMETER` (400) - Ungültiger Query Parameter
- `RATE_LIMIT_EXCEEDED` (429) - Rate Limit überschritten
- `INTERNAL_ERROR` (500) - Server-Fehler

## Rate Limiting
- 1000 Requests pro Stunde pro IP
- Header: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Caching
- Response wird 5 Minuten gecacht
- Header: `Cache-Control: public, max-age=300`
- ETag Support für effizientes Caching

## CORS
- Alle Origins erlaubt für öffentliche API
- Methoden: GET, HEAD, OPTIONS

## Beispiel-Integration für KI

```typescript
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

## Änderungshistorie
- v1.0: Initial Release (2025-01-15)