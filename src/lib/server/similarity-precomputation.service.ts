import { SimilarityEngine } from '$lib/utils/similarity';
import type { Wish } from '$lib/types/Wish.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.js';

// Hilfsfunktion für Datenbankkonvertierung
function convertDbWishToWish(dbWish: Database['public']['Tables']['wishes']['Row']): Wish {
	return {
		id: dbWish.id,
		type: dbWish.type as 'normal' | 'heartfelt' | 'funny',
		eventType: dbWish.event_type as 'birthday' | 'anniversary' | 'custom',
		relations: dbWish.relations as ('friend' | 'family' | 'partner' | 'colleague')[],
		ageGroups: dbWish.age_groups as ('young' | 'middle' | 'senior' | 'all')[],
		specificValues: dbWish.specific_values || [],
		text: dbWish.text,
		isBelated: dbWish.belated,
		language: dbWish.language,
		length: dbWish.length as 'short' | 'medium' | 'long',
		createdAt: dbWish.created_at
			? new Date(dbWish.created_at).toISOString()
			: new Date().toISOString(),
		updatedAt: dbWish.updated_at
			? new Date(dbWish.updated_at).toISOString()
			: new Date().toISOString(),
		releasedAt: undefined
	};
}

export interface SimilarityCache {
	id: string;
	wish_id_1: string;
	wish_id_2: string;
	cosine_similarity: number;
	jaccard_similarity: number;
	levenshtein_similarity: number;
	tfidf_similarity: number;
	overall_similarity: number;
	calculated_at: string;
}

export interface SimilarityResult {
	similarities: SimilarityCache[];
	highestSimilarity: number;
	similarWishes: Wish[];
}

export class SimilarityPrecomputationService {
	private similarityEngine: SimilarityEngine;
	private supabase: SupabaseClient<Database>;

	constructor(supabase: SupabaseClient<Database>) {
		this.similarityEngine = new SimilarityEngine();
		this.supabase = supabase;
	}

	async precomputeSimilarityForWish(wish: Wish): Promise<void> {
		const existingWishes = await this.getWishesForComparison(wish);

		for (const existingWish of existingWishes) {
			if (existingWish.id === wish.id) continue;

			const similarities = await this.calculateAllSimilarities(wish, existingWish);
			await this.storeSimilarityResult(wish.id, existingWish.id, similarities);
		}
	}

	async invalidateSimilarityCache(wishId: string): Promise<void> {
		const { error } = await (this.supabase as any)
			.from('wish_similarities')
			.delete()
			.or(`wish_id_1.eq.${wishId},wish_id_2.eq.${wishId}`);

		if (error) {
			console.error('Error invalidating similarity cache:', error);
		}
	}

	async getCachedSimilarities(wishId: string): Promise<SimilarityCache[]> {
		const { data, error } = await (this.supabase as any)
			.from('wish_similarities')
			.select('*')
			.or(`wish_id_1.eq.${wishId},wish_id_2.eq.${wishId}`)
			.gte('overall_similarity', 0.6)
			.order('overall_similarity', { ascending: false });

		if (error) {
			console.error('Error fetching cached similarities:', error);
			return [];
		}

		return (data || []) as SimilarityCache[];
	}

	async refreshStaleComparisons(): Promise<void> {
		const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

		const { data: staleEntries } = await (this.supabase as any)
			.from('wish_similarities')
			.select('*')
			.lt('calculated_at', staleThreshold.toISOString());

		if (staleEntries) {
			for (const entry of staleEntries) {
				const wish1 = await this.getWishById(entry.wish_id_1);
				const wish2 = await this.getWishById(entry.wish_id_2);

				if (wish1 && wish2) {
					const similarities = await this.calculateAllSimilarities(wish1, wish2);
					await this.updateSimilarityResult(entry.id, similarities);
				}
			}
		}
	}

	async calculateSimilarityHash(wish: Wish): Promise<string> {
		const normalizedText = wish.text.toLowerCase().trim();
		const crypto = await import('crypto');
		return crypto.createHash('md5').update(normalizedText).digest('hex');
	}

	async updateWishSimilarityMetadata(wish: Wish): Promise<void> {
		const hash = await this.calculateSimilarityHash(wish);

		const { error } = await (this.supabase as any)
			.from('wishes')
			.update({
				similarity_hash: hash,
				similarity_updated_at: new Date().toISOString()
			})
			.eq('id', wish.id);

		if (error) {
			console.error('Error updating wish similarity metadata:', error);
		}
	}

