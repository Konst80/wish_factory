# Wish Factory AI API Documentation

## Overview

The Wish Factory API provides access to a curated collection of wishes and greetings for various occasions. This documentation is specifically designed for AI systems that need to integrate with our public API endpoints.

## Quick Start Guide

### 1. Authentication Setup

All public API endpoints require an API key. Contact your administrator to obtain one.

**API Key Format**: `wsk_{8char_prefix}{36char_secret}` (44-48 characters total)

**Authentication Methods**:

```http
# Method 1: X-API-Key Header
GET /api/public/wishes
X-API-Key: wsk_12345678abcdef1234567890abcdef1234567890abcdef

# Method 2: Authorization Bearer Token
GET /api/public/wishes
Authorization: Bearer wsk_12345678abcdef1234567890abcdef1234567890abcdef
```

### 2. First API Call

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     "https://your-domain.com/api/public/wishes?limit=5"
```

## Public Endpoints Reference

### 1. Get Released Wishes

**Endpoint**: `GET /api/public/wishes`

**Description**: Retrieve a paginated list of released wishes with comprehensive filtering options.

**Headers**:

- `X-API-Key` or `Authorization: Bearer {api_key}` (required)

**Query Parameters**:

| Parameter        | Type    | Description                   | Example                             |
| ---------------- | ------- | ----------------------------- | ----------------------------------- |
| `language`       | string  | Filter by language code       | `de`, `en`                          |
| `type`           | string  | Wish type                     | `normal`, `heartfelt`, `funny`      |
| `eventType`      | string  | Event type                    | `birthday`, `anniversary`, `custom` |
| `length`         | string  | Wish length                   | `short`, `medium`, `long`           |
| `isBelated`      | boolean | Belated wishes only           | `true`, `false`                     |
| `relations`      | string  | Comma-separated relations     | `friend,family`                     |
| `ageGroups`      | string  | Comma-separated age groups    | `young,middle`                      |
| `specificValues` | string  | Comma-separated numbers       | `18,21,30`                          |
| `limit`          | number  | Results per page (max 100)    | `20`                                |
| `offset`         | number  | Skip results                  | `0`                                 |
| `since`          | string  | ISO date for incremental sync | `2024-01-01T00:00:00Z`              |

**Response**:

```json
{
	"data": [
		{
			"id": "123e4567-e89b-12d3-a456-426614174000",
			"type": "heartfelt",
			"eventType": "birthday",
			"relations": ["friend", "family"],
			"ageGroups": ["young", "middle"],
			"specificValues": [25, 30],
			"text": "Herzlichen Glückwunsch zum {age}. Geburtstag! ...",
			"isBelated": false,
			"language": "de",
			"length": "medium",
			"createdAt": "2024-01-15T10:30:00Z",
			"updatedAt": "2024-01-15T10:30:00Z",
			"releasedAt": "2024-01-16T09:00:00Z",
			"originalWishId": "456e7890-e89b-12d3-a456-426614174001"
		}
	],
	"pagination": {
		"total": 150,
		"limit": 20,
		"offset": 0,
		"hasMore": true
	},
	"metadata": {
		"totalCount": 150,
		"lastUpdated": "2024-01-16T09:00:00Z"
	}
}
```

### 2. Get Single Released Wish

**Endpoint**: `GET /api/public/wishes/{id}`

**Description**: Retrieve a specific released wish by its ID.

**Headers**:

- `X-API-Key` or `Authorization: Bearer {api_key}` (required)

**Response**:

```json
{
	"data": {
		"id": "123e4567-e89b-12d3-a456-426614174000",
		"type": "heartfelt",
		"eventType": "birthday",
		"relations": ["friend"],
		"ageGroups": ["young"],
		"specificValues": [25],
		"text": "Herzlichen Glückwunsch zum {age}. Geburtstag! ...",
		"isBelated": false,
		"language": "de",
		"length": "medium",
		"createdAt": "2024-01-15T10:30:00Z",
		"updatedAt": "2024-01-15T10:30:00Z",
		"releasedAt": "2024-01-16T09:00:00Z",
		"originalWishId": "456e7890-e89b-12d3-a456-426614174001"
	}
}
```

### 3. Get Wishes Metadata

**Endpoint**: `GET /api/public/wishes/metadata`

**Description**: Retrieve available options and system metadata. Useful for discovering valid filter values.

**Headers**:

- `X-API-Key` or `Authorization: Bearer {api_key}` (required)

**Response**:

```json
{
	"data": {
		"types": ["normal", "heartfelt", "funny"],
		"eventTypes": ["birthday", "anniversary", "custom"],
		"relations": ["friend", "family", "partner", "colleague"],
		"ageGroups": ["young", "middle", "senior", "all"],
		"languages": ["de", "en"],
		"lengths": ["short", "medium", "long"],
		"totalCount": 150,
		"lastUpdated": "2024-01-16T09:00:00Z",
		"availableSpecificValues": {
			"birthday": [16, 18, 21, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 100],
			"anniversary": [1, 5, 10, 15, 20, 25, 30, 40, 50, 60]
		}
	}
}
```

## Data Models

### Wish Object

```typescript
interface Wish {
	id: string; // UUID of the released wish
	type: 'normal' | 'heartfelt' | 'funny';
	eventType: 'birthday' | 'anniversary' | 'custom';
	relations: ('friend' | 'family' | 'partner' | 'colleague')[];
	ageGroups: ('young' | 'middle' | 'senior' | 'all')[];
	specificValues: number[]; // Milestone numbers (e.g., ages, years)
	text: string; // Wish content with {placeholders}
	isBelated: boolean; // Whether this is for belated occasions
	language: string; // Language code (e.g., 'de', 'en')
	length: 'short' | 'medium' | 'long';
	createdAt: string; // ISO 8601 date string
	updatedAt: string; // ISO 8601 date string
	releasedAt: string; // ISO 8601 date string
	originalWishId: string; // UUID of the original wish
}
```

### Placeholder System

Wishes contain placeholders that can be dynamically replaced:

- `{age}` - Age or anniversary year
- `{name}` - Recipient's name
- `{relation}` - Relationship to recipient

**Example**:

```
"Herzlichen Glückwunsch zum {age}. Geburtstag, liebe/r {name}!"
```

## Authentication & Security

### API Key Management

- **Format**: `wsk_` prefix + 8-character identifier + 36-character secret
- **Storage**: Keys are SHA-256 hashed in the database
- **Validation**: Real-time validation on each request
- **Expiration**: Keys can have expiration dates (check with administrator)

### Rate Limiting

- **Default Limit**: 1000 requests per hour per API key
- **Headers**: Rate limit information is included in response headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  ```
- **Exceeded**: Returns 429 status code with retry information

