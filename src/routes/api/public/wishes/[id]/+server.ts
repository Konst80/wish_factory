import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';
import { ApiKeyService } from '$lib/server/api-key-service';

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;

		// API Key Authentication
		const apiKey =
			request.headers.get('X-API-Key') ||
			request.headers.get('Authorization')?.replace('Bearer ', '');

		if (!apiKey) {
			return json(
				{
					error: {
						code: 'MISSING_API_KEY',
						message:
							'API key is required. Please provide it via X-API-Key header or Authorization header.',
						timestamp: new Date().toISOString()
					}
				},
				{
					status: 401,
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Content-Type': 'application/json'
					}
				}
			);
		}

		// Validate API key
		const validation = await ApiKeyService.validateApiKey(apiKey, '/api/public/wishes/{id}');

		if (!validation.isValid) {
			return json(
				{
					error: {
						code: 'INVALID_API_KEY',
						message: validation.error || 'Invalid API key',
						timestamp: new Date().toISOString()
					}
				},
				{
					status: 401,
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Content-Type': 'application/json'
					}
				}
			);
		}

		// Check rate limiting
		const rateLimit = await ApiKeyService.checkRateLimit(validation.apiKey!);
		if (!rateLimit.allowed) {
			return json(
				{
					error: {
						code: 'RATE_LIMIT_EXCEEDED',
						message: 'Rate limit exceeded. Please try again later.',
						rateLimitReset: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
						timestamp: new Date().toISOString()
					}
				},
				{
					status: 429,
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Content-Type': 'application/json',
						'X-RateLimit-Limit': validation.apiKey!.rateLimitPerHour.toString(),
						'X-RateLimit-Remaining': rateLimit.remaining.toString(),
						'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
					}
				}
			);
		}

		// Get released wish by ID
		const wish = await releasedWishesService.getReleasedWish(id);

		if (!wish) {
			const errorResponse = {
				error: {
					code: 'WISH_NOT_FOUND',
					message: 'Released wish not found',
					timestamp: new Date().toISOString()
				}
			};

			return json(errorResponse, {
				status: 404,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json'
				}
			});
		}

		// Format response for API
		const apiResponse = {
			id: wish.id,
			originalWishId: wish.originalWishId,
			type: wish.type,
			eventType: wish.eventType,
			relations: wish.relations,
			ageGroups: wish.ageGroups,
			specificValues: wish.specificValues,
			text: wish.text,
			isBelated: wish.isBelated,
			language: wish.language,
			length: wish.length,
			releasedAt: wish.releasedAt
		};

		// Set CORS headers for public API
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
			'Cache-Control': 'public, max-age=300', // 5 minutes cache
			'Content-Type': 'application/json',
			'X-RateLimit-Limit': validation.apiKey!.rateLimitPerHour.toString(),
			'X-RateLimit-Remaining': rateLimit.remaining.toString(),
			'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString(),
			'X-API-Key-Name': validation.apiKey!.name
		};

		return json(apiResponse, { headers });
	} catch (error) {
		console.error('Public API error:', error);

		const errorResponse = {
			error: {
				code: 'INTERNAL_ERROR',
				message: 'Internal server error',
				timestamp: new Date().toISOString()
			}
		};

		return json(errorResponse, {
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json'
			}
		});
	}
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization'
		}
	});
};
