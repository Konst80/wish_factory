import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		
		// Parse query parameters
		const options = {
			language: searchParams.get('language') || undefined,
			type: searchParams.get('type') || undefined,
			eventType: searchParams.get('eventType') || undefined,
			length: searchParams.get('length') || undefined,
			belated: searchParams.get('belated') ? searchParams.get('belated') === 'true' : undefined,
			relations: searchParams.get('relations')?.split(',').filter(Boolean) || undefined,
			ageGroups: searchParams.get('ageGroups')?.split(',').filter(Boolean) || undefined,
			specificValues: searchParams.get('specificValues')?.split(',').map(Number).filter(n => !isNaN(n)) || undefined,
			limit: Math.min(parseInt(searchParams.get('limit') || '100'), 500),
			offset: parseInt(searchParams.get('offset') || '0'),
			since: searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined
		};

		// Get released wishes
		const result = await releasedWishesService.getReleasedWishes(options);
		
		// Format response for API
		const apiResponse = {
			wishes: result.wishes.map(wish => ({
				id: wish.id,
				originalWishId: wish.originalWishId,
				type: wish.type,
				eventType: wish.eventType,
				relations: wish.relations,
				ageGroups: wish.ageGroups,
				specificValues: wish.specificValues,
				text: wish.text,
				belated: wish.belated,
				language: wish.language,
				length: wish.length,
				releasedAt: wish.releasedAt.toISOString()
			})),
			total: result.total,
			limit: options.limit,
			offset: options.offset,
			hasMore: result.hasMore
		};
		
		// Set CORS headers for public API
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Cache-Control': 'public, max-age=300', // 5 minutes cache
			'Content-Type': 'application/json'
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
			'Access-Control-Allow-Headers': 'Content-Type',
		}
	});
};