### CORS Support

- **Origin**: `Access-Control-Allow-Origin: *`
- **Methods**: GET, HEAD, OPTIONS
- **Headers**: Content-Type, X-API-Key, Authorization

## Filtering & Querying Strategies

### 1. Language-Specific Queries

```bash
# Get German birthday wishes
curl -H "X-API-Key: YOUR_KEY" \
     "/api/public/wishes?language=de&eventType=birthday&limit=10"
```

### 2. Relationship-Based Filtering

```bash
# Get wishes suitable for friends and family
curl -H "X-API-Key: YOUR_KEY" \
     "/api/public/wishes?relations=friend,family&type=heartfelt"
```

### 3. Age-Specific Wishes

```bash
# Get wishes for young adults' milestone birthdays
curl -H "X-API-Key: YOUR_KEY" \
     "/api/public/wishes?ageGroups=young&specificValues=18,21,25"
```

### 4. Incremental Synchronization

```bash
# Get wishes updated since last sync
curl -H "X-API-Key: YOUR_KEY" \
     "/api/public/wishes?since=2024-01-15T00:00:00Z"
```

### 5. Content Length Control

```bash
# Get short wishes for social media
curl -H "X-API-Key: YOUR_KEY" \
     "/api/public/wishes?length=short&limit=20"
```

