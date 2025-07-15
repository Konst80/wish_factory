import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSimilarityService } from '$lib/server/similarity-service';
import type { Wish } from '$lib/types/Wish';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { wishes: specificWishes, threshold = 0.7 } = await request.json().catch(() => ({}));

		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();
				
				const sendProgress = (progress: number) => {
					const progressData = JSON.stringify({
						type: 'progress',
						progress
					}) + '\n';
					controller.enqueue(encoder.encode(progressData));
				};

				const sendResult = (wish: any) => {
					const resultData = JSON.stringify({
						type: 'result',
						wish
					}) + '\n';
					controller.enqueue(encoder.encode(resultData));
				};

				const sendError = (error: string) => {
					const errorData = JSON.stringify({
						type: 'error',
						error
					}) + '\n';
					controller.enqueue(encoder.encode(errorData));
					controller.close();
				};

				const sendComplete = () => {
					const completeData = JSON.stringify({
						type: 'complete'
					}) + '\n';
					controller.enqueue(encoder.encode(completeData));
					controller.close();
				};

				// Process wishes asynchronously
				processWishesBatch(specificWishes, threshold, sendProgress, sendResult, sendError, sendComplete, locals);
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
		return json(
			{ error: 'Internal server error during batch analysis' },
			{ status: 500 }
		);
	}
};

async function getAllWishes(supabase: any): Promise<Wish[]> {
	const { data: wishes, error } = await supabase
		.from('wishes')
		.select('*')
		.in('status', ['Freigegeben', 'Entwurf', 'Zur Freigabe'])
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching wishes:', error);
		return [];
	}

	return wishes || [];
}

async function processWishesBatch(
	specificWishes: Wish[] | undefined,
	threshold: number,
	sendProgress: (progress: number) => void,
	sendResult: (wish: any) => void,
	sendError: (error: string) => void,
	sendComplete: () => void,
	locals: any
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
		const allWishes = specificWishes || await getAllWishes(locals.supabase);
		
		if (!allWishes || allWishes.length === 0) {
			sendError('No wishes found for analysis');
			return;
		}

		const total = allWishes.length;
		let processed = 0;

		// Process wishes in batches to avoid overwhelming the system
		const batchSize = 10;
		const batches = [];
		
		for (let i = 0; i < allWishes.length; i += batchSize) {
			batches.push(allWishes.slice(i, i + batchSize));
		}

		for (const batch of batches) {
			await Promise.all(batch.map(async (wish: Wish) => {
				try {
					const similarityResult = await similarityService.findSimilarToWish(wish.id, {
						language: wish.language,
						type: wish.type,
						eventType: wish.eventType
					});
					
					// Filter by threshold and exclude self
					const filteredSimilar = similarityResult.similarWishes
						.filter(sw => sw.wish.id !== wish.id && sw.similarity >= threshold)
						.sort((a, b) => b.similarity - a.similarity);

					const maxSimilarity = filteredSimilar.length > 0 
						? Math.max(...filteredSimilar.map(sw => sw.similarity))
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
						status: wish.status,
						language: wish.language,
						similarWishes: filteredSimilar.map(sw => ({
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
			}));

			// Small delay between batches to prevent overwhelming the system
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		sendComplete();
		
	} catch (error) {
		console.error('Error in batch processing:', error);
		sendError(error instanceof Error ? error.message : 'Unknown error occurred');
	}
}