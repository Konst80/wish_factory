import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Quick stats endpoint for live updates
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Authentication check
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Get quick stats
		const [{ data: totalWishes }, { data: wishesWithSimilarities }, { data: orphanedWishes }] =
			await Promise.all([
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
					.or('similarity_updated_at.is.null,similarity_updated_at.lt.updated_at')
			]);

		const stats = {
			totalWishes: totalWishes?.length || 0,
			withSimilarities: wishesWithSimilarities?.length || 0,
			withoutSimilarities: orphanedWishes?.length || 0,
			successRate: totalWishes?.length
				? ((wishesWithSimilarities?.length || 0) / totalWishes.length) * 100
				: 0
		};

		return json({
			orphanedWishes: orphanedWishes?.length || 0,
			stats
		});
	} catch (err) {
		console.error('❌ Stats fetch failed:', err);
		return json(
			{
				error: 'Stats fetch failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
