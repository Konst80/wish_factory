import * as stringSimilarity from 'string-similarity';
import { LevenshteinDistance } from 'natural';

export interface SimilarityResult {
	similarity: number;
	algorithm: string;
	threshold: number;
	isSimilar: boolean;
}

export interface SimilarityConfig {
	cosineSimilarityThreshold?: number;
	jaccardThreshold?: number;
	levenshteinThreshold?: number;
	tfIdfThreshold?: number;
}

export interface WishText {
	id: string;
	text: string;
	type?: string;
	eventType?: string;
	language?: string;
}

export interface SimilarityMatch {
	wish: WishText;
	similarity: number;
	algorithm: string;
}

const DEFAULT_CONFIG: Required<SimilarityConfig> = {
	cosineSimilarityThreshold: 0.8,
	jaccardThreshold: 0.6,
	levenshteinThreshold: 0.7,
	tfIdfThreshold: 0.75
};

export class SimilarityEngine {
	private config: Required<SimilarityConfig>;

	constructor(config: SimilarityConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Normalisiert Text für Ähnlichkeitsvergleiche
	 */
	private normalizeText(text: string): string {
		return text
			.toLowerCase()
			.replace(/[{}]/g, '') // Entferne Placeholder-Klammern
			.replace(/\s+/g, ' ') // Normalisiere Whitespace
			.trim();
	}

	/**
	 * Berechnet Cosine Similarity zwischen zwei Texten
	 */
	cosineSimilarity(text1: string, text2: string): SimilarityResult {
		const normalized1 = this.normalizeText(text1);
		const normalized2 = this.normalizeText(text2);

		const similarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);

		return {
			similarity,
			algorithm: 'cosine',
			threshold: this.config.cosineSimilarityThreshold,
			isSimilar: similarity >= this.config.cosineSimilarityThreshold
		};
	}

	/**
	 * Berechnet Jaccard Index zwischen zwei Texten
	 */
	jaccardSimilarity(text1: string, text2: string): SimilarityResult {
		const normalized1 = this.normalizeText(text1);
		const normalized2 = this.normalizeText(text2);

		const words1 = new Set(normalized1.split(/\s+/));
		const words2 = new Set(normalized2.split(/\s+/));

		const intersection = new Set([...words1].filter((word) => words2.has(word)));
		const union = new Set([...words1, ...words2]);

		const similarity = intersection.size / union.size;

		return {
			similarity,
			algorithm: 'jaccard',
			threshold: this.config.jaccardThreshold,
			isSimilar: similarity >= this.config.jaccardThreshold
		};
	}

	/**
	 * Berechnet normalisierte Levenshtein-Distanz
	 */
	levenshteinSimilarity(text1: string, text2: string): SimilarityResult {
		const normalized1 = this.normalizeText(text1);
		const normalized2 = this.normalizeText(text2);

		const maxLength = Math.max(normalized1.length, normalized2.length);
		if (maxLength === 0) {
			return {
				similarity: 1,
				algorithm: 'levenshtein',
				threshold: this.config.levenshteinThreshold,
				isSimilar: true
			};
		}

		const dist = LevenshteinDistance(normalized1, normalized2);
		const similarity = 1 - dist / maxLength;

		return {
			similarity,
			algorithm: 'levenshtein',
			threshold: this.config.levenshteinThreshold,
			isSimilar: similarity >= this.config.levenshteinThreshold
		};
	}

