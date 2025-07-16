import { json, type RequestHandler } from '@sveltejs/kit';
import { createSimilarityService } from '$lib/server/similarity-service.js';
import { z } from 'zod';

const SimilarityCheckSchema = z.object({
	text: z.string().min(1, 'Text darf nicht leer sein'),
	language: z.enum(['de', 'en'], { required_error: 'Sprache ist erforderlich' }),
	type: z.enum(['normal', 'funny']).optional(),
	eventType: z.enum(['birthday', 'anniversary', 'custom']).optional(),
	excludeId: z.string().uuid().optional(),
	maxResults: z.number().int().min(1).max(10).optional()
});

const BatchSimilarityCheckSchema = z.object({
	texts: z.array(z.string().min(1)).min(1).max(10),
	language: z.enum(['de', 'en'], { required_error: 'Sprache ist erforderlich' }),
	type: z.enum(['normal', 'funny']).optional(),
	eventType: z.enum(['birthday', 'anniversary', 'custom']).optional(),
	maxResults: z.number().int().min(1).max(10).optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const body = await request.json();
		const contentType = request.headers.get('content-type');

		if (!contentType?.includes('application/json')) {
			return json({ error: 'Content-Type muss application/json sein' }, { status: 400 });
		}

		// Service erstellen
		const similarityService = createSimilarityService(locals.supabase, {
			maxResults: body.maxResults || 5,
			includeArchived: true,
			duplicateThreshold: 0.9,
			cacheResults: true
		});

		// Batch-Check oder einzelner Check?
		if (body.texts && Array.isArray(body.texts)) {
			// Batch-Ähnlichkeitscheck
			const validation = BatchSimilarityCheckSchema.safeParse(body);
			if (!validation.success) {
				return json(
					{
						error: 'Ungültige Eingabe',
						details: validation.error.flatten().fieldErrors
					},
					{ status: 400 }
				);
			}

			const { texts, language, type, eventType } = validation.data;

			const results = await similarityService.batchCheckSimilarity(texts, {
				language,
				type,
				eventType
			});

			return json({
				success: true,
				results,
				totalTexts: texts.length,
				duplicatesFound: results.filter((r) => r.isDuplicate).length
			});
		} else {
			// Einzelner Ähnlichkeitscheck
			const validation = SimilarityCheckSchema.safeParse(body);
			if (!validation.success) {
				return json(
					{
						error: 'Ungültige Eingabe',
						details: validation.error.flatten().fieldErrors
					},
					{ status: 400 }
				);
			}

			const { text, language, type, eventType, excludeId } = validation.data;

			const result = await similarityService.checkSimilarity(text, {
				language,
				type,
				eventType,
				excludeId
			});

			return json({
				success: true,
				...result,
				warning: result.isDuplicate ? 'Sehr ähnlicher Wunsch bereits vorhanden' : null
			});
		}
	} catch (error) {
		console.error('Fehler beim Ähnlichkeitscheck:', error);
		return json({ error: 'Interner Serverfehler beim Ähnlichkeitscheck' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const wishId = url.searchParams.get('wishId');
		const language = url.searchParams.get('language') as 'de' | 'en' | null;
		const type = url.searchParams.get('type') as 'normal' | 'funny' | null;
		const eventType = url.searchParams.get('eventType') as
			| 'birthday'
			| 'anniversary'
			| 'custom'
			| null;
		const action = url.searchParams.get('action');

		console.log('Similarity API GET request:', { wishId, language, type, eventType, action });

		// Verschiedene Aktionen je nach Parameter
		if (action === 'stats') {
			// Validate that language is provided for language-specific evaluation
			if (!language) {
				return json(
					{
						error: 'Sprache ist erforderlich für die Ähnlichkeitsstatistiken',
						details: { language: ['Sprache muss angegeben werden'] }
					},
					{ status: 400 }
				);
			}

			// Statistiken abrufen mit allen Wünschen einschließlich Entwürfe
			const statsService = createSimilarityService(locals.supabase as any, {
				includeArchived: true,
				maxResults: 10
			});
			const stats = await statsService.getSimilarityStats(language);
			const cacheStats = await statsService.getCacheStats();

			return json({
				success: true,
				stats,
				cache: cacheStats
			});
		}

		if (wishId) {
			// Ähnliche Wünsche zu einem bestehenden Wunsch finden
			if (
				!wishId.match(
					/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
				)
			) {
				return json({ error: 'Ungültige Wunsch-ID' }, { status: 400 });
			}

			const wishService = createSimilarityService(locals.supabase as any, {
				includeArchived: true,
				maxResults: 10
			});

			try {
				// Note: findSimilarToWish will use the wish's language if not provided
				// This is acceptable since we're finding similar wishes to a specific wish
				const result = await wishService.findSimilarToWish(wishId, {
					language: language || undefined,
					type: type || undefined,
					eventType: eventType || undefined
				});

				return json({
					success: true,
					...result
				});
			} catch (error) {
				console.error('Fehler beim Finden ähnlicher Wünsche:', error);
				return json(
					{
						error: `Fehler beim Finden ähnlicher Wünsche: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
					},
					{ status: 400 }
				);
			}
		}

		// Keine spezifische Aktion -> Fehler
		return json({ error: 'Keine gültige Aktion spezifiziert' }, { status: 400 });
	} catch (error) {
		console.error('Fehler beim Ähnlichkeitscheck (GET):', error);
		return json({ error: 'Interner Serverfehler beim Ähnlichkeitscheck' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	try {
		// Authentifizierung prüfen
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		// Nur Administratoren können Cache leeren
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

		const similarityService = createSimilarityService(locals.supabase);
		const wishId = url.searchParams.get('wishId');

		if (wishId) {
			// Cache für spezifischen Wunsch invalidieren
			await similarityService.invalidateCacheForWish(wishId);
			return json({
				success: true,
				message: `Cache für Wunsch ${wishId} wurde invalidiert`
			});
		} else {
			// Gesamten Cache leeren
			similarityService.clearCache();
			return json({
				success: true,
				message: 'Cache wurde geleert'
			});
		}
	} catch (error) {
		console.error('Fehler beim Leeren des Caches:', error);
		return json({ error: 'Interner Serverfehler beim Leeren des Caches' }, { status: 500 });
	}
};
