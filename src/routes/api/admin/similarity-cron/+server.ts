import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createSimilarityPrecomputationService } from '$lib/server/similarity-precomputation.service';

/**
 * Manual Similarity Cron Endpoint
 * Can be triggered from admin interface or GitHub Actions
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const startTime = performance.now();

	try {
		console.log('🔄 Manual similarity cron job started');

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

		// Parse request body
		const body = await request.json();
		const { source = 'manual', batchSize = 50, forceRebuild = false } = body;

		console.log(`📊 Cron job triggered from: ${source}`);
		console.log(`📦 Batch size: ${batchSize}`);
		console.log(`🔄 Force rebuild: ${forceRebuild}`);

		// Initialize similarity service
		const similarityService = createSimilarityPrecomputationService(locals.supabase);

		// Step 1: Find wishes that need similarity updates
		let query = locals.supabase
			.from('wishes')
			.select('id, text, type, event_type, language, updated_at, similarity_updated_at')
			.eq('status', 'Freigegeben')
			.limit(batchSize);

		if (forceRebuild) {
			// Force rebuild: process all wishes
			console.log('🔄 Force rebuild mode - processing all wishes');
		} else {
			// Normal mode: only wishes without similarity data
			query = query.is('similarity_updated_at', null);
		}

		const { data: outdatedWishes, error: wishError } = await query;

		if (wishError) {
			console.error('❌ Error fetching outdated wishes:', wishError);
			return json({ error: 'Database error fetching wishes' }, { status: 500 });
		}

		if (!outdatedWishes || outdatedWishes.length === 0) {
			console.log('✅ No outdated wishes found');
			return json({
				success: true,
				message: 'No outdated wishes found',
				processed: 0,
				errors: 0,
				duration: performance.now() - startTime
			});
		}

		console.log(`📊 Found ${outdatedWishes.length} wishes needing similarity updates`);

		// Step 2: Process wishes in batch
		let processedCount = 0;
		let errorCount = 0;
		const processingErrors: string[] = [];

		for (const wish of outdatedWishes) {
			try {
				console.log(`🔍 Processing wish ${wish.id}...`);

				// Convert DB format to Wish interface
				const wishData = {
					id: wish.id,
					text: wish.text,
					type: wish.type,
					eventType: wish.event_type,
					language: wish.language,
					relations: [], // Not needed for similarity
					ageGroups: [], // Not needed for similarity
					specificValues: [],
					belated: false,
					status: 'Freigegeben' as const,
					length: 'medium' as const,
					createdAt: new Date(),
					updatedAt: wish.updated_at ? new Date(wish.updated_at) : new Date(),
					createdBy: ''
				};

				// Force rebuild: clear existing similarities
				if (forceRebuild) {
					await locals.supabase
						.from('wish_similarities')
						.delete()
						.or(`wish_id_1.eq.${wish.id},wish_id_2.eq.${wish.id}`);
				}

				// Compute similarities
				await similarityService.precomputeSimilarityForWish(wishData);

				// Update timestamp
				await locals.supabase
					.from('wishes')
					.update({ similarity_updated_at: new Date().toISOString() })
					.eq('id', wish.id);

				processedCount++;
				console.log(`✅ Processed wish ${wish.id} (${processedCount}/${outdatedWishes.length})`);
			} catch (wishError) {
				console.error(`❌ Error processing wish ${wish.id}:`, wishError);
				errorCount++;
				processingErrors.push(
					`${wish.id}: ${wishError instanceof Error ? wishError.message : 'Unknown error'}`
				);
			}
		}

		// Step 3: Cleanup old similarities (>7 days)
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - 7);

			const { error: cleanupError } = await locals.supabase
				.from('wish_similarities')
				.delete()
				.lt('calculated_at', cutoffDate.toISOString());

			if (cleanupError) {
				console.error('⚠️ Cleanup error:', cleanupError);
			} else {
				console.log('🧹 Cleaned up old similarity entries');
			}
		} catch (cleanupError) {
			console.error('⚠️ Cleanup failed:', cleanupError);
		}

		const duration = performance.now() - startTime;
		console.log(
			`🎉 Cron job completed: ${processedCount} processed, ${errorCount} errors, ${duration.toFixed(0)}ms`
		);

		return json({
			success: true,
			message: `Similarity cron job completed`,
			processed: processedCount,
			errors: errorCount,
			total: outdatedWishes.length,
			duration: Math.round(duration),
			source,
			processingErrors: processingErrors.length > 0 ? processingErrors : undefined
		});
	} catch (err) {
		console.error('❌ Cron job failed:', err);
		return json(
			{
				success: false,
				error: 'Internal server error',
				message: err instanceof Error ? err.message : 'Unknown error',
				duration: Math.round(performance.now() - startTime)
			},
			{ status: 500 }
		);
	}
};

/**
 * Health Check and Stats Endpoint
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

		// Get statistics
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
				.is('similarity_updated_at', null),

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

		return json({
			status: 'healthy',
			orphanedWishes: orphanedWishes?.length || 0,
			lastExecution: lastExecution?.[0]?.similarity_updated_at || null,
			stats,
			recommendations: {
				shouldRun: (orphanedWishes?.length || 0) > 0,
				urgency: (orphanedWishes?.length || 0) > 10 ? 'high' : 'low',
				nextRecommendedRun: (orphanedWishes?.length || 0) > 0 ? 'now' : 'not needed'
			}
		});
	} catch (err) {
		console.error('❌ Health check failed:', err);
		return json(
			{
				error: 'Health check failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
