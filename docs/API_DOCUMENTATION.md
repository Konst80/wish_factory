# Wish-Factory API Documentation

## Overview

The Wish-Factory API provides endpoints for accessing and managing AI-generated wishes/greetings. The API supports both public and private endpoints with authentication and rate limiting.

**Base URL**: `http://localhost:5173/api`

## Authentication

### Public API

- **API Key Required**: Yes
- **Headers**:
  - `X-API-Key: your-api-key` or
  - `Authorization: Bearer your-api-key`
- **Rate Limiting**: Enforced per API key

### Private API

- **Authentication**: Session-based (Supabase Auth)
- **Authorization**: Role-based (Editor/Administrator)

## Public Endpoints

### 1. Get Released Wishes

**Endpoint**: `GET /api/public/wishes`  
**Description**: Retrieve released wishes with filtering and pagination options.

**Authentication**: Required (API Key)

**Query Parameters**:

- `language` (optional): `de` | `en` - Filter by language
- `type` (optional): `normal` | `heartfelt` | `funny` - Filter by wish type
- `eventType` (optional): `birthday` | `anniversary` | `custom` - Filter by event type
- `length` (optional): `short` | `medium` | `long` - Filter by wish length
- `isBelated` (optional): `true` | `false` - Filter for belated wishes
- `relations` (optional): Comma-separated list of relations (`friend,family,partner,colleague`)
- `ageGroups` (optional): Comma-separated list of age groups (`young,middle,senior,all`)
- `specificValues` (optional): Comma-separated list of numbers
- `limit` (optional): Number of results (max 500, default 100)
- `offset` (optional): Pagination offset (default 0)
- `since` (optional): ISO date string - Only wishes released after this date

**Response**:

```json
{
	"wishes": [
		{
			"id": "string",
			"originalWishId": "string",
			"type": "heartfelt",
			"eventType": "birthday",
			"relations": ["friend", "family"],
			"ageGroups": ["young", "middle"],
			"specificValues": [25, 30],
			"text": "Wish content...",
			"isBelated": false,
			"language": "de",
			"length": "medium",
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z",
			"releasedAt": "2024-01-01T00:00:00.000Z"
		}
	],
	"total": 150,
	"limit": 100,
	"offset": 0,
	"hasMore": true
}
```

**Response Headers**:

- `X-RateLimit-Limit`: Requests per hour limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Rate limit reset time
- `X-API-Key-Name`: Name of the API key used

### 2. Get Single Released Wish

**Endpoint**: `GET /api/public/wishes/{id}`  
**Description**: Retrieve a specific released wish by ID.

**Authentication**: Not required (public endpoint)

**Path Parameters**:

- `id` (required): Wish ID

**Response**:

