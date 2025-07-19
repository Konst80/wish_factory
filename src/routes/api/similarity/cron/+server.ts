import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createSimilarityPrecomputationService } from '$lib/server/similarity-precomputation.service';

/**
 * Webhook-Endpoint für externe Cron-Services
 * Kann kostenlos mit GitHub Actions, Vercel Cron, oder anderen Services verwendet werden
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		console.log('🔄 Similarity cron webhook called');

		// Einfache Authentifizierung mit Secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'your-secret-key'}`;

		if (authHeader !== expectedAuth) {
			console.error('❌ Unauthorized cron request');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Initialisiere Similarity-Service
		const similarityService = createSimilarityPrecomputationService(locals.supabase);

		// Hole Wünsche mit veralteten Similarities
		const { data: outdatedWishes, error: wishError } = await locals.supabase
			.from('wishes')
			.select('id, text, type, event_type, language, updated_at, similarity_updated_at')
			.is('similarity_updated_at', null)
			.eq('status', 'Freigegeben')
			.limit(50); // Batch-Limit für Performance

		if (wishError) {
			console.error('❌ Error fetching outdated wishes:', wishError);
			return json({ error: 'Database error' }, { status: 500 });
		}

		if (!outdatedWishes || outdatedWishes.length === 0) {
			console.log('✅ No outdated wishes found');
			return json({
				success: true,
				message: 'No outdated wishes found',
				processed: 0
			});
		}

		console.log(`📊 Found ${outdatedWishes.length} wishes with outdated similarities`);

		// Verarbeite Wünsche in Batches
		let processedCount = 0;
		let errorCount = 0;

		for (const wish of outdatedWishes) {
			try {
				console.log(`🔍 Processing wish ${wish.id}...`);

				// Konvertiere DB-Format zu Wish-Interface
				const wishData = {
					id: wish.id,
					text: wish.text,
					type: wish.type,
					eventType: wish.event_type,
					language: wish.language,
					relations: [], // Nicht nötig für Similarity
					ageGroups: [], // Nicht nötig für Similarity
					specificValues: [],
					isBelated: false,
					status: 'Freigegeben' as const,
					length: 'medium' as const,
					createdAt: new Date().toISOString(),
					updatedAt: wish.updated_at ? new Date(wish.updated_at).toISOString() : new Date().toISOString(),
					createdBy: ''
				};

				// Führe Similarity-Vorberechnung aus
				await similarityService.precomputeSimilarityForWish(wishData);

				// Aktualisiere Timestamp
				await locals.supabase
					.from('wishes')
					.update({ similarity_updated_at: new Date().toISOString() })
					.eq('id', wish.id);

				processedCount++;
				console.log(`✅ Processed wish ${wish.id}`);
			} catch (wishError) {
				console.error(`❌ Error processing wish ${wish.id}:`, wishError);
				errorCount++;
			}
		}

		console.log(`🎉 Batch completed: ${processedCount} processed, ${errorCount} errors`);

		return json({
			success: true,
			message: `Similarity precomputation completed`,
			processed: processedCount,
			errors: errorCount,
			total: outdatedWishes.length
		});
	} catch (err) {
		console.error('❌ Cron webhook error:', err);
		return json(
			{
				error: 'Internal server error',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET-Endpoint für Health-Check
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Prüfe wie viele Wünsche Similarity-Updates brauchen
		const { data: outdatedWishes, error } = await locals.supabase
			.from('wishes')
			.select('id', { count: 'exact' })
			.or('similarity_updated_at.is.null,similarity_updated_at.lt.updated_at')
			.eq('status', 'Freigegeben');

		if (error) {
			return json({ error: 'Database error' }, { status: 500 });
		}

		// Prüfe letzte Cron-Ausführung
		const { data: lastExecution } = await locals.supabase
			.from('wishes')
			.select('similarity_updated_at')
			.not('similarity_updated_at', 'is', null)
			.order('similarity_updated_at', { ascending: false })
			.limit(1);

		return json({
			status: 'healthy',
			outdatedWishes: outdatedWishes?.length || 0,
			lastExecution: lastExecution?.[0]?.similarity_updated_at || null,
			nextRecommendedRun: outdatedWishes && outdatedWishes.length > 0 ? 'now' : 'tomorrow'
		});
	} catch (_err) {
		return json({ error: 'Health check failed' }, { status: 500 });
	}
};
