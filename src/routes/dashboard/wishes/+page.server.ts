import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import type { Wish, WishStatus, EventType, Language, Relation, AgeGroup } from '$lib/types/Wish';
import type { WishFilters } from '$lib/utils/wishUtils';

export const load: PageServerLoad = async ({ url }) => {
	// Extract filters from URL parameters with proper typing
	const search = url.searchParams.get('search') || '';
	const language = (url.searchParams.get('language') as Language | '') || '';
	const status = (url.searchParams.get('status') as WishStatus | '') || '';
	const eventType = (url.searchParams.get('eventType') as EventType | '') || '';
	const relations =
		(url.searchParams.get('relations')?.split(',').filter(Boolean) as Relation[]) || [];
	const ageGroups =
		(url.searchParams.get('ageGroups')?.split(',').filter(Boolean) as AgeGroup[]) || [];

	const filters: WishFilters = {
		search: search || undefined,
		language: language || undefined,
		status: status || undefined,
		eventType: eventType || undefined,
		relations: relations.length > 0 ? relations : undefined,
		ageGroups: ageGroups.length > 0 ? ageGroups : undefined
	};

	if (!supabase) {
		return {
			wishes: [] as Wish[],
			filters,
			stats: { total: 0, entwurf: 0, zurFreigabe: 0, freigegeben: 0 }
		};
	}

	// Build query
	let query = supabase.from('wishes').select(`
		*,
		creator:profiles(full_name)
	`);

	// Apply filters
	if (search) {
		query = query.or(`id.ilike.%${search}%,text.ilike.%${search}%`);
	}
	if (language) {
		query = query.eq('language', language);
	}
	if (status) {
		query = query.eq('status', status);
	}
	if (eventType) {
		query = query.eq('event_type', eventType);
	}
	if (relations.length > 0) {
		query = query.overlaps('relations', relations);
	}
	if (ageGroups.length > 0) {
		query = query.overlaps('age_groups', ageGroups);
	}

	const { data: wishes = [], error } = await query.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching wishes:', error);
	}

	// Calculate statistics
	const { data: stats } = await supabase.from('wishes').select('status');
	const statistics = {
		total: stats?.length || 0,
		entwurf: stats?.filter((w) => w.status === 'Entwurf').length || 0,
		zurFreigabe: stats?.filter((w) => w.status === 'Zur Freigabe').length || 0,
		freigegeben: stats?.filter((w) => w.status === 'Freigegeben').length || 0
	};

	return {
		wishes: wishes as Wish[],
		filters,
		stats: statistics
	};
};
