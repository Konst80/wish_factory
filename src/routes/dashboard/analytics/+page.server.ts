import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
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

		// Get language from global language cookie (managed by Paraglide)
		const selectedLanguage = cookies.get('PARAGLIDE_LOCALE') || 'de';

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

		// Build query with language filter
		const buildWishQuery = (query: any) => {
			// Always filter by the selected language (no "all" option since we use global language)
			return query.eq('language', selectedLanguage);
		};

		// Type for wish data
		type WishData = {
			status: string;
			event_type: string;
			language: string;
			created_at: string;
			created_by: string;
			type: string;
			relations: string[];
			age_groups: string[];
			belated: boolean | string;
		};

		// Get overview statistics
		const [wishesResult, usersResult, publishedResult] = await Promise.all([
			// Total wishes (filtered by language)
			buildWishQuery(locals.supabase.from('wishes').select('id', { count: 'exact' })),

			// Total users
			locals.supabase.from('profiles').select('id', { count: 'exact' }),

			// Published wishes (filtered by language)
			buildWishQuery(
				locals.supabase.from('wishes').select('id', { count: 'exact' }).eq('status', 'Freigegeben')
			)
		]);

		const overview = {
			totalWishes: wishesResult.count || 0,
			totalUsers: usersResult.count || 0,
			totalPublished: publishedResult.count || 0,
			averageRating: 4.7 // Placeholder until we have ratings
		};

		// Get wishes by status for distribution (filtered by language)
		const { data: allWishes } = await buildWishQuery(
			locals.supabase
				.from('wishes')
				.select(
					'status, event_type, language, created_at, created_by, type, relations, age_groups, belated'
				)
		);

		if (!allWishes) {
			throw new Error('Fehler beim Laden der Wunsch-Daten');
		}

		const typedWishes = allWishes as WishData[];

		// Calculate status distribution
		const statusCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				acc[wish.status] = (acc[wish.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
			status,
			count,
			percentage: Math.round((count / typedWishes.length) * 100 * 10) / 10
		}));

		// Calculate category distribution
		const categoryCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				const eventType =
					wish.event_type === 'birthday'
						? 'Geburtstag'
						: wish.event_type === 'anniversary'
							? 'Hochzeitstag'
							: 'Individuell';
				acc[eventType] = (acc[eventType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
			category,
			count,
			percentage: Math.round((count / typedWishes.length) * 100 * 10) / 10
		}));

		// Calculate language distribution (unfiltered - show all languages)
		const { data: allWishesForLanguage } = await locals.supabase.from('wishes').select('language');

		const allWishesForLanguageTyped = (allWishesForLanguage || []) as { language: string }[];

		const languageCounts = allWishesForLanguageTyped.reduce(
			(acc: Record<string, number>, wish: { language: string }) => {
				const language = wish.language === 'de' ? 'Deutsch' : 'English';
				acc[language] = (acc[language] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const languageDistribution = Object.entries(languageCounts).map(([language, count]) => ({
			language,
			count,
			percentage: Math.round((count / allWishesForLanguageTyped.length) * 100 * 10) / 10
		}));

		// Calculate type/style distribution
		const typeCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				const type =
					wish.type === 'normal'
						? 'Normal'
						: wish.type === 'herzlich'
							? 'Herzlich'
							: wish.type === 'humorvoll'
								? 'Humorvoll'
								: 'Normal';
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const typeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
			type,
			count,
			percentage: Math.round((count / typedWishes.length) * 100 * 10) / 10
		}));

		// Calculate relations distribution (flatten arrays)
		const relationsCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				if (wish.relations && Array.isArray(wish.relations)) {
					wish.relations.forEach((relation: string) => {
						const relationLabel =
							relation === 'friend'
								? 'Freund/in'
								: relation === 'family'
									? 'Familie'
									: relation === 'partner'
										? 'Partner/in'
										: relation === 'colleague'
											? 'Kollege/in'
											: relation;
						acc[relationLabel] = (acc[relationLabel] || 0) + 1;
					});
				}
				return acc;
			},
			{} as Record<string, number>
		);

		const relationsDistribution = Object.entries(relationsCounts).map(([relation, count]) => ({
			relation,
			count,
			percentage:
				Math.round(
					(count / Object.values(relationsCounts).reduce((a: number, b: number) => a + b, 0)) *
						100 *
						10
				) / 10
		}));

		// Calculate age groups distribution (flatten arrays)
		const ageGroupsCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				if (wish.age_groups && Array.isArray(wish.age_groups)) {
					wish.age_groups.forEach((ageGroup: string) => {
						const ageGroupLabel =
							ageGroup === 'young'
								? 'Junge Menschen'
								: ageGroup === 'middle'
									? 'Mittleres Alter'
									: ageGroup === 'senior'
										? 'Senioren'
										: ageGroup === 'all'
											? 'Alle Altersgruppen'
											: ageGroup;
						acc[ageGroupLabel] = (acc[ageGroupLabel] || 0) + 1;
					});
				}
				return acc;
			},
			{} as Record<string, number>
		);

		const ageGroupsDistribution = Object.entries(ageGroupsCounts).map(([ageGroup, count]) => ({
			ageGroup,
			count,
			percentage:
				Math.round(
					(count / Object.values(ageGroupsCounts).reduce((a: number, b: number) => a + b, 0)) *
						100 *
						10
				) / 10
		}));

		// Calculate belated distribution
		const belatedCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				const belatedLabel = (
					typeof wish.belated === 'boolean' ? wish.belated : wish.belated === 'true'
				)
					? 'Nachträglich'
					: 'Normal';
				acc[belatedLabel] = (acc[belatedLabel] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const belatedDistribution = Object.entries(belatedCounts).map(([belated, count]) => ({
			belated,
			count,
			percentage: Math.round((count / typedWishes.length) * 100 * 10) / 10
		}));

		// Get wishes over time (daily for 7/30 days, monthly for longer periods)
		const wishesOverTime = [];

		if (timeRange === 'last-7-days' || timeRange === 'last-30-days') {
			// Daily grouping for shorter periods
			const days = timeRange === 'last-7-days' ? 7 : 15;

			for (let i = days - 1; i >= 0; i--) {
				const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
				const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

				const dayWishes = typedWishes.filter((wish: WishData) => {
					if (!wish.created_at) return false;
					const wishDate = new Date(wish.created_at);
					return wishDate >= dayStart && wishDate < dayEnd;
				});

				wishesOverTime.push({
					month: `${dayStart.getDate()}.${dayStart.getMonth() + 1}`,
					count: dayWishes.length
				});
			}
		} else {
			// Monthly grouping for longer periods
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

			const months = Math.min(
				12,
				Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
			);

			for (let i = months - 1; i >= 0; i--) {
				const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

				const monthWishes = typedWishes.filter((wish: WishData) => {
					if (!wish.created_at) return false;
					const wishDate = new Date(wish.created_at);
					return wishDate >= monthStart && wishDate <= monthEnd;
				});

				wishesOverTime.push({
					month: monthNames[monthStart.getMonth()],
					count: monthWishes.length
				});
			}
		}

		// Get user activity (top 5 creators)
		const userWishCounts = typedWishes.reduce(
			(acc: Record<string, number>, wish: WishData) => {
				acc[wish.created_by] = (acc[wish.created_by] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const topUserIds = Object.entries(userWishCounts)
			.sort(([, a], [, b]) => (b as number) - (a as number))
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
			const publishedWishes = typedWishes.filter(
				(w: WishData) => w.created_by === userId && w.status === 'Freigegeben'
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
			typeDistribution,
			relationsDistribution,
			ageGroupsDistribution,
			belatedDistribution,
			wishesOverTime,
			userActivity,
			timeRange,
			totalWishes: typedWishes.length
		};
	} catch (err) {
		console.error('Error loading analytics:', err);
		throw error(500, 'Fehler beim Laden der Analytics-Daten');
	}
};
