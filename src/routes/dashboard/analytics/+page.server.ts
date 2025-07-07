import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Check if user is admin
	const { data: profiles } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id);

	const profile = profiles && profiles.length > 0 ? profiles[0] : null;

	if (!profile || profile.role !== 'Administrator') {
		throw error(403, 'Nur Administratoren können Analytics einsehen');
	}

	try {
		// Get time range from URL parameters
		const timeRange = url.searchParams.get('timeRange') || 'last-30-days';

		// Calculate date range
		const now = new Date();
		let startDate: Date;

		switch (timeRange) {
			case 'last-7-days':
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'last-30-days':
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case 'last-3-months':
				startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
				break;
			case 'last-year':
				startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
				break;
			default:
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		}

		// Get overview statistics
		const [wishesResult, usersResult, publishedResult] = await Promise.all([
			// Total wishes
			locals.supabase.from('wishes').select('id', { count: 'exact' }),

			// Total users
			locals.supabase.from('profiles').select('id', { count: 'exact' }),

			// Published wishes
			locals.supabase.from('wishes').select('id', { count: 'exact' }).eq('status', 'Freigegeben')
		]);

		const overview = {
			totalWishes: wishesResult.count || 0,
			totalUsers: usersResult.count || 0,
			totalPublished: publishedResult.count || 0,
			averageRating: 4.7 // Placeholder until we have ratings
		};

		// Get wishes by status for distribution
		const { data: allWishes } = await locals.supabase
			.from('wishes')
			.select('status, event_type, language, created_at, created_by');

		if (!allWishes) {
			throw new Error('Fehler beim Laden der Wunsch-Daten');
		}

		// Calculate status distribution
		const statusCounts = allWishes.reduce(
			(acc, wish) => {
				acc[wish.status] = (acc[wish.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
			status,
			count,
			percentage: Math.round((count / allWishes.length) * 100 * 10) / 10
		}));

		// Calculate category distribution
		const categoryCounts = allWishes.reduce(
			(acc, wish) => {
				const eventType =
					wish.event_type === 'birthday'
						? 'Geburtstag'
						: wish.event_type === 'anniversary'
							? 'Jubiläum'
							: 'Individuell';
				acc[eventType] = (acc[eventType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
			category,
			count,
			percentage: Math.round((count / allWishes.length) * 100 * 10) / 10
		}));

		// Calculate language distribution
		const languageCounts = allWishes.reduce(
			(acc, wish) => {
				const language = wish.language === 'de' ? 'Deutsch' : 'English';
				acc[language] = (acc[language] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const languageDistribution = Object.entries(languageCounts).map(([language, count]) => ({
			language,
			count,
			percentage: Math.round((count / allWishes.length) * 100 * 10) / 10
		}));

		// Get wishes over time (monthly for the selected period)
		const wishesOverTime = [];
		const monthNames = [
			'Jan',
			'Feb',
			'Mär',
			'Apr',
			'Mai',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Okt',
			'Nov',
			'Dez'
		];

		// Create monthly buckets for the time range
		const months = Math.min(
			12,
			Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
		);

		for (let i = months - 1; i >= 0; i--) {
			const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

			const monthWishes = allWishes.filter((wish) => {
				const wishDate = new Date(wish.created_at);
				return wishDate >= monthStart && wishDate <= monthEnd;
			});

			wishesOverTime.push({
				month: monthNames[monthStart.getMonth()],
				count: monthWishes.length
			});
		}

		// Get user activity (top 5 creators)
		const userWishCounts = allWishes.reduce(
			(acc, wish) => {
				acc[wish.created_by] = (acc[wish.created_by] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const topUserIds = Object.entries(userWishCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([userId]) => userId);

		// Get user names for top creators
		const { data: topUsers } = await locals.supabase
			.from('profiles')
			.select('id, full_name')
			.in('id', topUserIds);

		const userActivity = topUserIds.map((userId) => {
			const user = topUsers?.find((u) => u.id === userId);
			const totalWishes = userWishCounts[userId];
			const publishedWishes = allWishes.filter(
				(w) => w.created_by === userId && w.status === 'Freigegeben'
			).length;

			return {
				user: user?.full_name || 'Unbekannt',
				wishes: totalWishes,
				published: publishedWishes
			};
		});

		return {
			overview,
			statusDistribution,
			categoryDistribution,
			languageDistribution,
			wishesOverTime,
			userActivity,
			timeRange,
			totalWishes: allWishes.length
		};
	} catch (err) {
		console.error('Error loading analytics:', err);
		throw error(500, 'Fehler beim Laden der Analytics-Daten');
	}
};
