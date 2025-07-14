// API Key Service for managing and validating API keys
// File: src/lib/server/api-key-service.ts

import { createSupabaseAdminClient } from './supabase-admin';
import crypto from 'crypto';

export interface ApiKey {
	id: string;
	name: string;
	keyPrefix: string;
	description?: string;
	isActive: boolean;
	rateLimitPerHour: number;
	allowedEndpoints: string[];
	lastUsedAt?: Date;
	totalRequests: number;
	createdBy?: string;
	createdAt: Date;
	updatedAt: Date;
	expiresAt?: Date;
}

export interface CreateApiKeyRequest {
	name: string;
	description?: string;
	rateLimitPerHour?: number;
	allowedEndpoints?: string[];
	expiresAt?: Date;
}

export interface ApiKeyValidationResult {
	isValid: boolean;
	apiKey?: ApiKey;
	error?: string;
}

export class ApiKeyService {
	private static supabase = createSupabaseAdminClient();

	/**
	 * Generate a new API key
	 */
	static generateApiKey(): { key: string; prefix: string; hash: string } {
		// Generate a secure random key: wsk_[8char_prefix][36char_secret]
		const prefix = crypto.randomBytes(4).toString('hex'); // 8 characters
		const secret = crypto.randomBytes(18).toString('hex'); // 36 characters
		const key = `wsk_${prefix}${secret}`;

		// Hash the full key for storage using crypto
		const hash = crypto.createHash('sha256').update(key).digest('hex');

		return {
			key,
			prefix: `wsk_${prefix}`,
			hash
		};
	}

	/**
	 * Create a new API key
	 */
	static async createApiKey(
		request: CreateApiKeyRequest,
		createdBy?: string
	): Promise<{ apiKey: ApiKey; plainKey: string } | { error: string }> {
		try {
			const { key, prefix, hash } = this.generateApiKey();

			const { data, error } = await this.supabase
				.from('api_keys')
				.insert({
					name: request.name,
					key_hash: hash,
					key_prefix: prefix,
					description: request.description,
					rate_limit_per_hour: request.rateLimitPerHour || 1000,
					allowed_endpoints: request.allowedEndpoints || ['/api/public/wishes'],
					created_by: createdBy,
					expires_at: request.expiresAt?.toISOString()
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating API key:', error);
				return { error: 'Failed to create API key' };
			}

			return {
				apiKey: this.mapDbToApiKey(data),
				plainKey: key
			};
		} catch (error) {
			console.error('Error in createApiKey:', error);
			return { error: 'Internal server error' };
		}
	}

	/**
	 * Validate an API key and check permissions
	 */
	static async validateApiKey(apiKey: string, endpoint: string): Promise<ApiKeyValidationResult> {
		try {
			// Extract prefix from key for faster lookup
			if (!apiKey.startsWith('wsk_') || (apiKey.length !== 44 && apiKey.length !== 48)) {
				return { isValid: false, error: 'Invalid API key format' };
			}

			const prefix = apiKey.substring(0, 12); // wsk_ + 8 chars

			// Get API key from database using prefix
			const { data: apiKeys, error } = await this.supabase
				.from('api_keys')
				.select('*')
				.eq('key_prefix', prefix)
				.eq('is_active', true);

			if (error) {
				console.error('Error fetching API key:', error);
				return { isValid: false, error: 'Database error' };
			}

			if (!apiKeys || apiKeys.length === 0) {
				return { isValid: false, error: 'API key not found' };
			}

			// Check if any key matches the hash
			let matchedKey = null;
			const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
			for (const dbKey of apiKeys) {
				if (apiKeyHash === dbKey.key_hash) {
					matchedKey = dbKey;
					break;
				}
			}

			if (!matchedKey) {
				return { isValid: false, error: 'Invalid API key' };
			}

			const apiKeyObj = this.mapDbToApiKey(matchedKey);

			// Check if key is expired
			if (apiKeyObj.expiresAt && new Date() > apiKeyObj.expiresAt) {
				return { isValid: false, error: 'API key expired' };
			}

			// Check if endpoint is allowed
			if (!apiKeyObj.allowedEndpoints.includes(endpoint)) {
				return { isValid: false, error: 'Endpoint not allowed for this API key' };
			}

			// Update usage statistics (fire and forget)
			this.updateKeyUsage(apiKeyObj.id).catch(console.error);

			return { isValid: true, apiKey: apiKeyObj };
		} catch (error) {
			console.error('Error in validateApiKey:', error);
			return { isValid: false, error: 'Internal server error' };
		}
	}

	/**
	 * Update API key usage statistics
	 */
	private static async updateKeyUsage(keyId: string): Promise<void> {
		// Get current count, then increment
		const { data: currentKey } = await this.supabase
			.from('api_keys')
			.select('total_requests')
			.eq('id', keyId)
			.single();

		const newCount = (currentKey?.total_requests || 0) + 1;

		await this.supabase
			.from('api_keys')
			.update({
				last_used_at: new Date().toISOString(),
				total_requests: newCount
			})
			.eq('id', keyId);
	}

	/**
	 * Get all API keys (admin only)
	 */
	static async getApiKeys(): Promise<ApiKey[]> {
		try {
			const { data, error } = await this.supabase
				.from('api_keys')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching API keys:', error);
				return [];
			}

			return data?.map(this.mapDbToApiKey) || [];
		} catch (error) {
			console.error('Error in getApiKeys:', error);
			return [];
		}
	}

	/**
	 * Deactivate an API key
	 */
	static async deactivateApiKey(keyId: string): Promise<boolean> {
		try {
			const { error } = await this.supabase
				.from('api_keys')
				.update({ is_active: false })
				.eq('id', keyId);

			return !error;
		} catch (error) {
			console.error('Error deactivating API key:', error);
			return false;
		}
	}

	/**
	 * Check rate limiting for an API key
	 */
	static async checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number }> {
		try {
			// This is a simplified version - in production, you'd want to use Redis
			// For now, we'll just check against the total requests (not time-based)
			const requestsInLastHour = 0; // Placeholder - implement with proper time-based tracking

			const remaining = Math.max(0, apiKey.rateLimitPerHour - requestsInLastHour);
			const allowed = requestsInLastHour < apiKey.rateLimitPerHour;

			return { allowed, remaining };
		} catch (error) {
			console.error('Error checking rate limit:', error);
			return { allowed: false, remaining: 0 };
		}
	}

	/**
	 * Map database row to ApiKey interface
	 */
	private static mapDbToApiKey(data: Record<string, unknown>): ApiKey {
		return {
			id: data.id as string,
			name: data.name as string,
			keyPrefix: data.key_prefix as string,
			description: data.description as string | undefined,
			isActive: data.is_active as boolean,
			rateLimitPerHour: data.rate_limit_per_hour as number,
			allowedEndpoints: (data.allowed_endpoints as string[]) || [],
			lastUsedAt: data.last_used_at ? new Date(data.last_used_at as string) : undefined,
			totalRequests: (data.total_requests as number) || 0,
			createdBy: data.created_by as string | undefined,
			createdAt: new Date(data.created_at as string),
			updatedAt: new Date(data.updated_at as string),
			expiresAt: data.expires_at ? new Date(data.expires_at as string) : undefined
		};
	}
}
