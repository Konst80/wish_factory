import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { WishStatus, EventType, Language, Relation, AgeGroup } from '$lib/types/Wish';
import type { WishFilters } from '$lib/utils/wishUtils';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Get parent layout data (includes profile)
	const { profile } = await parent();
	// Extract filters from URL parameters with proper typing
	const search = url.searchParams.get('search') || '';
	const language = (url.searchParams.get('language') as Language | '') || '';
	const status = (url.searchParams.get('status') as WishStatus | '') || '';
	const eventType = (url.searchParams.get('eventType') as EventType | '') || '';
	const relations =
		(url.searchParams.get('relations')?.split(',').filter(Boolean) as Relation[]) || [];
	const ageGroups =
		(url.searchParams.get('ageGroups')?.split(',').filter(Boolean) as AgeGroup[]) || [];
	const belated = url.searchParams.get('belated') || '';

	// Extract sorting parameters
	const sortBy = url.searchParams.get('sortBy') || 'created_at';
	const sortOrder = url.searchParams.get('sortOrder') || 'desc';

	// Check for success messages
	const deleted = url.searchParams.get('deleted') === 'true';
	const deletedCount = url.searchParams.get('count') ? parseInt(url.searchParams.get('count')!) : 1;

	const filters: WishFilters = {
		search: search || undefined,
		language: language || undefined,
		status: status || undefined,
		eventType: eventType || undefined,
		relations: relations.length > 0 ? relations : undefined,
		ageGroups: ageGroups.length > 0 ? ageGroups : undefined,
		belated: belated || undefined
	};

	// Define sortable columns mapping
	const sortableColumns: Record<string, string> = {
		created_at: 'created_at',
		updated_at: 'updated_at',
		status: 'status',
		language: 'language',
		event_type: 'event_type',
		text: 'text'
	};

	// Build query
	let query = locals.supabase.from('wishes').select('*');

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
	if (belated) {
		const isBelated = belated === 'true';
		query = query.eq('belated', isBelated);
	}

	// Apply sorting with validation
	const validSortBy = sortableColumns[sortBy] || 'created_at';
	const ascending = sortOrder === 'asc';

	const { data: wishes = [], error: wishError } = await query.order(validSortBy, {
		ascending
	});

	if (wishError) {
		console.error('Error fetching wishes:', wishError);
	}

	// Get creator names for wishes
	const creatorIds = [...new Set((wishes || []).map((w) => w.created_by).filter(Boolean))];
	let creators: { id: string; full_name: string }[] = [];

	if (creatorIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('id, full_name')
			.in('id', creatorIds);
		creators = profiles || [];
	}

	// Transform wishes with creator names
	const transformedWishes = (wishes || []).map((wish) => ({
		id: wish.id,
		type: wish.type,
		eventType: wish.event_type,
		relations: wish.relations,
		ageGroups: wish.age_groups,
		specificValues: wish.specific_values,
		text: wish.text,
		belated: wish.belated,
		status: wish.status,
		language: wish.language,
		createdAt: wish.created_at,
		updatedAt: wish.updated_at,
		createdBy: creators.find((c) => c.id === wish.created_by)?.full_name || 'Unbekannt'
	}));

	// Calculate statistics
	const { data: stats } = await locals.supabase.from('wishes').select('status');
	const statistics = {
		total: stats?.length || 0,
		entwurf: stats?.filter((w) => w.status === 'Entwurf').length || 0,
		zurFreigabe: stats?.filter((w) => w.status === 'Zur Freigabe').length || 0,
		freigegeben: stats?.filter((w) => w.status === 'Freigegeben').length || 0
	};

	return {
		wishes: transformedWishes,
		filters,
		stats: statistics,
		deleted,
		deletedCount,
		profile,
		sorting: {
			sortBy,
			sortOrder
		}
	};
};

export const actions: Actions = {
	bulkDelete: async ({ request, locals }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Only administrators can bulk delete
		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung zum Löschen von Wünschen' });
		}

		const formData = await request.formData();
		const wishIds = formData.getAll('wishIds') as string[];

		if (!wishIds || wishIds.length === 0) {
			return fail(400, { message: 'Keine Wünsche zum Löschen ausgewählt' });
		}

		try {
			// Delete the wishes
			const { error: deleteError } = await locals.supabase
				.from('wishes')
				.delete()
				.in('id', wishIds);

			if (deleteError) {
				console.error('Error deleting wishes:', deleteError);
				return fail(500, {
					message: 'Fehler beim Löschen der Wünsche: ' + deleteError.message
				});
			}

			// Redirect with success message
			throw redirect(303, `/dashboard/wishes?deleted=true&count=${wishIds.length}`);
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			console.error('Unexpected error in bulk delete:', error);
			return fail(500, {
				message: 'Ein unerwarteter Fehler ist aufgetreten'
			});
		}
	}
};
