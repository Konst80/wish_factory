import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSimilarityService } from '$lib/server/similarity-service';
import type { Wish } from '$lib/types/Wish';
import type { SupabaseClient } from '@supabase/supabase-js';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const {
			wishes: specificWishes,
			threshold = 0.7,
			language
		} = await request.json().catch(() => ({}));

		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();

				const sendProgress = (progress: number) => {
					const progressData =
						JSON.stringify({
							type: 'progress',
							progress
						}) + '\n';
					controller.enqueue(encoder.encode(progressData));
				};

				const sendResult = (wish: Wish, cached: boolean = false) => {
					const resultData =
						JSON.stringify({
							type: 'result',
							wish,
							cached
						}) + '\n';
					controller.enqueue(encoder.encode(resultData));
				};

				const sendError = (error: string) => {
					const errorData =
						JSON.stringify({
							type: 'error',
							error
						}) + '\n';
					controller.enqueue(encoder.encode(errorData));
					controller.close();
				};

				const sendComplete = () => {
					const completeData =
						JSON.stringify({
							type: 'complete'
						}) + '\n';
					controller.enqueue(encoder.encode(completeData));
					controller.close();
				};

				// Process wishes asynchronously
				processWishesBatch(
					specificWishes,
					threshold,
					language,
					sendProgress,
					sendResult,
					sendError,
					sendComplete,
					locals
				);
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/json',
				'Transfer-Encoding': 'chunked'
			}
		});
	} catch (error) {
		console.error('Error in batch similarity analysis:', error);
		return json({ error: 'Internal server error during batch analysis' }, { status: 500 });
	}
};

async function getAllWishes(supabase: SupabaseClient, language?: string): Promise<Wish[]> {
	let query = supabase
		.from('wishes')
		.select('id, text, type, event_type, status, language, relations, age_groups, created_at')
		.in('status', ['Freigegeben', 'Entwurf', 'Zur Freigabe']);

	// Filter by language if specified
	if (language) {
		query = query.eq('language', language);
	}

	const { data: wishes, error } = await query.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching wishes:', error);
		return [];
	}

	// Transform database field names to match our interface
	const transformedWishes = (wishes || []).map((wish: Record<string, unknown>) => ({
		...wish,
		eventType: wish.event_type,
		ageGroups: wish.age_groups || [],
		relations: wish.relations || []
	}));

	console.log('Sample transformed wish:', transformedWishes[0]);
	return transformedWishes as Wish[];
}

async function getCachedSimilarityResults(
	supabase: SupabaseClient,
	wishes: Wish[],
	threshold: number
): Promise<any[]> {
	const cachedResults = [];

	// Get cached similarities for all wishes at once
	const wishIds = wishes.map((w) => w.id);
	const { data: cachedSimilarities, error } = await supabase
		.from('wish_similarities')
		.select(
			`
			wish_id_1,
			wish_id_2,
			overall_similarity,
			wishes1:wish_id_1(id, text, type, event_type, language, status, relations, age_groups, created_at),
			wishes2:wish_id_2(id, text, type, event_type, language, status, relations, age_groups, created_at)
		`
		)
		.or(`wish_id_1.in.(${wishIds.join(',')}),wish_id_2.in.(${wishIds.join(',')})`);
	// Note: Removed .gte() filter - we want ALL cached similarities, filter later

	if (error) {
		console.error('Error fetching cached similarities:', error);
		return [];
	}

	// Group similarities by wish ID
	const similaritiesByWish = new Map<string, any[]>();

	for (const similarity of cachedSimilarities || []) {
		const wish1Id = similarity.wish_id_1;
		const wish2Id = similarity.wish_id_2;

		// Add to both wishes' similarity lists
		if (wishIds.includes(wish1Id)) {
			if (!similaritiesByWish.has(wish1Id)) {
				similaritiesByWish.set(wish1Id, []);
			}
			similaritiesByWish.get(wish1Id)!.push({
				...similarity,
				targetWish: similarity.wishes2,
				isTarget: false
			});
		}

		if (wishIds.includes(wish2Id)) {
			if (!similaritiesByWish.has(wish2Id)) {
				similaritiesByWish.set(wish2Id, []);
			}
			similaritiesByWish.get(wish2Id)!.push({
				...similarity,
				targetWish: similarity.wishes1,
				isTarget: true
			});
		}
	}

	// Build results for wishes that have cached similarities
	for (const wish of wishes) {
		const similarities = similaritiesByWish.get(wish.id);
		if (similarities && similarities.length > 0) {
			// Sort all similarities by score (highest first)
			const allSimilarities = similarities.sort(
				(a, b) => b.overall_similarity - a.overall_similarity
			);

			// Get the maximum similarity from all cached similarities
			const maxSimilarity =
				allSimilarities.length > 0
					? Math.max(...allSimilarities.map((s) => s.overall_similarity))
					: 0;

			// Filter for display only those above threshold
			const filteredSimilar = allSimilarities.filter((s) => s.overall_similarity >= threshold);

			let duplicateStatus: 'duplicate' | 'similar' | 'unique';
			if (maxSimilarity >= 0.9) {
				duplicateStatus = 'duplicate';
			} else if (maxSimilarity >= 0.7) {
				duplicateStatus = 'similar';
			} else {
				duplicateStatus = 'unique';
			}

			const result = {
				id: wish.id,
				text: wish.text,
				type: wish.type,
				eventType: wish.eventType,
				status: wish.status || 'Entwurf',
				language: wish.language,
				relations: wish.relations || [],
				ageGroups: wish.ageGroups || [],
				specificValues: wish.specificValues || [],
				isBelated: Boolean(wish.isBelated),
				length: wish.length || 'medium',
				createdBy: wish.createdBy || '',
				createdAt: wish.createdAt || '',
				updatedAt: wish.updatedAt || '',
				similarWishes: filteredSimilar.map((s) => ({
					id: s.targetWish.id,
					text: s.targetWish.text,
					similarity: s.overall_similarity,
					type: s.targetWish.type || '',
					eventType: s.targetWish.event_type || ''
				})),
				duplicateStatus,
				maxSimilarity
			};

			cachedResults.push(result);
		}
	}

	console.log(`Found cached results for ${cachedResults.length} out of ${wishes.length} wishes`);
	return cachedResults;
}