## Error Handling

### Common Error Codes

| Code                  | HTTP Status | Description              | Solution                      |
| --------------------- | ----------- | ------------------------ | ----------------------------- |
| `MISSING_API_KEY`     | 401         | No API key provided      | Include X-API-Key header      |
| `INVALID_API_KEY`     | 401         | Invalid or expired key   | Check key format and validity |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests        | Wait for rate limit reset     |
| `WISH_NOT_FOUND`      | 404         | Wish ID doesn't exist    | Verify the wish ID            |
| `VALIDATION_ERROR`    | 400         | Invalid query parameters | Check parameter format        |
| `INTERNAL_ERROR`      | 500         | Server error             | Retry or contact support      |

### Error Response Format

```json
{
	"error": {
		"code": "RATE_LIMIT_EXCEEDED",
		"message": "Rate limit exceeded. Try again in 3600 seconds.",
		"timestamp": "2024-01-16T10:30:00Z",
		"details": {
			"limit": 1000,
			"resetTime": "2024-01-16T11:00:00Z"
		}
	}
}
```

## Code Examples

### Python Example

```python
import requests
import json

class WishFactoryAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'X-API-Key': api_key}

    def get_wishes(self, **filters):
        """Get wishes with optional filters"""
        response = requests.get(
            f"{self.base_url}/api/public/wishes",
            headers=self.headers,
            params=filters
        )
        response.raise_for_status()
        return response.json()

    def get_wish(self, wish_id):
        """Get a specific wish by ID"""
        response = requests.get(
            f"{self.base_url}/api/public/wishes/{wish_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_metadata(self):
        """Get available options and metadata"""
        response = requests.get(
            f"{self.base_url}/api/public/wishes/metadata",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
api = WishFactoryAPI("wsk_yourkey", "https://your-domain.com")

# Get German birthday wishes for friends
wishes = api.get_wishes(
    language="de",
    eventType="birthday",
    relations="friend",
    limit=10
)

# Process wishes
for wish in wishes['data']:
    text = wish['text'].replace('{age}', '25').replace('{name}', 'Anna')
    print(f"Wish: {text}")
```

### JavaScript/Node.js Example

```javascript
class WishFactoryAPI {
	constructor(apiKey, baseUrl) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}

	async request(endpoint, params = {}) {
		const url = new URL(`${this.baseUrl}${endpoint}`);
		Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

		const response = await fetch(url, {
			headers: {
				'X-API-Key': this.apiKey,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`API Error: ${error.error.code} - ${error.error.message}`);
		}

		return response.json();
	}

	async getWishes(filters = {}) {
		return this.request('/api/public/wishes', filters);
	}

	async getWish(id) {
		return this.request(`/api/public/wishes/${id}`);
	}

	async getMetadata() {
		return this.request('/api/public/wishes/metadata');
	}
}

// Usage
const api = new WishFactoryAPI('wsk_yourkey', 'https://your-domain.com');

try {
	const wishes = await api.getWishes({
		language: 'en',
		eventType: 'birthday',
		type: 'heartfelt',
		limit: 5
	});

	console.log(`Found ${wishes.data.length} wishes`);
	wishes.data.forEach((wish) => {
		console.log(`- ${wish.text}`);
	});
} catch (error) {
	console.error('Error:', error.message);
}
```

## AI System Use Cases

### 1. Personalized Wish Generation

```python
def generate_personalized_wish(api, person_info):
    """Generate a personalized wish based on person information"""
    filters = {
        'language': person_info.get('language', 'en'),
        'eventType': person_info['event_type'],
        'relations': person_info.get('relation', 'friend'),
        'ageGroups': person_info.get('age_group', 'all'),
        'type': person_info.get('style', 'normal'),
        'limit': 5
    }

    if person_info.get('age'):
        filters['specificValues'] = str(person_info['age'])

    wishes = api.get_wishes(**filters)

    # Select best wish based on AI criteria
    selected_wish = wishes['data'][0]  # Simplified selection

    # Personalize the wish
    text = selected_wish['text']
    text = text.replace('{name}', person_info['name'])
    text = text.replace('{age}', str(person_info.get('age', '')))

    return {
        'text': text,
        'metadata': selected_wish
    }
```

