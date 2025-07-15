import { json, type RequestHandler } from '@sveltejs/kit';
import { createSimilarityService } from '$lib/server/similarity-service.js';
import { z } from 'zod';

const PrecomputeSchema = z.object({
	wishId: z.string().uuid(),
	force: z.boolean().default(false)
});

const BatchPrecomputeSchema = z.object({
	wishIds: z.array(z.string().uuid()).min(1).max(50),
	force: z.boolean().default(false)
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		// Nur Administratoren können Vorberechnungen durchführen
		if (!session.user) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Nicht autorisiert' }, { status: 403 });
		}

		const body = await request.json();
		const contentType = request.headers.get('content-type');

		if (!contentType?.includes('application/json')) {
			return json({ error: 'Content-Type muss application/json sein' }, { status: 400 });
		}

		const similarityService = createSimilarityService(locals.supabase as any);

		// Batch-Vorberechnung oder einzelne Vorberechnung?
		if (body.wishIds && Array.isArray(body.wishIds)) {
			// Batch-Vorberechnung
			const validation = BatchPrecomputeSchema.safeParse(body);
			if (!validation.success) {
				return json(
					{
						error: 'Ungültige Eingabe',
						details: validation.error.flatten().fieldErrors
					},
					{ status: 400 }
				);
			}

			const { wishIds, force } = validation.data;
			const results = [];

			for (const wishId of wishIds) {
				try {
					// Wunsch aus DB laden
					const { data: wish, error } = await locals.supabase
						.from('wishes')
						.select('*')
						.eq('id', wishId)
						.single();

					if (error || !wish) {
						results.push({
							wishId,
							success: false,
							error: `Wunsch ${wishId} nicht gefunden`
						});
						continue;
					}

					// Cache invalidieren wenn force=true
					if (force) {
						await similarityService.invalidateCacheForWish(wishId);
					}

					// Vorberechnung durchführen
					const convertedWish = {
						...wish,
						eventType: wish.event_type,
						ageGroups: wish.age_groups,
						specificValues: wish.specific_values || [],
						createdAt: wish.created_at ? new Date(wish.created_at) : new Date(),
						updatedAt: wish.updated_at ? new Date(wish.updated_at) : new Date(),
						createdBy: wish.created_by,
						length: wish.length as any
					};
					await similarityService.precomputeSimilarityForWish(convertedWish);

					results.push({
						wishId,
						success: true,
						message: 'Ähnlichkeiten vorberechnet'
					});
				} catch (error) {
					results.push({
						wishId,
						success: false,
						error: `Fehler bei der Vorberechnung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
					});
				}
			}

			return json({
				success: true,
				results,
				totalProcessed: wishIds.length,
				successCount: results.filter((r) => r.success).length,
				errorCount: results.filter((r) => !r.success).length
			});
		} else {
			// Einzelne Vorberechnung
			const validation = PrecomputeSchema.safeParse(body);
			if (!validation.success) {
				return json(
					{
						error: 'Ungültige Eingabe',
						details: validation.error.flatten().fieldErrors
					},
					{ status: 400 }
				);
			}

			const { wishId, force } = validation.data;

			// Wunsch aus DB laden
			const { data: wish, error } = await locals.supabase
				.from('wishes')
				.select('*')
				.eq('id', wishId)
				.single();

			if (error || !wish) {
				return json({ error: `Wunsch ${wishId} nicht gefunden` }, { status: 404 });
			}

			// Cache invalidieren wenn force=true
			if (force) {
				await similarityService.invalidateCacheForWish(wishId);
			}

			// Vorberechnung durchführen
			const convertedWish = {
				...wish,
				eventType: wish.event_type,
				ageGroups: wish.age_groups,
				specificValues: wish.specific_values || [],
				createdAt: wish.created_at ? new Date(wish.created_at) : new Date(),
				updatedAt: wish.updated_at ? new Date(wish.updated_at) : new Date(),
				createdBy: wish.created_by,
				length: wish.length as any
			};
			await similarityService.precomputeSimilarityForWish(convertedWish);

			return json({
				success: true,
				wishId,
				message: 'Ähnlichkeiten erfolgreich vorberechnet'
			});
		}
	} catch (error) {
		console.error('Fehler bei der Ähnlichkeits-Vorberechnung:', error);
		return json({ error: 'Interner Serverfehler bei der Vorberechnung' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		// Nur Administratoren können Vorberechnungs-Status abrufen
		if (!session.user) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Nicht autorisiert' }, { status: 403 });
		}

		// Statistiken über vorberechnete Ähnlichkeiten
		const { data: totalWishes } = await locals.supabase.from('wishes').select('count').single();

		const { data: cachedSimilarities } = await (locals.supabase as any)
			.from('wish_similarities')
			.select('count')
			.single();

		const { data: recentlyUpdated } = await (locals.supabase as any)
			.from('wish_similarities')
			.select('count')
			.gte('calculated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
			.single();

		const { data: staleEntries } = await (locals.supabase as any)
			.from('wish_similarities')
			.select('count')
			.lt('calculated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
			.single();

		return json({
			success: true,
			statistics: {
				totalWishes: totalWishes?.count || 0,
				cachedSimilarities: cachedSimilarities?.count || 0,
				recentlyUpdated: recentlyUpdated?.count || 0,
				staleEntries: staleEntries?.count || 0,
				coveragePercentage: totalWishes?.count
					? Math.round(
							((cachedSimilarities?.count || 0) / (totalWishes.count * (totalWishes.count - 1))) *
								100
						)
					: 0
			}
		});
	} catch (error) {
		console.error('Fehler beim Abrufen der Vorberechnungs-Statistiken:', error);
		return json({ error: 'Interner Serverfehler beim Abrufen der Statistiken' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		// Nur Administratoren können veraltete Einträge aktualisieren
		if (!session.user) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Nicht autorisiert' }, { status: 403 });
		}

		const similarityService = createSimilarityService(locals.supabase as any);

		// Veraltete Ähnlichkeiten aktualisieren
		await similarityService.refreshStaleComparisons();

		return json({
			success: true,
			message: 'Veraltete Ähnlichkeiten wurden aktualisiert'
		});
	} catch (error) {
		console.error('Fehler beim Aktualisieren veralteter Ähnlichkeiten:', error);
		return json({ error: 'Interner Serverfehler beim Aktualisieren' }, { status: 500 });
	}
};
