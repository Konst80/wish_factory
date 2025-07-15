import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.js';
import type { Wish } from '$lib/types/Wish.js';
import { similarityEngine, type SimilarityMatch, type WishText } from '$lib/utils/similarity.js';
import {
	SimilarityPrecomputationService,
	type SimilarityCache
} from './similarity-precomputation.service.js';

export interface SimilarityCheckResult {
	similarWishes: SimilarityMatch[];
	isDuplicate: boolean;
	suggestions: string[];
	processingTime: number;
}

export interface SimilarityServiceConfig {
	maxResults?: number;
	includeArchived?: boolean;
	duplicateThreshold?: number;
	cacheResults?: boolean;
}

export class SimilarityService {
	private supabase: SupabaseClient<Database>;
	private config: Required<SimilarityServiceConfig>;
	private cache: Map<string, { result: SimilarityCheckResult; timestamp: number }> = new Map();
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
	private precomputationService: SimilarityPrecomputationService;
	private runningPrecomputations = new Set<string>();

	constructor(supabase: SupabaseClient<Database>, config: SimilarityServiceConfig = {}) {
		this.supabase = supabase;
		this.config = {
			maxResults: config.maxResults ?? 5,
			includeArchived: config.includeArchived ?? false,
			duplicateThreshold: config.duplicateThreshold ?? 0.9,
			cacheResults: config.cacheResults ?? true,
			...config
		};
		this.precomputationService = new SimilarityPrecomputationService(supabase);
	}

	/**
	 * Konvertiert Datenbank-Wish zu WishText für Similarity Engine
	 */
	private dbWishToWishText(wish: Wish): WishText {
		return {
			id: wish.id,
			text: wish.text,
			type: wish.type,
			eventType: wish.eventType,
			language: wish.language
		};
	}

	/**
	 * Lädt alle relevanten Wünsche aus der Datenbank
	 */
	private async loadWishesForComparison(filters: {
		language: string; // Make language required
		type?: string;
		eventType?: string;
		excludeId?: string;
	}): Promise<WishText[]> {
		let query = this.supabase
			.from('wishes')
			.select('id, text, type, event_type, language, status')
			.in(
				'status',
				this.config.includeArchived
					? ['Freigegeben', 'Archiviert', 'Entwurf', 'Zur Freigabe']
					: ['Freigegeben', 'Entwurf', 'Zur Freigabe']
			);

		// Language filter is now required for language-specific evaluation
		query = query.eq('language', filters.language as any);

		// Anwenden von anderen Filtern
		if (filters.type) {
			query = query.eq('type', filters.type as any);
		}
		if (filters.eventType) {
			query = query.eq('event_type', filters.eventType as any);
		}
		if (filters.excludeId) {
			query = query.neq('id', filters.excludeId);
		}

		const { data: wishes, error } = await query;

		if (error) {
			console.error('Fehler beim Laden der Wünsche:', error);
			return [];
		}

		// Debug: Log loaded wishes
		console.log(
			`Loaded ${wishes.length} wishes for similarity comparison:`,
			wishes.map((w) => ({
				id: w.id.substring(0, 8),
				status: w.status,
				text: w.text.substring(0, 50) + '...'
			}))
		);

		return wishes.map((wish) => ({
			id: wish.id,
			text: wish.text,
			type: wish.type || undefined,
			eventType: wish.event_type || undefined,
			language: wish.language || undefined
		}));
	}

	/**
	 * Generiert einen Cache-Key für die Ähnlichkeitssuche
	 */
	private generateCacheKey(text: string, filters: Record<string, any>): string {
		const filterString = JSON.stringify(filters);
		const textHash = text.toLowerCase().replace(/\s+/g, '').slice(0, 50);
		return `similarity:${textHash}:${btoa(filterString)}`;
	}

