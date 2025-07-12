import type { PageServerLoad } from './$types';
import { releasedWishesService } from '$lib/server/released-wishes-service';
import { createSupabaseServerClientFromSvelteKit } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Check authentication
	const supabase = createSupabaseServerClientFromSvelteKit(cookies);
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	
	if (authError || !user) {
		throw redirect(302, '/auth/login');
	}

	try {
		// Parse query parameters for filtering
		const searchParams = url.searchParams;
		const options = {
			language: searchParams.get('language') || undefined,
			type: searchParams.get('type') || undefined,
			eventType: searchParams.get('eventType') || undefined,
			length: searchParams.get('length') || undefined,
			belated: searchParams.get('belated') ? searchParams.get('belated') === 'true' : undefined,
			limit: 50, // Reasonable limit for dashboard
			offset: parseInt(searchParams.get('page') || '1') <= 1 ? 0 : (parseInt(searchParams.get('page') || '1') - 1) * 50
		};

		// Get released wishes and metadata
		const [releasedWishesResult, metadata] = await Promise.all([
			releasedWishesService.getReleasedWishes(options),
			releasedWishesService.getMetadata()
		]);

		return {
			releasedWishes: releasedWishesResult.wishes,
			total: releasedWishesResult.total,
			hasMore: releasedWishesResult.hasMore,
			currentPage: parseInt(searchParams.get('page') || '1'),
			filters: {
				language: options.language,
				type: options.type,
				eventType: options.eventType,
				length: options.length,
				belated: options.belated
			},
			metadata: {
				types: metadata.types,
				eventTypes: metadata.eventTypes,
				languages: metadata.languages,
				lengths: metadata.lengths,
				totalCount: metadata.totalCount,
				lastUpdated: metadata.lastUpdated
			}
		};
	} catch (error) {
		console.error('Load released wishes error:', error);
		return {
			releasedWishes: [],
			total: 0,
			hasMore: false,
			currentPage: 1,
			filters: {},
			metadata: {
				types: [],
				eventTypes: [],
				languages: [],
				lengths: [],
				totalCount: 0,
				lastUpdated: new Date()
			},
			error: 'Failed to load released wishes'
		};
	}
};