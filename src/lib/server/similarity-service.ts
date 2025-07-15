import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.js';
import type { Wish } from '$lib/types/Wish.js';
import { similarityEngine, type SimilarityMatch, type WishText } from '$lib/utils/similarity.js';

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

	constructor(supabase: SupabaseClient<Database>, config: SimilarityServiceConfig = {}) {
		this.supabase = supabase;
		this.config = {
			maxResults: config.maxResults ?? 5,
			includeArchived: config.includeArchived ?? false,
			duplicateThreshold: config.duplicateThreshold ?? 0.9,
			cacheResults: config.cacheResults ?? true,
			...config
		};
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
	private async loadWishesForComparison(
		filters: {
			language?: string;
			type?: string;
			eventType?: string;
			excludeId?: string;
		} = {}
	): Promise<WishText[]> {
		let query = this.supabase
			.from('wishes')
			.select('id, text, type, event_type, language, status')
			.in('status', this.config.includeArchived ? ['Freigegeben', 'Archiviert'] : ['Freigegeben']);

		// Anwenden von Filtern
		if (filters.language) {
			query = query.eq('language', filters.language as any);
		}
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
	 * Hauptmethode für Ähnlichkeitscheck
	 */
	async checkSimilarity(
		inputText: string,
		filters: {
			language?: string;
			type?: string;
			eventType?: string;
			excludeId?: string;
		} = {}
	): Promise<SimilarityCheckResult> {
		const startTime = Date.now();

		// Cache prüfen
		const cacheKey = this.generateCacheKey(inputText, filters);
		if (this.config.cacheResults && this.cache.has(cacheKey)) {
			const cached = this.cache.get(cacheKey)!;
			if (Date.now() - cached.timestamp < this.CACHE_TTL) {
				return {
					...cached.result,
					processingTime: Date.now() - startTime
				};
			}
		}

		// Wünsche aus Datenbank laden
		const wishes = await this.loadWishesForComparison(filters);

		// Ähnlichkeitscheck durchführen
		const similarWishes = similarityEngine.findSimilarWishes(
			inputText,
			wishes,
			this.config.maxResults
		);

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

		// Cache speichern
		if (this.config.cacheResults) {
			this.cache.set(cacheKey, {
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
			language?: string;
			type?: string;
			eventType?: string;
		} = {}
	): Promise<SimilarityCheckResult[]> {
		const results: SimilarityCheckResult[] = [];

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
		// Bestehenden Wunsch laden
		const { data: wish, error } = await this.supabase
			.from('wishes')
			.select('*')
			.eq('id', wishId)
			.single();

		if (error || !wish) {
			throw new Error(`Wunsch mit ID ${wishId} nicht gefunden`);
		}

		// Ähnlichkeitscheck mit Ausschluss des Original-Wunsches
		return this.checkSimilarity(wish.text, {
			...filters,
			excludeId: wishId,
			language: filters.language || wish.language || undefined,
			type: filters.type || wish.type || undefined,
			eventType: filters.eventType || wish.event_type || undefined
		});
	}

	/**
	 * Statistiken über Ähnlichkeiten in der Datenbank
	 */
	async getSimilarityStats(language?: string): Promise<{
		totalWishes: number;
		duplicateGroups: number;
		averageSimilarity: number;
		processingTime: number;
	}> {
		const startTime = Date.now();

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
	 * Cache-Statistiken
	 */
	getCacheStats(): {
		size: number;
		hitRate: number;
		oldestEntry: number;
	} {
		const now = Date.now();
		let oldestTimestamp = now;
		let totalHits = 0;
		let totalRequests = 0;

		for (const [, { timestamp }] of this.cache) {
			if (timestamp < oldestTimestamp) {
				oldestTimestamp = timestamp;
			}
		}

		return {
			size: this.cache.size,
			hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
			oldestEntry: now - oldestTimestamp
		};
	}

	/**
	 * Cache leeren
	 */
	clearCache(): void {
		this.cache.clear();
	}
}

// Factory-Funktion für einfache Verwendung
export function createSimilarityService(
	supabase: SupabaseClient<Database>,
	config?: SimilarityServiceConfig
): SimilarityService {
	return new SimilarityService(supabase, config);
}