async function processWishesBatch(
	specificWishes: Wish[] | undefined,
	threshold: number,
	language: string | undefined,
	sendProgress: (progress: number) => void,
	sendResult: (wish: Wish, cached?: boolean) => void,
	sendError: (error: string) => void,
	sendComplete: () => void,
	locals: App.Locals
) {
	try {
		// Check authentication
		const session = await locals.safeGetSession();
		if (!session) {
			sendError('Nicht authentifiziert');
			return;
		}

		const similarityService = createSimilarityService(locals.supabase);

		// Get all wishes or use specific wishes
		const allWishes = specificWishes || (await getAllWishes(locals.supabase, language));

		if (!allWishes || allWishes.length === 0) {
			sendError('No wishes found for analysis');
			return;
		}

		const total = allWishes.length;
		let processed = 0;

		// First, try to get cached results for all wishes
		const cachedResults = await getCachedSimilarityResults(locals.supabase, allWishes, threshold);
		const wishesWithCache = new Set(cachedResults.map((r) => r.id));

		// Send cached results immediately
		for (const result of cachedResults) {
			sendResult(result, true); // Mark as cached
			processed++;
			const progress = Math.round((processed / total) * 100);
			sendProgress(progress);
		}

		// Process remaining wishes that don't have cached results
		const wishesToProcess = allWishes.filter((wish) => !wishesWithCache.has(wish.id));

		if (wishesToProcess.length === 0) {
			sendComplete();
			return;
		}

		// Process uncached wishes in smaller batches for better performance
		const batchSize = 5; // Reduced batch size for non-cached processing
		const batches = [];

		for (let i = 0; i < wishesToProcess.length; i += batchSize) {
			batches.push(wishesToProcess.slice(i, i + batchSize));
		}

		for (const batch of batches) {
			await Promise.all(
				batch.map(async (wish: Wish) => {
					try {
						const similarityResult = await similarityService.findSimilarToWish(wish.id, {
							language: wish.language,
							type: wish.type,
							eventType: wish.eventType
						});

						// Filter by threshold and exclude self
						const filteredSimilar = similarityResult.similarWishes
							.filter((sw) => sw.wish.id !== wish.id && sw.similarity >= threshold)
							.sort((a, b) => b.similarity - a.similarity);

						const maxSimilarity =
							filteredSimilar.length > 0
								? Math.max(...filteredSimilar.map((sw) => sw.similarity))
								: 0;

						let duplicateStatus: 'duplicate' | 'similar' | 'unique';
						if (maxSimilarity >= 0.9) {
							duplicateStatus = 'duplicate';
						} else if (maxSimilarity >= 0.7) {
							duplicateStatus = 'similar';
						} else {
							duplicateStatus = 'unique';
						}

						const result = {
							id: wish.id,
							text: wish.text,
							type: wish.type,
							eventType: wish.eventType,
							status: wish.status || 'Entwurf',
							language: wish.language,
							relations: wish.relations || [],
							ageGroups: wish.ageGroups || [],
							specificValues: wish.specificValues || [],
							isBelated: Boolean(wish.isBelated),
							length: wish.length || 'medium',
							createdBy: wish.createdBy || '',
							createdAt: wish.createdAt || '',
							updatedAt: wish.updatedAt || '',
							similarWishes: filteredSimilar.map((sw) => ({
								id: sw.wish.id,
								text: sw.wish.text,
								similarity: sw.similarity,
								type: sw.wish.type || '',
								eventType: sw.wish.eventType || ''
							})),
							duplicateStatus,
							maxSimilarity
						};

						sendResult(result);
						processed++;

						const progress = Math.round((processed / total) * 100);
						sendProgress(progress);
					} catch (error) {
						console.error(`Error processing wish ${wish.id}:`, error);
						processed++;
						const progress = Math.round((processed / total) * 100);
						sendProgress(progress);
					}
				})
			);

			// Reduced delay for better performance
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		sendComplete();
	} catch (error) {
		console.error('Error in batch processing:', error);
		sendError(error instanceof Error ? error.message : 'Unknown error occurred');
	}
}
