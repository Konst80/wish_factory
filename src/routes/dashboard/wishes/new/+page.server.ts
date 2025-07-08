import { fail, redirect } from '@sveltejs/kit';
import { createWishSchema, WishStatus } from '$lib/types/Wish.js';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		// Benutzer-Session prüfen
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
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
		const belated = formData.get('belated');
		const language = formData.get('language');
		const status = formData.get('status') || WishStatus.ENTWURF;

		// Specific Values parsen
		let specificValues: number[] = [];
		if (specificValuesStr && typeof specificValuesStr === 'string') {
			try {
				specificValues = specificValuesStr
					.split(',')
					.map((val) => parseInt(val.trim()))
					.filter((val) => !isNaN(val) && val > 0);
			} catch (error) {
				console.error('Error parsing specific values:', error);
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
			createdBy: session.user.id
		};

		// Server-seitige Validierung
		try {
			const validatedData = createWishSchema.parse(wishData);

			// Wunsch in Datenbank speichern (ID wird automatisch als UUID generiert)
			const { data: createdWish, error: insertError } = await locals.supabase
				.from('wishes')
				.insert({
					type: validatedData.type,
					event_type: validatedData.eventType,
					relations: validatedData.relations,
					age_groups: validatedData.ageGroups,
					specific_values: validatedData.specificValues,
					text: validatedData.text,
					belated: validatedData.belated,
					status: validatedData.status,
					language: validatedData.language,
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
	}
};
