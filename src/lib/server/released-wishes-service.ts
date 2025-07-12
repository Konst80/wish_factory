import { createSupabaseAdminClient } from './supabase-admin';
import type { Wish, ReleasedWish } from '../types/Wish';

export class ReleasedWishesService {
	private supabase = createSupabaseAdminClient();

	/**
	 * Releases a wish by creating an entry in the released_wishes table
	 */
	async releaseWish(wishId: string, releasedBy: string): Promise<ReleasedWish> {
		// First, get the original wish
		const { data: wish, error: wishError } = await this.supabase
			.from('wishes')
			.select('*')
			.eq('id', wishId)
			.eq('status', 'Freigegeben')
			.single();

		if (wishError || !wish) {
			throw new Error(`Wish not found or not approved: ${wishError?.message}`);
		}

		// Check if wish is already released
		const { data: existingRelease } = await this.supabase
			.from('released_wishes')
			.select('id')
			.eq('original_wish_id', wishId)
			.single();

		if (existingRelease) {
			throw new Error('Wish is already released');
		}

		// Create released wish entry
		const { data: releasedWish, error: releaseError } = await this.supabase
			.from('released_wishes')
			.insert({
				original_wish_id: wishId,
				type: wish.type,
				event_type: wish.event_type,
				relations: wish.relations,
				age_groups: wish.age_groups,
				specific_values: wish.specific_values || [],
				text: wish.text,
				belated: wish.belated === 'true',
				language: wish.language,
				length: 'medium', // Default length since wishes table doesn't have this field yet
				released_by: releasedBy
			})
			.select()
			.single();

		if (releaseError || !releasedWish) {
			throw new Error(`Failed to release wish: ${releaseError?.message}`);
		}

		return {
			id: releasedWish.id,
			originalWishId: releasedWish.original_wish_id,
			type: releasedWish.type as any,
			eventType: releasedWish.event_type as any,
			relations: releasedWish.relations as any[],
			ageGroups: releasedWish.age_groups as any[],
			specificValues: releasedWish.specific_values || [],
			text: releasedWish.text,
			belated: releasedWish.belated,
			language: releasedWish.language as any,
			length: releasedWish.length as any,
			releasedAt: new Date(releasedWish.released_at)
		};
	}

	/**
	 * Gets all released wishes with optional filtering
	 */
	async getReleasedWishes(options: {
		language?: string;
		type?: string;
		eventType?: string;
		length?: string;
		belated?: boolean;
		relations?: string[];
		ageGroups?: string[];
		specificValues?: number[];
		limit?: number;
		offset?: number;
		since?: Date;
	} = {}): Promise<{
		wishes: ReleasedWish[];
		total: number;
		hasMore: boolean;
	}> {
		let query = this.supabase
			.from('released_wishes')
			.select('*', { count: 'exact' });

		// Apply filters
		if (options.language) {
			query = query.eq('language', options.language);
		}
		if (options.type) {
			query = query.eq('type', options.type);
		}
		if (options.eventType) {
			query = query.eq('event_type', options.eventType);
		}
		if (options.length) {
			query = query.eq('length', options.length);
		}
		if (options.belated !== undefined) {
			query = query.eq('belated', options.belated);
		}
		if (options.relations?.length) {
			query = query.overlaps('relations', options.relations);
		}
		if (options.ageGroups?.length) {
			query = query.overlaps('age_groups', options.ageGroups);
		}
		if (options.specificValues?.length) {
			query = query.overlaps('specific_values', options.specificValues);
		}
		if (options.since) {
			query = query.gte('released_at', options.since.toISOString());
		}

		// Apply pagination
		const limit = Math.min(options.limit || 100, 500);
		const offset = options.offset || 0;
		query = query.range(offset, offset + limit - 1);

		// Order by release date
		query = query.order('released_at', { ascending: false });

		const { data, error, count } = await query;

		if (error) {
			throw new Error(`Failed to fetch released wishes: ${error.message}`);
		}

		const wishes: ReleasedWish[] = (data || []).map(row => ({
			id: row.id,
			originalWishId: row.original_wish_id,
			type: row.type as any,
			eventType: row.event_type as any,
			relations: row.relations as any[],
			ageGroups: row.age_groups as any[],
			specificValues: row.specific_values || [],
			text: row.text,
			belated: row.belated,
			language: row.language as any,
			length: row.length as any,
			releasedAt: new Date(row.released_at)
		}));

		const total = count || 0;
		const hasMore = offset + limit < total;

		return { wishes, total, hasMore };
	}

	/**
	 * Gets a single released wish by ID
	 */
	async getReleasedWish(id: string): Promise<ReleasedWish | null> {
		const { data, error } = await this.supabase
			.from('released_wishes')
			.select('*')
			.eq('id', id)
			.single();

		if (error || !data) {
			return null;
		}

		return {
			id: data.id,
			originalWishId: data.original_wish_id,
			type: data.type as any,
			eventType: data.event_type as any,
			relations: data.relations as any[],
			ageGroups: data.age_groups as any[],
			specificValues: data.specific_values || [],
			text: data.text,
			belated: data.belated,
			language: data.language as any,
			length: data.length as any,
			releasedAt: new Date(data.released_at)
		};
	}

	/**
	 * Removes a wish from the released wishes (unreleases it)
	 */
	async unreleaseWish(wishId: string): Promise<void> {
		const { error } = await this.supabase
			.from('released_wishes')
			.delete()
			.eq('original_wish_id', wishId);

		if (error) {
			throw new Error(`Failed to unrelease wish: ${error.message}`);
		}
	}

	/**
	 * Gets metadata for filtering options
	 */
	async getMetadata(): Promise<{
		types: string[];
		eventTypes: string[];
		relations: string[];
		ageGroups: string[];
		languages: string[];
		lengths: string[];
		totalCount: number;
		lastUpdated: Date;
	}> {
		// Get distinct values for each field
		const { data: allWishes, error } = await this.supabase
			.from('released_wishes')
			.select('type, event_type, relations, age_groups, language, length, released_at');

		if (error) {
			throw new Error(`Failed to fetch metadata: ${error.message}`);
		}

		const types = new Set<string>();
		const eventTypes = new Set<string>();
		const relations = new Set<string>();
		const ageGroups = new Set<string>();
		const languages = new Set<string>();
		const lengths = new Set<string>();
		let lastUpdated = new Date(0);

		(allWishes || []).forEach(wish => {
			types.add(wish.type);
			eventTypes.add(wish.event_type);
			languages.add(wish.language);
			lengths.add(wish.length);
			
			wish.relations?.forEach((rel: string) => relations.add(rel));
			wish.age_groups?.forEach((age: string) => ageGroups.add(age));
			
			const releaseDate = new Date(wish.released_at);
			if (releaseDate > lastUpdated) {
				lastUpdated = releaseDate;
			}
		});

		return {
			types: Array.from(types).sort(),
			eventTypes: Array.from(eventTypes).sort(),
			relations: Array.from(relations).sort(),
			ageGroups: Array.from(ageGroups).sort(),
			languages: Array.from(languages).sort(),
			lengths: Array.from(lengths).sort(),
			totalCount: allWishes?.length || 0,
			lastUpdated
		};
	}

	/**
	 * Checks if a wish is already released
	 */
	async isWishReleased(wishId: string): Promise<boolean> {
		const { data, error } = await this.supabase
			.from('released_wishes')
			.select('id')
			.eq('original_wish_id', wishId)
			.single();

		return !error && !!data;
	}
}

// Export singleton instance
export const releasedWishesService = new ReleasedWishesService();