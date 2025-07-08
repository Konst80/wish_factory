import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Get parent layout data (includes profile)
	const { profile, userTheme } = await parent();

	try {
		// Get all wishes statistics
		const { data: allWishes } = await locals.supabase
			.from('wishes')
			.select('id, status, created_by, created_at');

		// Get user's own wishes
		const { data: userWishes } = await locals.supabase
			.from('wishes')
			.select('id, status, created_at')
			.eq('created_by', session.user.id);

		// Calculate today's date for recent activity tracking
		const today = new Date();
		const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

		// Calculate statistics
		const totalWishes = allWishes?.length || 0;
		const userWishCount = userWishes?.length || 0;

		const pendingWishes = allWishes?.filter((w) => w.status === 'Zur Freigabe').length || 0;
		const approvedWishes = allWishes?.filter((w) => w.status === 'Freigegeben').length || 0;

		// Recent activity (wishes created today)
		const todayWishes =
			allWishes?.filter((w) => new Date(w.created_at) >= startOfToday).length || 0;

		// Get recent wishes for activity feed
		const { data: recentWishes } = await locals.supabase
			.from('wishes')
			.select(
				`
				id,
				text,
				status,
				created_at,
				profiles!wishes_created_by_fkey(full_name)
			`
			)
			.order('created_at', { ascending: false })
			.limit(5);

		// Transform recent wishes for display
		const recentActivities = (recentWishes || []).map((wish) => ({
			id: wish.id,
			title: wish.text?.substring(0, 50) + (wish.text?.length > 50 ? '...' : ''),
			status: wish.status,
			createdAt: wish.created_at,
			createdBy: wish.profiles?.full_name || 'Unbekannt'
		}));

		// Get activity data (wishes created over time)
		const { data: wishActivity } = await locals.supabase
			.from('wishes')
			.select('created_at')
			.eq('author_id', session.user.id)
			.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

		return {
			stats: {
				totalWishes,
				userWishes: userWishCount,
				pendingWishes,
				approvedWishes,
				todayWishes
			},
			recentActivities,
			user: {
				name: profile?.full_name || session.user.email || 'Benutzer',
				isAdmin: profile?.role === 'Administrator'
			},
			userTheme,
			recentWishes: recentWishes || [],
			wishActivity: wishActivity || []
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);

		// Return fallback data in case of error
		return {
			stats: {
				totalWishes: 0,
				userWishes: 0,
				pendingWishes: 0,
				approvedWishes: 0,
				todayWishes: 0
			},
			recentActivities: [],
			user: {
				name: profile?.full_name || session.user.email || 'Benutzer',
				isAdmin: profile?.role === 'Administrator'
			},
			userTheme,
			recentWishes: [],
			wishActivity: []
		};
	}
};