	/**
	 * Prüft und bereinigt den Cache
	 */
	private cleanupCache(): void {
		const now = Date.now();
		for (const [key, { timestamp }] of this.cache) {
			if (now - timestamp > this.CACHE_TTL) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Hauptmethode für Ähnlichkeitscheck mit Datenbank-Caching
	 */
	async checkSimilarity(
		inputText: string,
		filters: {
			language: string; // Make language required
			type?: string;
			eventType?: string;
			excludeId?: string;
		}
	): Promise<SimilarityCheckResult> {
		const startTime = Date.now();

		// Validate required language parameter
		if (!filters.language) {
			throw new Error('Language parameter is required for similarity check');
		}

		console.log(
			`Starting similarity check for text: "${inputText.substring(0, 50)}..." with filters:`,
			filters
		);

		// Cache prüfen
		const cacheKey = this.generateCacheKey(inputText, filters);
		if (this.config.cacheResults && this.cache.has(cacheKey)) {
			const cached = this.cache.get(cacheKey)!;
			if (Date.now() - cached.timestamp < this.CACHE_TTL) {
				console.log('Returning cached result');
				return {
					...cached.result,
					processingTime: Date.now() - startTime
				};
			}
		}

		// Prüfe auf vorberechnete Ähnlichkeiten wenn excludeId vorhanden ist
		if (filters.excludeId) {
			const cachedSimilarities = await this.precomputationService.getCachedSimilarities(
				filters.excludeId
			);
			if (cachedSimilarities.length > 0) {
				console.log(
					`Found ${cachedSimilarities.length} cached similarities for wish ${filters.excludeId}`
				);
				return this.buildResultFromCachedSimilarities(
					cachedSimilarities,
					filters.excludeId,
					startTime
				);
			} else {
				// Prüfe ob bereits eine Background-Precomputation läuft
				if (!this.isBackgroundPrecomputationRunning(filters.excludeId)) {
					console.log(
						`No cached similarities found for wish ${filters.excludeId}, triggering background precomputation`
					);
					this.triggerBackgroundPrecomputation(filters.excludeId).catch((err) => {
						console.error('Background precomputation failed:', err);
					});
				}
			}
		}

		// Fallback: Herkömmliche Berechnung (mit verbesserter Performance)
		console.log('No cached similarities found, falling back to optimized traditional calculation');
		return this.performOptimizedSimilarityCheck(inputText, filters, startTime);
	}

	/**
	 * Erstellt SimilarityCheckResult aus gecachten Ähnlichkeiten
	 */
	private async buildResultFromCachedSimilarities(
		cachedSimilarities: SimilarityCache[],
		excludeId: string,
		startTime: number
	): Promise<SimilarityCheckResult> {
		const similarWishes: SimilarityMatch[] = [];

		for (const cached of cachedSimilarities.slice(0, this.config.maxResults)) {
			const wishId = cached.wish_id_1 === excludeId ? cached.wish_id_2 : cached.wish_id_1;
			const wish = await this.loadWishById(wishId);

			if (wish) {
				similarWishes.push({
					wish: this.dbWishToWishText(wish),
					similarity: cached.overall_similarity,
					algorithm: 'cached'
				});
			}
		}

		const isDuplicate =
			similarWishes.length > 0 && similarWishes[0].similarity >= this.config.duplicateThreshold;

		// Für Variationsvorschläge benötigen wir den ursprünglichen Text
		const originalWish = await this.loadWishById(excludeId);
		const suggestions = originalWish
			? similarityEngine.generateVariationSuggestions(originalWish.text)
			: [];

		return {
			similarWishes,
			isDuplicate,
			suggestions,
			processingTime: Date.now() - startTime
		};
	}

	/**
	 * Lädt einen Wunsch nach ID
	 */
	private async loadWishById(id: string): Promise<Wish | null> {
		const { data, error } = await this.supabase.from('wishes').select('*').eq('id', id).single();

		if (error) {
			console.error('Error loading wish by ID:', error);
			return null;
		}

		if (!data) return null;

		return {
			...data,
			eventType: data.event_type,
			ageGroups: data.age_groups,
			specificValues: data.specific_values || [],
			createdAt: data.created_at ? new Date(data.created_at) : new Date(),
			updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
			createdBy: data.created_by,
			length: data.length as any // Type assertion for compatibility
		};
	}

	/**
	 * Herkömmliche Ähnlichkeitsberechnung (Fallback)
	 */
	private async performTraditionalSimilarityCheck(
		inputText: string,
		filters: {
			language: string; // Make language required
			type?: string;
			eventType?: string;
			excludeId?: string;
		},
		startTime: number
	): Promise<SimilarityCheckResult> {
		// Validate required language parameter
		if (!filters.language) {
			throw new Error('Language parameter is required for traditional similarity check');
		}

		// Wünsche aus Datenbank laden
		const wishes = await this.loadWishesForComparison(filters);
		console.log(`Loaded ${wishes.length} wishes for comparison`);

		// Ähnlichkeitscheck durchführen
		let similarWishes: SimilarityMatch[] = [];
		try {
			similarWishes = similarityEngine.findSimilarWishes(inputText, wishes, this.config.maxResults);
		} catch (error) {
			console.error('Error during similarity calculation:', error);
			// Return empty result if similarity calculation fails
			similarWishes = [];
		}

		console.log(`Found ${similarWishes.length} similar wishes`);

		// Duplikat-Check
		const isDuplicate =
			similarWishes.length > 0 && similarWishes[0].similarity >= this.config.duplicateThreshold;

		// Variationsvorschläge generieren
		const suggestions = similarityEngine.generateVariationSuggestions(inputText);

		const result: SimilarityCheckResult = {
			similarWishes,
			isDuplicate,
			suggestions,
			processingTime: Date.now() - startTime
		};

		console.log(
			`Similarity check completed in ${result.processingTime}ms, isDuplicate: ${isDuplicate}`
		);

		// Cache speichern
		if (this.config.cacheResults) {
			this.cache.set(this.generateCacheKey(inputText, filters), {
				result,
				timestamp: Date.now()
			});
			this.cleanupCache();
		}

		return result;
	}

	/**
	 * Batch-Ähnlichkeitscheck für mehrere Texte
	 */
	async batchCheckSimilarity(
		texts: string[],
		filters: {
			language: string; // Make language required
			type?: string;
			eventType?: string;
		}
	): Promise<SimilarityCheckResult[]> {
		const results: SimilarityCheckResult[] = [];

		// Validate required language parameter
		if (!filters.language) {
			throw new Error('Language parameter is required for batch similarity check');
		}

		// Wünsche einmal laden für alle Checks
		const wishes = await this.loadWishesForComparison(filters);

		for (const text of texts) {
			const startTime = Date.now();

			const similarWishes = similarityEngine.findSimilarWishes(
				text,
				wishes,
				this.config.maxResults
			);

			const isDuplicate =
				similarWishes.length > 0 && similarWishes[0].similarity >= this.config.duplicateThreshold;

			const suggestions = similarityEngine.generateVariationSuggestions(text);

			results.push({
				similarWishes,
				isDuplicate,
				suggestions,
				processingTime: Date.now() - startTime
			});
		}

		return results;
	}

	/**
	 * Findet ähnliche Wünsche für einen bestehenden Wunsch
	 */
	async findSimilarToWish(
		wishId: string,
		filters: {
			language?: string;
			type?: string;
			eventType?: string;
		} = {}
	): Promise<SimilarityCheckResult> {
		console.log(`Finding similar wishes for wishId: ${wishId}`);

		// Bestehenden Wunsch laden
		const { data: wish, error } = await this.supabase
			.from('wishes')
			.select('*')
			.eq('id', wishId)
			.single();

		if (error) {
			console.error(`Database error when loading wish ${wishId}:`, error);
			throw new Error(`Datenbankfehler beim Laden des Wunsches: ${error.message}`);
		}

		if (!wish) {
			console.error(`Wish with ID ${wishId} not found`);
			throw new Error(`Wunsch mit ID ${wishId} nicht gefunden`);
		}

		console.log(
			`Found wish: ${wish.text.substring(0, 50)}... (${wish.type}, ${wish.event_type}, ${wish.language})`
		);

		// Always use the wish's language for language-specific evaluation
		const targetLanguage = filters.language || wish.language;

		if (!targetLanguage) {
			throw new Error('No language specified for similarity check');
		}

		// Ähnlichkeitscheck mit Ausschluss des Original-Wunsches
		return this.checkSimilarity(wish.text, {
			...filters,
			excludeId: wishId,
			language: targetLanguage,
			type: filters.type || wish.type || undefined,
			eventType: filters.eventType || wish.event_type || undefined
		});
	}

	/**
	 * Statistiken über Ähnlichkeiten in der Datenbank
	 */
	async getSimilarityStats(language: string): Promise<{
		totalWishes: number;
		duplicateGroups: number;
		averageSimilarity: number;
		processingTime: number;
	}> {
		const startTime = Date.now();

		// Validate required language parameter
		if (!language) {
			throw new Error('Language parameter is required for similarity stats');
		}

		// Use precomputed similarity data from cache for much faster statistics
		try {
			// Get total wishes count with language filter
			const wishQuery = this.supabase
				.from('wishes')
				.select('id', { count: 'exact' })
				.eq('status', 'Freigegeben')
				.eq('language', language as 'de' | 'en');

			const { count: totalWishes } = await wishQuery;

			if (!totalWishes || totalWishes === 0) {
				return {
					totalWishes: 0,
					duplicateGroups: 0,
					averageSimilarity: 0,
					processingTime: Date.now() - startTime
				};
			}

			// Use the similarity_stats view if available
			const { data: statsData, error: statsError } = await this.supabase
				.from('similarity_stats')
				.select('*')
				.limit(1);

			if (!statsError && statsData && statsData.length > 0) {
				const stats = statsData[0];

				// Calculate duplicate groups from precomputed similarities
				const dupQuery = this.supabase
					.from('wish_similarities')
					.select('wish_id_1, wish_id_2')
					.gte('overall_similarity', this.config.duplicateThreshold);

				const { data: duplicates, error: dupError } = await dupQuery;

				if (dupError) {
					console.error('Error fetching duplicates:', dupError);
				}

				const duplicateGroups = new Set<string>();
				if (duplicates) {
					duplicates.forEach((dup) => {
						duplicateGroups.add(dup.wish_id_1);
						duplicateGroups.add(dup.wish_id_2);
					});
				}

				return {
					totalWishes,
					duplicateGroups: duplicateGroups.size,
					averageSimilarity: stats.avg_similarity || 0,
					processingTime: Date.now() - startTime
				};
			}
		} catch (error) {
			console.error('Error in fast similarity stats:', error);
		}

		// Fallback to legacy method
		return await this.getLegacySimilarityStats(language);
	}

	private async getLegacySimilarityStats(language: string): Promise<{
		totalWishes: number;
		duplicateGroups: number;
		averageSimilarity: number;
		processingTime: number;
	}> {
		const startTime = Date.now();

		// Validate required language parameter
		if (!language) {
			throw new Error('Language parameter is required for legacy similarity stats');
		}

		const wishes = await this.loadWishesForComparison({ language });
		const totalWishes = wishes.length;

		if (totalWishes === 0) {
			return {
				totalWishes: 0,
				duplicateGroups: 0,
				averageSimilarity: 0,
				processingTime: Date.now() - startTime
			};
		}

		// Vereinfachte Duplikatgruppen-Berechnung
		const duplicateGroups = new Set<string>();
		let totalSimilarity = 0;
		let comparisons = 0;

		for (let i = 0; i < wishes.length; i++) {
			const similar = similarityEngine.findSimilarWishes(wishes[i].text, wishes.slice(i + 1), 1);

			if (similar.length > 0) {
				totalSimilarity += similar[0].similarity;
				comparisons++;

				if (similar[0].similarity >= this.config.duplicateThreshold) {
					duplicateGroups.add(wishes[i].id);
					duplicateGroups.add(similar[0].wish.id);
					console.log(
						`Duplicate found: "${wishes[i].text.substring(0, 50)}..." (${similar[0].similarity.toFixed(2)}) vs "${similar[0].wish.text.substring(0, 50)}..."`
					);
				}
			}
		}

		return {
			totalWishes,
			duplicateGroups: duplicateGroups.size,
			averageSimilarity: comparisons > 0 ? totalSimilarity / comparisons : 0,
			processingTime: Date.now() - startTime
		};
	}

	/**
	 * Cache-Statistiken - returns database-based similarity cache stats
	 */
	async getCacheStats(): Promise<{
		size: number;
		hitRate: number;
		oldestEntry: number;
	}> {
		try {
			// Get similarity cache statistics from database
			const { count: cacheSize } = await this.supabase
				.from('wish_similarities')
				.select('id', { count: 'exact' });

			// Get oldest entry timestamp
			const { data: oldestEntry } = await this.supabase
				.from('wish_similarities')
				.select('calculated_at')
				.order('calculated_at', { ascending: true })
				.limit(1);

			const now = Date.now();
			const oldestTimestamp = oldestEntry?.[0]?.calculated_at
				? new Date(oldestEntry[0].calculated_at).getTime()
				: now;

			// Calculate hit rate based on wishes with similarity data vs total wishes
			const { count: totalWishes } = await this.supabase
				.from('wishes')
				.select('id', { count: 'exact' })
				.eq('status', 'Freigegeben');

			const { count: wishesWithSimilarity } = await this.supabase
				.from('wishes')
				.select('id', { count: 'exact' })
				.eq('status', 'Freigegeben')
				.not('similarity_updated_at', 'is', null);

			const hitRate =
				totalWishes && totalWishes > 0 ? (wishesWithSimilarity || 0) / totalWishes : 0;

			return {
				size: cacheSize || 0,
				hitRate,
				oldestEntry: now - oldestTimestamp
			};
		} catch (error) {
			console.error('Error getting cache stats:', error);
			return {
				size: 0,
				hitRate: 0,
				oldestEntry: 0
			};
		}
	}

	/**
	 * Cache leeren
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Vorberechnung für einen neuen Wunsch
	 */
	async precomputeSimilarityForWish(wish: Wish): Promise<void> {
		await this.precomputationService.precomputeSimilarityForWish(wish);
		await this.precomputationService.updateWishSimilarityMetadata(wish);
	}

	/**
	 * Invalidiert Cache für einen Wunsch
	 */
	async invalidateCacheForWish(wishId: string): Promise<void> {
		await this.precomputationService.invalidateSimilarityCache(wishId);

		// Auch lokalen Cache invalidieren
		for (const [key, _] of this.cache) {
			if (key.includes(wishId)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Prüft ob eine Background-Precomputation bereits läuft
	 */
	private isBackgroundPrecomputationRunning(wishId: string): boolean {
		return this.runningPrecomputations.has(wishId);
	}

	/**
	 * Triggert asynchrone Vorberechnung für einen Wunsch
	 */
	private async triggerBackgroundPrecomputation(wishId: string): Promise<void> {
		// Prüfe ob bereits läuft
		if (this.runningPrecomputations.has(wishId)) {
			return;
		}

		// Markiere als laufend
		this.runningPrecomputations.add(wishId);

		try {
			// Lade den Wunsch
			const wish = await this.loadWishById(wishId);
			if (!wish) {
				console.error(`Wish ${wishId} not found for background precomputation`);
				return;
			}

			// Starte Vorberechnung im Hintergrund
			await this.precomputationService.precomputeSimilarityForWish(wish);
			await this.precomputationService.updateWishSimilarityMetadata(wish);

			console.log(`Background precomputation completed for wish ${wishId}`);
		} catch (error) {
			console.error(`Background precomputation failed for wish ${wishId}:`, error);
		} finally {
			// Entferne aus laufenden Precomputations
			this.runningPrecomputations.delete(wishId);
		}
	}

	/**
	 * Optimierte Ähnlichkeitsberechnung mit besserer Performance
	 */
	private async performOptimizedSimilarityCheck(
		inputText: string,
		filters: {
			language: string; // Make language required
			type?: string;
			eventType?: string;
			excludeId?: string;
		},
		startTime: number
	): Promise<SimilarityCheckResult> {
		// Validate required language parameter
		if (!filters.language) {
			throw new Error('Language parameter is required for optimized similarity check');
		}

		// Lade nur relevante Wünsche für bessere Performance
		const wishes = await this.loadWishesForComparison(filters);

		// Schnelle Berechnung nur für Top-Matches
		const maxResults = Math.min(this.config.maxResults, 10);
		const similarWishes = similarityEngine.findSimilarWishes(inputText, wishes, maxResults);

		const isDuplicate =
			similarWishes.length > 0 && similarWishes[0].similarity >= this.config.duplicateThreshold;

		// Für Variationsvorschläge benötigen wir den ursprünglichen Text
		const originalWish = filters.excludeId ? await this.loadWishById(filters.excludeId) : null;
		const suggestions = originalWish
			? similarityEngine.generateVariationSuggestions(originalWish.text)
			: [];

		const result: SimilarityCheckResult = {
			similarWishes,
			isDuplicate,
			suggestions,
			processingTime: Date.now() - startTime
		};

		// Cache-Ergebnis speichern
		if (this.config.cacheResults) {
			const cacheKey = this.generateCacheKey(inputText, filters);
			this.cache.set(cacheKey, {
				result,
				timestamp: Date.now()
			});
		}

		return result;
	}

	/**
	 * Aktualisiert veraltete Ähnlichkeiten
	 */
	async refreshStaleComparisons(): Promise<void> {
		await this.precomputationService.refreshStaleComparisons();
	}
}

// Factory-Funktion für einfache Verwendung
export function createSimilarityService(
	supabase: SupabaseClient<Database>,
	config?: SimilarityServiceConfig
): SimilarityService {
	return new SimilarityService(supabase, config);
}