### 2. Content Discovery and Caching

```python
def sync_wishes_database(api, last_sync_time=None):
    """Synchronize local wish database with API"""
    params = {'limit': 100}
    if last_sync_time:
        params['since'] = last_sync_time.isoformat()

    all_wishes = []
    offset = 0

    while True:
        params['offset'] = offset
        response = api.get_wishes(**params)

        wishes = response['data']
        if not wishes:
            break

        all_wishes.extend(wishes)

        if not response['pagination']['hasMore']:
            break

        offset += len(wishes)

    return all_wishes
```

### 3. Multi-Language Support

```python
def get_multilingual_wishes(api, event_type, relations):
    """Get wishes in all available languages"""
    metadata = api.get_metadata()
    languages = metadata['data']['languages']

    multilingual_wishes = {}

    for language in languages:
        wishes = api.get_wishes(
            language=language,
            eventType=event_type,
            relations=relations,
            limit=10
        )
        multilingual_wishes[language] = wishes['data']

    return multilingual_wishes
```

## Best Practices for AI Integration

### 1. Efficient API Usage

- **Cache metadata**: The metadata endpoint provides available options - cache this data
- **Use incremental sync**: Use the `since` parameter for efficient data synchronization
- **Batch requests**: Request multiple wishes at once rather than individual calls
- **Respect rate limits**: Implement exponential backoff for rate limit handling

### 2. Content Processing

- **Placeholder handling**: Always process placeholders (`{age}`, `{name}`) before presenting to users
- **Fallback strategy**: Have fallback wishes when specific filters return no results
- **Quality scoring**: Implement your own scoring system for wish selection

### 3. Error Resilience

- **Retry logic**: Implement retry with exponential backoff for transient errors
- **Graceful degradation**: Have fallback content when API is unavailable
- **Monitoring**: Track API response times and error rates

### 4. Security Considerations

- **API key protection**: Never expose API keys in client-side code
- **Input validation**: Validate all user inputs before making API calls
- **Rate limit handling**: Implement proper rate limit respect and monitoring

## Support and Resources

- **API Status**: Check system status at `/api/test/db-connection`
- **Rate Limit Monitoring**: Monitor headers in all responses
- **Error Logging**: Log all API errors with timestamps for debugging
- **Documentation Updates**: Check this documentation regularly for updates

## Appendix: Complete Parameter Reference

### Filter Parameters

| Parameter        | Type    | Values                                     | Description                |
| ---------------- | ------- | ------------------------------------------ | -------------------------- |
| `language`       | string  | `de`, `en`, custom                         | Language code              |
| `type`           | string  | `normal`, `heartfelt`, `funny`             | Wish tone and style        |
| `eventType`      | string  | `birthday`, `anniversary`, `custom`        | Type of occasion           |
| `length`         | string  | `short`, `medium`, `long`                  | Content length             |
| `isBelated`      | boolean | `true`, `false`                            | For belated occasions      |
| `relations`      | string  | `friend`, `family`, `partner`, `colleague` | Comma-separated            |
| `ageGroups`      | string  | `young`, `middle`, `senior`, `all`         | Comma-separated            |
| `specificValues` | string  | Numbers                                    | Comma-separated ages/years |
| `limit`          | number  | 1-100                                      | Results per page           |
| `offset`         | number  | ≥0                                         | Skip results               |
| `since`          | string  | ISO 8601                                   | For incremental sync       |

### Response Headers

| Header                        | Description                          |
| ----------------------------- | ------------------------------------ |
| `X-RateLimit-Limit`           | Total requests allowed per hour      |
| `X-RateLimit-Remaining`       | Requests remaining in current window |
| `X-RateLimit-Reset`           | Unix timestamp when limit resets     |
| `Cache-Control`               | Caching directives                   |
| `Access-Control-Allow-Origin` | CORS origin policy                   |
