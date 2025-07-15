import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get authenticated user
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(302, '/auth/login');
	}

	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!profile || profile.role !== 'Administrator') {
		throw redirect(302, '/dashboard/wishes');
	}

	// Get similarity cron statistics
	const [
		{ data: totalWishes },
		{ data: wishesWithSimilarities },
		{ data: orphanedWishes },
		{ data: lastExecution }
	] = await Promise.all([
		// Total wishes
		locals.supabase.from('wishes').select('id', { count: 'exact' }).eq('status', 'Freigegeben'),

		// Wishes with similarities
		locals.supabase
			.from('wishes')
			.select('id', { count: 'exact' })
			.eq('status', 'Freigegeben')
			.not('similarity_updated_at', 'is', null),

		// Orphaned wishes (need processing)
		locals.supabase
			.from('wishes')
			.select('id', { count: 'exact' })
			.eq('status', 'Freigegeben')
			.or('similarity_updated_at.is.null,similarity_updated_at.lt.updated_at'),

		// Last execution timestamp
		locals.supabase
			.from('wishes')
			.select('similarity_updated_at')
			.eq('status', 'Freigegeben')
			.not('similarity_updated_at', 'is', null)
			.order('similarity_updated_at', { ascending: false })
			.limit(1)
	]);

	const stats = {
		totalWishes: totalWishes?.length || 0,
		withSimilarities: wishesWithSimilarities?.length || 0,
		withoutSimilarities: orphanedWishes?.length || 0,
		successRate: totalWishes?.length
			? ((wishesWithSimilarities?.length || 0) / totalWishes.length) * 100
			: 0
	};

	// Check if GitHub Actions is configured (simplified check)
	const githubActionsConfigured = process.env.GITHUB_ACTIONS_CONFIGURED === 'true' || false;

	return {
		user,
		profile,
		similarityCron: {
			isEnabled: true, // Can be made configurable later
			orphanedWishes: orphanedWishes?.length || 0,
			lastExecution: lastExecution?.[0]?.similarity_updated_at || null,
			githubActionsConfigured,
			stats
		}
	};
};
