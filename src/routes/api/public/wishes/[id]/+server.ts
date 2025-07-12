import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
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
			belated: wish.belated,
			language: wish.language,
			length: wish.length,
			releasedAt: wish.releasedAt.toISOString()
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