import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
		);

		console.log('🔄 Starting similarity precomputation cron job...');

		// 1. Finde alle Wünsche, die keine aktuellen Similarity-Berechnungen haben
		const { data: outdatedWishes, error: wishError } = await supabase
			.from('wishes')
			.select('id, text, type, event_type, language, updated_at')
			.or('similarity_updated_at.is.null,similarity_updated_at.lt.updated_at')
			.eq('status', 'Freigegeben') // Nur freigegebene Wünsche
			.limit(100); // Batch-Verarbeitung

		if (wishError) {
			console.error('❌ Error fetching outdated wishes:', wishError);
			throw wishError;
		}

		if (!outdatedWishes || outdatedWishes.length === 0) {
			console.log('✅ No outdated wishes found, all similarities are up to date');
			return new Response(
				JSON.stringify({
					success: true,
					message: 'No outdated wishes found',
					processed: 0
				}),
				{
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log(`📊 Found ${outdatedWishes.length} wishes with outdated similarities`);

		// 2. Für jeden Wunsch, berechne Similarities zu allen anderen
		let processedCount = 0;
		let errorCount = 0;

		for (const wish of outdatedWishes) {
			try {
				console.log(`🔍 Processing wish ${wish.id}...`);

				// Hole alle anderen Wünsche für Vergleich
				const { data: otherWishes, error: otherError } = await supabase
					.from('wishes')
					.select('id, text, type, event_type, language')
					.neq('id', wish.id)
					.eq('status', 'Freigegeben');

				if (otherError) {
					console.error(`❌ Error fetching other wishes for ${wish.id}:`, otherError);
					errorCount++;
					continue;
				}

				// Lösche alte Similarity-Einträge für diesen Wunsch
				await supabase
					.from('wish_similarities')
					.delete()
					.or(`wish_id_1.eq.${wish.id},wish_id_2.eq.${wish.id}`);

				// Berechne neue Similarities
				const similarityResults = [];
				for (const otherWish of otherWishes || []) {
					// Einfache Similarity-Berechnung (hier könntest du die volle Engine verwenden)
					const similarity = calculateSimpleSimilarity(wish.text, otherWish.text);

					if (similarity > 0.1) {
						// Nur signifikante Similarities speichern
						similarityResults.push({
							wish_id_1: wish.id,
							wish_id_2: otherWish.id,
							cosine_similarity: similarity,
							jaccard_similarity: similarity * 0.8, // Vereinfacht
							levenshtein_similarity: similarity * 0.9, // Vereinfacht
							tfidf_similarity: similarity * 0.7, // Vereinfacht
							overall_similarity: similarity,
							algorithm_used: 'simple',
							computed_at: new Date().toISOString()
						});
					}
				}

				// Speichere Similarity-Ergebnisse
				if (similarityResults.length > 0) {
					const { error: insertError } = await supabase
						.from('wish_similarities')
						.insert(similarityResults);

					if (insertError) {
						console.error(`❌ Error inserting similarities for ${wish.id}:`, insertError);
						errorCount++;
						continue;
					}
				}

				// Aktualisiere similarity_updated_at für den Wunsch
				await supabase
					.from('wishes')
					.update({ similarity_updated_at: new Date().toISOString() })
					.eq('id', wish.id);

				processedCount++;
				console.log(`✅ Processed wish ${wish.id} with ${similarityResults.length} similarities`);
			} catch (error) {
				console.error(`❌ Error processing wish ${wish.id}:`, error);
				errorCount++;
			}
		}

		console.log(`🎉 Cron job completed: ${processedCount} wishes processed, ${errorCount} errors`);

		return new Response(
			JSON.stringify({
				success: true,
				message: `Similarity precomputation completed`,
				processed: processedCount,
				errors: errorCount,
				total: outdatedWishes.length
			}),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('❌ Cron job failed:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
});

// Einfache Similarity-Berechnung für Cron Job
function calculateSimpleSimilarity(text1: string, text2: string): number {
	const words1 = text1.toLowerCase().split(/\s+/);
	const words2 = text2.toLowerCase().split(/\s+/);

	const set1 = new Set(words1);
	const set2 = new Set(words2);

	const intersection = new Set([...set1].filter((x) => set2.has(x)));
	const union = new Set([...set1, ...set2]);

	return intersection.size / union.size;
}