	/**
	 * Berechnet TF-IDF basierte Ähnlichkeit
	 */
	tfIdfSimilarity(text1: string, text2: string, corpus: string[]): SimilarityResult {
		const normalized1 = this.normalizeText(text1);
		const normalized2 = this.normalizeText(text2);

		// Einfache TF-IDF Implementierung
		const allTexts = [normalized1, normalized2, ...corpus.map((t) => this.normalizeText(t))];
		const allWords = new Set(allTexts.flatMap((text) => text.split(/\s+/)));

		const calculateTfIdf = (text: string) => {
			const words = text.split(/\s+/);
			const wordCount = words.length;
			const tfIdf: { [word: string]: number } = {};

			for (const word of allWords) {
				const tf = words.filter((w) => w === word).length / wordCount;
				const df = allTexts.filter((text) => text.includes(word)).length;
				const idf = Math.log(allTexts.length / df);
				tfIdf[word] = tf * idf;
			}

			return tfIdf;
		};

		const vector1 = calculateTfIdf(normalized1);
		const vector2 = calculateTfIdf(normalized2);

		// Cosine Similarity der TF-IDF Vektoren
		let dotProduct = 0;
		let norm1 = 0;
		let norm2 = 0;

		for (const word of allWords) {
			dotProduct += vector1[word] * vector2[word];
			norm1 += vector1[word] * vector1[word];
			norm2 += vector2[word] * vector2[word];
		}

		const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

		return {
			similarity: isNaN(similarity) ? 0 : similarity,
			algorithm: 'tfidf',
			threshold: this.config.tfIdfThreshold,
			isSimilar: similarity >= this.config.tfIdfThreshold
		};
	}

	/**
	 * Führt alle Ähnlichkeitsalgorithmen aus und gibt das beste Ergebnis zurück
	 */
	calculateSimilarity(text1: string, text2: string, corpus: string[] = []): SimilarityResult[] {
		const results: SimilarityResult[] = [];

		results.push(this.cosineSimilarity(text1, text2));
		results.push(this.jaccardSimilarity(text1, text2));
		results.push(this.levenshteinSimilarity(text1, text2));

		if (corpus.length > 0) {
			results.push(this.tfIdfSimilarity(text1, text2, corpus));
		}

		return results.sort((a, b) => b.similarity - a.similarity);
	}

	/**
	 * Findet ähnliche Wünsche in einer Liste
	 */
	findSimilarWishes(
		inputText: string,
		wishes: WishText[],
		maxResults: number = 5
	): SimilarityMatch[] {
		const corpus = wishes.map((wish) => wish.text);
		const matches: SimilarityMatch[] = [];

		for (const wish of wishes) {
			const results = this.calculateSimilarity(inputText, wish.text, corpus);
			const bestResult = results[0];

			if (bestResult.isSimilar) {
				matches.push({
					wish,
					similarity: bestResult.similarity,
					algorithm: bestResult.algorithm
				});
			}
		}

		return matches.sort((a, b) => b.similarity - a.similarity).slice(0, maxResults);
	}

	/**
	 * Prüft ob ein Text zu ähnlich zu bestehenden Wünschen ist
	 */
	isDuplicate(inputText: string, wishes: WishText[]): boolean {
		const similarWishes = this.findSimilarWishes(inputText, wishes, 1);
		return similarWishes.length > 0 && similarWishes[0].similarity > 0.9;
	}

	/**
	 * Generiert Vorschläge für Variationen eines Textes
	 */
	generateVariationSuggestions(text: string): string[] {
		const suggestions: string[] = [];

		// Einfache Variationsvorschläge
		if (text.includes('Herzlichen Glückwunsch')) {
			suggestions.push(text.replace('Herzlichen Glückwunsch', 'Alles Gute'));
			suggestions.push(text.replace('Herzlichen Glückwunsch', 'Herzliche Gratulation'));
		}

		if (text.includes('Alles Gute')) {
			suggestions.push(text.replace('Alles Gute', 'Herzlichen Glückwunsch'));
			suggestions.push(text.replace('Alles Gute', 'Die besten Wünsche'));
		}

		// Füge "Liebe/r" hinzu wenn nicht vorhanden
		if (!text.includes('Liebe') && !text.includes('Lieber')) {
			suggestions.push(`Liebe/r {name}, ${text}`);
		}

		return suggestions.filter((s) => s !== text);
	}
}

// Singleton Instance für globale Verwendung
export const similarityEngine = new SimilarityEngine();