	private async getWishesForComparison(wish: Wish): Promise<Wish[]> {
		const { data, error } = await this.supabase
			.from('wishes')
			.select('*')
			.eq('language', wish.language)
			.eq('event_type', wish.eventType)
			.neq('id', wish.id);

		if (error) {
			console.error('Error fetching wishes for comparison:', error);
			return [];
		}

		return (data || []).map(convertDbWishToWish);
	}

	private async calculateAllSimilarities(
		wish1: Wish,
		wish2: Wish
	): Promise<{
		cosine: number;
		jaccard: number;
		levenshtein: number;
		tfidf: number;
		overall: number;
	}> {
		const cosineResult = this.similarityEngine.cosineSimilarity(wish1.text, wish2.text);
		const jaccardResult = this.similarityEngine.jaccardSimilarity(wish1.text, wish2.text);
		const levenshteinResult = this.similarityEngine.levenshteinSimilarity(wish1.text, wish2.text);
		// Get corpus for TF-IDF calculation
		const allWishes = await this.getWishesForComparison(wish1);
		const corpus = allWishes.map((w) => w.text);
		const tfidfResult = this.similarityEngine.tfIdfSimilarity(wish1.text, wish2.text, corpus);

		const cosine = cosineResult.similarity;
		const jaccard = jaccardResult.similarity;
		const levenshtein = levenshteinResult.similarity;
		const tfidf = tfidfResult.similarity;
		const overall = Math.max(cosine, jaccard, levenshtein, tfidf);

		return {
			cosine,
			jaccard,
			levenshtein,
			tfidf,
			overall
		};
	}

	private async storeSimilarityResult(
		wishId1: string,
		wishId2: string,
		similarities: {
			cosine: number;
			jaccard: number;
			levenshtein: number;
			tfidf: number;
			overall: number;
		}
	): Promise<void> {
		// Prüfe zuerst, ob bereits ein Eintrag existiert
		const { data: existing } = await (this.supabase as any)
			.from('wish_similarities')
			.select('id')
			.or(
				`and(wish_id_1.eq.${wishId1},wish_id_2.eq.${wishId2}),and(wish_id_1.eq.${wishId2},wish_id_2.eq.${wishId1})`
			)
			.limit(1);

		if (existing && existing.length > 0) {
			// Entry bereits vorhanden, überspringen
			return;
		}

		// Neue Similarity-Kombination speichern
		const { error } = await (this.supabase as any).from('wish_similarities').insert({
			wish_id_1: wishId1,
			wish_id_2: wishId2,
			cosine_similarity: similarities.cosine,
			jaccard_similarity: similarities.jaccard,
			levenshtein_similarity: similarities.levenshtein,
			tfidf_similarity: similarities.tfidf,
			overall_similarity: similarities.overall,
			calculated_at: new Date().toISOString()
		});

		if (error) {
			// Ignoriere Duplicate-Key-Fehler (Race Condition)
			if (error.code !== '23505') {
				console.error('Error storing similarity result:', error);
			}
		}
	}

	private async updateSimilarityResult(
		entryId: string,
		similarities: {
			cosine: number;
			jaccard: number;
			levenshtein: number;
			tfidf: number;
			overall: number;
		}
	): Promise<void> {
		const { error } = await (this.supabase as any)
			.from('wish_similarities')
			.update({
				cosine_similarity: similarities.cosine,
				jaccard_similarity: similarities.jaccard,
				levenshtein_similarity: similarities.levenshtein,
				tfidf_similarity: similarities.tfidf,
				overall_similarity: similarities.overall,
				calculated_at: new Date().toISOString()
			})
			.eq('id', entryId);

		if (error) {
			console.error('Error updating similarity result:', error);
		}
	}

	private async getWishById(id: string): Promise<Wish | null> {
		const { data, error } = await this.supabase.from('wishes').select('*').eq('id', id).single();

		if (error) {
			console.error('Error fetching wish by ID:', error);
			return null;
		}

		if (!data) return null;

		return convertDbWishToWish(data);
	}
}

// Factory function for creating the service
export function createSimilarityPrecomputationService(
	supabase: SupabaseClient<Database>
): SimilarityPrecomputationService {
	return new SimilarityPrecomputationService(supabase);
}
