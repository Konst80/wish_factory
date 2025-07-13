import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';

export const GET: RequestHandler = async () => {
	try {
		// Get metadata from service
		const metadata = await releasedWishesService.getMetadata();

		// Format response for API
		const apiResponse = {
			types: metadata.types,
			eventTypes: metadata.eventTypes,
			relations: metadata.relations,
			ageGroups: metadata.ageGroups,
			languages: metadata.languages,
			lengths: metadata.lengths,
			totalCount: metadata.totalCount,
			lastUpdated: metadata.lastUpdated.toISOString()
		};

		// Set CORS headers for public API
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Cache-Control': 'public, max-age=600', // 10 minutes cache for metadata
			'Content-Type': 'application/json'
		};

		return json(apiResponse, { headers });
	} catch (error) {
		console.error('Public API metadata error:', error);

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
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