```json
{
	"id": "string",
	"originalWishId": "string",
	"type": "normal",
	"eventType": "birthday",
	"relations": ["friend"],
	"ageGroups": ["young"],
	"specificValues": [25],
	"text": "Wish content...",
	"isBelated": false,
	"language": "de",
	"length": "medium",
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z",
	"releasedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Get Wishes Metadata

**Endpoint**: `GET /api/public/wishes/metadata`  
**Description**: Retrieve metadata about available wishes (types, languages, etc.).

**Authentication**: Not required (public endpoint)

**Response**:

```json
{
	"types": ["normal", "heartfelt", "funny"],
	"eventTypes": ["birthday", "anniversary", "custom"],
	"relations": ["friend", "family", "partner", "colleague"],
	"ageGroups": ["young", "middle", "senior", "all"],
	"languages": ["de", "en"],
	"lengths": ["short", "medium", "long"],
	"totalCount": 1250,
	"lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## Private Endpoints

### 4. Generate AI Wishes

**Endpoint**: `POST /api/ai/generate`  
**Description**: Generate new wishes using AI.

**Authentication**: Required (Session + Role: Editor/Administrator)

**Request Body**:

```json
{
	"types": ["normal", "heartfelt", "funny"],
	"eventTypes": ["birthday", "anniversary"],
	"languages": ["de", "en"],
	"relations": ["friend", "family"],
	"ageGroups": ["young", "middle"],
	"specificValues": [25, 30],
	"count": 3,
	"additionalInstructions": "Optional additional instructions...",
	"isBelated": false,
	"length": "medium"
}
```

**Response**:

```json
{
	"success": true,
	"wishes": [
		{
			"id": "string",
			"type": "normal",
			"eventType": "birthday",
			"relations": ["friend"],
			"ageGroups": ["young"],
			"specificValues": [25],
			"text": "Generated wish...",
			"isBelated": false,
			"language": "de",
			"length": "medium",
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	],
	"totalGenerated": 3,
	"message": "3 Wünsche erfolgreich generiert"
}
```

### 5. AI Health Check

**Endpoint**: `GET /api/ai/generate`  
**Description**: Check AI service health and configuration.

**Authentication**: Required (Session)

**Response**:

```json
{
	"status": "healthy",
	"service": "OpenRouter AI",
	"details": "Service status details...",
	"models": ["available", "models"],
	"hasApiKey": true,
	"timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6. Suggest Specific Values

**Endpoint**: `POST /api/ai/suggest-values`  
**Description**: Get AI-generated suggestions for specific values descriptions.

**Authentication**: Required (Session + Role: Administrator)

**Request Body**:

```json
{
	"eventType": "birthday",
	"language": "de"
}
```

**Response**:

```json
{
	"success": true,
	"description": "Generated description for specific values...",
	"message": "Beschreibung für birthday (de) generiert"
}
```

### 7. Release Wish

**Endpoint**: `POST /api/wishes/{id}/release`  
**Description**: Release a wish for public API access.

**Authentication**: Required (Session)

**Path Parameters**:

- `id` (required): Wish ID

**Response**:

```json
{
	"success": true,
	"releasedWish": {
		"id": "string",
		"originalWishId": "string",
		"releasedAt": "2024-01-01T00:00:00.000Z"
	},
	"message": "Wish successfully released for WishSnap"
}
```

### 8. Unrelease Wish

**Endpoint**: `DELETE /api/wishes/{id}/release`  
**Description**: Remove a wish from public API access.

**Authentication**: Required (Session)

**Path Parameters**:

- `id` (required): Wish ID

**Response**:

```json
{
	"success": true,
	"message": "Wish successfully unreleased"
}
```

## System Endpoints

### 9. System Initialization Status

**Endpoint**: `GET /api/system/init-status`  
**Description**: Check if the system has been initialized.

**Authentication**: Not required

**Response**:

```json
{
	"status": "success",
	"data": {
		"isInitialized": true,
		"hasAdminUsers": true,
		"requiresSetup": false,
		"initializationInfo": {
			"adminEmail": "admin@example.com",
			"completedAt": "2024-01-01T00:00:00.000Z"
		}
	},
	"timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 10. Setup Admin User

**Endpoint**: `POST /api/system/setup-admin`  
**Description**: Create initial admin user during system setup.

**Authentication**: Preset password required

**Request Body**:

```json
{
	"presetPassword": "WishFactory2024!",
	"adminEmail": "admin@example.com",
	"adminFullName": "Admin User",
	"adminPassword": "securepassword123"
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Admin user created successfully",
	"data": {
		"userId": "string",
		"email": "admin@example.com",
		"fullName": "Admin User",
		"emailConfirmationRequired": true
	},
	"timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Test Endpoints

### 11. Database Connection Test

**Endpoint**: `GET /api/test/db-connection`  
**Description**: Test database connectivity.

**Authentication**: Not required

**Response**:

```json
{
	"status": "success",
	"message": "Database connection successful",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"env": {
		"supabaseUrl": "set",
		"serviceRoleKey": "set",
		"nodeEnv": "development"
	}
}
```

### 12. Environment Check

**Endpoint**: `GET /api/test/env-check`  
**Description**: Check environment variables configuration.

**Authentication**: Not required

**Response**:

```json
{
	"status": "success",
	"message": "Environment check successful",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"environment": {
		"nodeEnv": "development",
		"supabaseUrl": "https://xxx.supabase.co...",
		"anonKey": "eyJhbGciOiJIUzI1NiIs...",
		"serviceRoleKey": "eyJhbGciOiJIUzI1NiIs...",
		"openaiKey": "sk-1234567890abcdef...",
		"openrouterKey": "sk-or-v1-1234567890..."
	}
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
	"error": {
		"code": "ERROR_CODE",
		"message": "Human readable error message",
		"timestamp": "2024-01-01T00:00:00.000Z"
	}
}
```

### Common Error Codes

#### Public API Errors

- `MISSING_API_KEY` (401): API key not provided
- `INVALID_API_KEY` (401): Invalid or expired API key
- `RATE_LIMIT_EXCEEDED` (429): Rate limit exceeded
- `WISH_NOT_FOUND` (404): Requested wish not found
- `INTERNAL_ERROR` (500): Internal server error

#### Private API Errors

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request data
- `AI_SERVICE_ERROR` (500): AI service unavailable

## Rate Limiting

The public API implements rate limiting per API key:

- Default limit: Configurable per API key
- Rate limit headers included in responses
- `429 Too Many Requests` when exceeded

## CORS Support

All public endpoints support CORS with the following headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization`

## Data Model

### Wish Object

```typescript
interface Wish {
	id: string;
	type: 'normal' | 'heartfelt' | 'funny';
	eventType: 'birthday' | 'anniversary' | 'custom';
	relations: ('friend' | 'family' | 'partner' | 'colleague')[];
	ageGroups: ('young' | 'middle' | 'senior' | 'all')[];
	specificValues: number[];
	text: string;
	isBelated: boolean;
	language: string;
	length: 'short' | 'medium' | 'long';
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
	releasedAt?: string; // ISO date string
}
```

## SDK Integration

This API is designed to be consumed by the WishSnap mobile application and other external integrations. For JavaScript/TypeScript applications, consider using the generated TypeScript types and implementing proper error handling for rate limiting and authentication.

## Security Considerations

1. **API Keys**: Store securely and rotate regularly
2. **Rate Limiting**: Implement client-side rate limiting awareness
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: All inputs are validated server-side
5. **Authentication**: Session-based auth for private endpoints
6. **Authorization**: Role-based access control implemented

## Support

For API support and issues, please contact the development team or check the system logs for detailed error information.
