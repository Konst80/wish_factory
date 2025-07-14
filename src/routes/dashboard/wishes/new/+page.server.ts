import { fail, redirect } from '@sveltejs/kit';
import { createWishSchema, WishStatus, WishLength } from '$lib/types/Wish.js';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase';

// Utility function to generate wish IDs with fallback
async function generateWishId(
	supabase: SupabaseClient<Database>,
	language: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_counter?: number
): Promise<string> {
	try {
		// Try database function first
		const { data: dbResult, error: dbError } = await supabase.rpc('generate_wish_id', {
			wish_language: language as 'de' | 'en'
		});

		if (dbError) {
			console.log('Database function not available, using fallback:', dbError.message);
			// Fallback: Generate UUID using crypto.randomUUID()
			return crypto.randomUUID();
		} else {
			return dbResult;
		}
	} catch (error) {
		console.error('Error with ID generation:', error);
		// Final fallback - generate UUID
		return crypto.randomUUID();
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Get authenticated user data
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();
	if (userError || !user) {
		throw redirect(302, '/auth/login');
	}

	// Load user's specific values from settings
	const { data: userSettings } = await locals.supabase
		.from('user_settings')
		.select(
			'specific_values_birthday_de, specific_values_birthday_en, specific_values_anniversary_de, specific_values_anniversary_en, specific_values_custom_de, specific_values_custom_en'
		)
		.eq('user_id', user.id)
		.single();

	// Parse and organize specific values - jetzt sind es Beschreibungen statt Zahlen
	const specificValues = {
		birthday: {
			de: userSettings?.specific_values_birthday_de || '',
			en: userSettings?.specific_values_birthday_en || ''
		},
		anniversary: {
			de: userSettings?.specific_values_anniversary_de || '',
			en: userSettings?.specific_values_anniversary_en || ''
		},
		custom: {
			de: userSettings?.specific_values_custom_de || '',
			en: userSettings?.specific_values_custom_en || ''
		}
	};

	return {
		specificValues
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		// Benutzer-Session prüfen
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get authenticated user data
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();

		// Form-Daten extrahieren
		const type = formData.get('type');
		const eventType = formData.get('eventType');
		const relations = formData.getAll('relations');
		const ageGroups = formData.getAll('ageGroups');
		const specificValuesStr = formData.get('specificValues');
		const text = formData.get('text');
		const belated = formData.get('belated') === 'true';
		const language = formData.get('language');
		const status = formData.get('status') || WishStatus.ENTWURF;
		const length = formData.get('length') || WishLength.MEDIUM;

		// Specific Values parsen - jetzt nur noch ein einzelner Wert
		let specificValues: number[] = [];
		if (specificValuesStr && typeof specificValuesStr === 'string') {
			try {
				const singleValue = parseInt(specificValuesStr.trim());
				if (!isNaN(singleValue) && singleValue > 0) {
					specificValues = [singleValue];
				}
			} catch (error) {
				console.error('Error parsing specific value:', error);
			}
		}

		// Daten für Validierung vorbereiten
		const wishData = {
			type,
			eventType,
			relations,
			ageGroups,
			specificValues,
			text,
			belated,
			status,
			language,
			length,
			createdBy: user.id
		};

		// Server-seitige Validierung
		try {
			const validatedData = createWishSchema.parse(wishData);

			// Generate wish ID using utility function
			const idResult = await generateWishId(locals.supabase, validatedData.language);

			// Wunsch in Datenbank speichern mit generierter ID
			const { data: createdWish, error: insertError } = await locals.supabase
				.from('wishes')
				.insert({
					id: idResult,
					type: validatedData.type,
					event_type: validatedData.eventType,
					relations: validatedData.relations,
					age_groups: validatedData.ageGroups,
					specific_values: validatedData.specificValues,
					text: validatedData.text,
					belated: validatedData.belated,
					status: validatedData.status,
					language: validatedData.language,
					length: validatedData.length,
					created_by: validatedData.createdBy
				})
				.select('id')
				.single();

			if (insertError) {
				console.error('Error inserting wish:', insertError);
				return fail(500, {
					message: 'Fehler beim Speichern des Wunsches: ' + insertError.message,
					errors: {},
					values: wishData
				});
			}

			// Weiterleitung zur Wunsch-Detail-Ansicht mit der neuen UUID
			throw redirect(303, `/dashboard/wishes/${createdWish.id}`);
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				// This is the expected redirect, let it through
				throw error;
			}

			if (error instanceof z.ZodError) {
				// Validierungsfehler
				const errors: Record<string, string> = {};
				for (const issue of error.issues) {
					const path = issue.path.join('.');
					errors[path] = issue.message;
				}

				return fail(400, {
					message: 'Validierungsfehler',
					errors,
					values: wishData
				});
			}

			// Unbekannter Fehler
			console.error('Unexpected error:', error);
			return fail(500, {
				message: 'Ein unerwarteter Fehler ist aufgetreten',
				errors: {},
				values: wishData
			});
		}
	},

	createBatch: async ({ request, locals }) => {
		// Benutzer-Session prüfen
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get authenticated user data
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();
		const wishesData = formData.get('wishes');

		if (!wishesData || typeof wishesData !== 'string') {
			return fail(400, { message: 'Keine Wünsche zum Speichern übermittelt' });
		}

		try {
			const wishes = JSON.parse(wishesData);

			if (!Array.isArray(wishes) || wishes.length === 0) {
				return fail(400, { message: 'Ungültige Wunsch-Daten' });
			}

			// Alle Wünsche validieren und für Datenbank vorbereiten
			const validatedWishes = [];
			let batchCounter = 0;
			for (const wish of wishes) {
				try {
					// Normalize the wish data for validation
					const normalizedWish = {
						...wish,
						createdBy: user.id,
						// Convert single specificValues to array if needed
						specificValues: Array.isArray(wish.specificValues)
							? wish.specificValues
							: wish.specificValues
								? [wish.specificValues]
								: [],
						// Ensure belated is a boolean
						belated: Boolean(wish.belated),
						// Ensure length has a default value
						length: wish.length || WishLength.MEDIUM
					};

					const validatedData = createWishSchema.parse(normalizedWish);

					// Generate ID for each wish using utility function
					const idResult = await generateWishId(
						locals.supabase,
						validatedData.language,
						batchCounter++
					);

					validatedWishes.push({
						id: idResult,
						type: validatedData.type,
						event_type: validatedData.eventType,
						relations: validatedData.relations,
						age_groups: validatedData.ageGroups,
						specific_values: validatedData.specificValues || [],
						text: validatedData.text,
						belated: validatedData.belated,
						status: validatedData.status,
						language: validatedData.language,
						length: validatedData.length,
						created_by: validatedData.createdBy
					});
				} catch (validationError) {
					console.error('Validation error for wish:', validationError);
					return fail(400, {
						message: 'Validierungsfehler bei einem der Wünsche',
						error: validationError instanceof z.ZodError ? validationError.issues : validationError
					});
				}
			}

			// Batch-Insert in Datenbank
			const { data: createdWishes, error: insertError } = await locals.supabase
				.from('wishes')
				.insert(validatedWishes)
				.select('id');

			if (insertError) {
				console.error('Error inserting batch wishes:', insertError);
				return fail(500, {
					message: 'Fehler beim Speichern der Wünsche: ' + insertError.message
				});
			}

			// Erfolgreiche Weiterleitung
			throw redirect(303, `/dashboard/wishes?created=${createdWishes?.length || wishes.length}`);
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			console.error('Error in batch create:', error);
			return fail(500, {
				message: 'Ein unerwarteter Fehler beim Batch-Speichern ist aufgetreten'
			});
		}
	}
};
