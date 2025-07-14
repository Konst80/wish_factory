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
	 * Activate an API key
	 */
	static async activateApiKey(keyId: string): Promise<boolean> {
		try {
			const { error } = await this.supabase
				.from('api_keys')
				.update({ is_active: true })
				.eq('id', keyId);

			return !error;
		} catch (error) {
			console.error('Error activating API key:', error);
			return false;
		}
	}

	/**
	 * Delete an API key
	 */
	static async deleteApiKey(keyId: string): Promise<boolean> {
		try {
			const { error } = await this.supabase.from('api_keys').delete().eq('id', keyId);

			return !error;
		} catch (error) {
			console.error('Error deleting API key:', error);
			return false;
		}
	}

	/**
	 * Update an API key (rate limit and other settings)
	 */
	static async updateApiKey(
		keyId: string,
		updates: {
			rateLimitPerHour?: number;
			description?: string;
			expiresAt?: Date | null;
		}
	): Promise<boolean> {
		try {
			const updateData: Record<string, unknown> = {};

			if (updates.rateLimitPerHour !== undefined) {
				updateData.rate_limit_per_hour = updates.rateLimitPerHour;
			}
			if (updates.description !== undefined) {
				updateData.description = updates.description;
			}
			if (updates.expiresAt !== undefined) {
				updateData.expires_at = updates.expiresAt?.toISOString() || null;
			}

			const { error } = await this.supabase.from('api_keys').update(updateData).eq('id', keyId);

			return !error;
		} catch (error) {
			console.error('Error updating API key:', error);
			return false;
		}
	}

	/**
	 * Check rate limiting for an API key
	 * TODO: Implement proper rate limiting with api_usage table once database schema is updated
	 */
	static async checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number }> {
		try {
			// Fallback implementation - always allow for now
			// In production, this should be replaced with proper database-based rate limiting
			console.log(`Rate limit check for API key ${apiKey.id} - allowing request (fallback mode)`);

			const remaining = Math.max(0, apiKey.rateLimitPerHour - 1); // Simulate 1 request used
			const allowed = true; // Always allow for now

			return { allowed, remaining };
		} catch (error) {
			console.error('Error checking rate limit:', error);
			return { allowed: false, remaining: 0 };
		}
	}

	/**
	 * Increment usage counter for rate limiting
	 * TODO: Implement proper usage tracking once api_usage table is added to database schema
	 */
	private static async incrementUsage(apiKeyId: string, hourTimestamp: number): Promise<void> {
		try {
			// Placeholder implementation - log usage for now
			console.log(`Usage increment for API key ${apiKeyId} at ${hourTimestamp} (fallback mode)`);

			// Update last_used_at timestamp for the API key
			const supabase = createSupabaseAdminClient();
			await supabase
				.from('api_keys')
				.update({ last_used_at: new Date().toISOString() })
				.eq('id', apiKeyId);
		} catch (error) {
			console.error('Error incrementing usage:', error);
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
