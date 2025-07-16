import { createSimilarityService } from './similarity-service.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase.js';
import type { Wish } from '$lib/types/Wish.js';

export class SimilarityHooks {
	private supabase: SupabaseClient<Database>;
	private similarityService: ReturnType<typeof createSimilarityService>;

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
		this.similarityService = createSimilarityService(supabase);
	}

	/**
	 * Hook für nach dem Erstellen eines Wunsches
	 */
	async onWishCreated(wish: Wish): Promise<void> {
		try {
			console.log(`Ähnlichkeits-Hook: Vorberechnung für neuen Wunsch ${wish.id}`);

			// Ähnlichkeiten für den neuen Wunsch vorberechnen
			await this.similarityService.precomputeSimilarityForWish(wish);

			console.log(`Ähnlichkeits-Hook: Vorberechnung für Wunsch ${wish.id} abgeschlossen`);
		} catch (error) {
			console.error(`Fehler in Ähnlichkeits-Hook für Wunsch ${wish.id}:`, error);
			// Fehler nicht weiterwerfen, da der Wunsch bereits erstellt wurde
		}
	}

	/**
	 * Hook für nach dem Aktualisieren eines Wunsches
	 */
	async onWishUpdated(wishId: string, updatedWish: Wish): Promise<void> {
		try {
			console.log(`Ähnlichkeits-Hook: Cache-Invalidierung für aktualisierten Wunsch ${wishId}`);

			// Cache für den aktualisierten Wunsch invalidieren
			await this.similarityService.invalidateCacheForWish(wishId);

			// Neue Ähnlichkeiten berechnen
			await this.similarityService.precomputeSimilarityForWish(updatedWish);

			console.log(`Ähnlichkeits-Hook: Cache-Aktualisierung für Wunsch ${wishId} abgeschlossen`);
		} catch (error) {
			console.error(`Fehler in Ähnlichkeits-Hook für Wunsch ${wishId}:`, error);
			// Fehler nicht weiterwerfen, da der Wunsch bereits aktualisiert wurde
		}
	}

	/**
	 * Hook für nach dem Löschen eines Wunsches
	 */
	async onWishDeleted(wishId: string): Promise<void> {
		try {
			console.log(`Ähnlichkeits-Hook: Cache-Bereinigung für gelöschten Wunsch ${wishId}`);

			// Cache für den gelöschten Wunsch invalidieren
			await this.similarityService.invalidateCacheForWish(wishId);

			console.log(`Ähnlichkeits-Hook: Cache-Bereinigung für Wunsch ${wishId} abgeschlossen`);
		} catch (error) {
			console.error(`Fehler in Ähnlichkeits-Hook für Wunsch ${wishId}:`, error);
			// Fehler nicht weiterwerfen, da der Wunsch bereits gelöscht wurde
		}
	}

	/**
	 * Hook für Batch-Operationen
	 */
	async onBatchWishesCreated(wishes: Wish[]): Promise<void> {
		try {
			console.log(`Ähnlichkeits-Hook: Batch-Vorberechnung für ${wishes.length} Wünsche`);

			// Parallele Vorberechnung für alle neuen Wünsche
			const promises = wishes.map((wish) =>
				this.similarityService.precomputeSimilarityForWish(wish).catch((error) => {
					console.error(`Fehler bei Batch-Vorberechnung für Wunsch ${wish.id}:`, error);
					return null; // Fehler nicht weiterwerfen
				})
			);

			await Promise.all(promises);

			console.log(
				`Ähnlichkeits-Hook: Batch-Vorberechnung für ${wishes.length} Wünsche abgeschlossen`
			);
		} catch (error) {
			console.error(`Fehler in Batch-Ähnlichkeits-Hook:`, error);
			// Fehler nicht weiterwerfen
		}
	}

	/**
	 * Hook für Status-Änderungen
	 */
	async onWishStatusChanged(wishId: string, oldStatus: string, newStatus: string): Promise<void> {
		try {
			// Cache invalidieren wenn Wunsch von/zu "Archiviert" wechselt
			if (oldStatus === 'Archiviert' || newStatus === 'Archiviert') {
				console.log(
					`Ähnlichkeits-Hook: Cache-Invalidierung für Status-Änderung ${wishId} (${oldStatus} -> ${newStatus})`
				);

				await this.similarityService.invalidateCacheForWish(wishId);

				// Neue Ähnlichkeiten berechnen wenn nicht archiviert
				if (newStatus !== 'Archiviert') {
					const { data: wish } = await this.supabase
						.from('wishes')
						.select('*')
						.eq('id', wishId)
						.single();

					if (wish) {
						const convertedWish = {
							...wish,
							eventType: wish.event_type,
							ageGroups: wish.age_groups,
							specificValues: wish.specific_values || [],
							createdAt: wish.created_at ? new Date(wish.created_at) : new Date(),
							updatedAt: wish.updated_at ? new Date(wish.updated_at) : new Date(),
							createdBy: wish.created_by,
							length: wish.length as 'short' | 'medium' | 'long'
						};
						await this.similarityService.precomputeSimilarityForWish(convertedWish);
					}
				}

				console.log(`Ähnlichkeits-Hook: Status-Änderung für Wunsch ${wishId} verarbeitet`);
			}
		} catch (error) {
			console.error(`Fehler in Status-Änderungs-Hook für Wunsch ${wishId}:`, error);
			// Fehler nicht weiterwerfen
		}
	}
}

// Factory-Funktion für einfache Verwendung
export function createSimilarityHooks(supabase: SupabaseClient<Database>): SimilarityHooks {
	return new SimilarityHooks(supabase);
}
