import { fail, redirect } from '@sveltejs/kit';
import { createWishSchema, WishStatus } from '$lib/types/Wish.js';
import type { Actions, PageServerLoad } from './$types.js';
import { z } from 'zod';

export const load: PageServerLoad = async () => {
	// Für die Entwicklungsphase: Dummy-User zurückgeben
	// Später durch echte Authentifizierung ersetzen
	const dummyUser = {
		id: 'dev-user-123',
		email: 'dev@example.com',
		user_metadata: {
			full_name: 'Entwickler',
			avatar_url: ''
		}
	};

	return {
		user: dummyUser
	};
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

			// Eindeutige ID generieren
			const language_code = validatedData.language;

			// Nächste verfügbare Nummer für die Sprache ermitteln
			const { data: existingWishes, error: countError } = await locals.supabase
				.from('wishes')
				.select('id')
				.like('id', `wish_external_${language_code}_%`)
				.order('id', { ascending: false })
				.limit(1);

			if (countError) {
				console.error('Error counting wishes:', countError);
				return fail(500, {
					message: 'Fehler beim Erstellen der Wunsch-ID',
					errors: {},
					values: wishData
				});
			}

			let nextNumber = 1;
			if (existingWishes && existingWishes.length > 0) {
				const lastId = existingWishes[0].id;
				const match = lastId.match(/wish_external_[a-z]+_(\d+)$/);
				if (match) {
					nextNumber = parseInt(match[1]) + 1;
				}
			}

			const wishId = `wish_external_${language_code}_${nextNumber.toString().padStart(3, '0')}`;

			// Wunsch in Datenbank speichern
			const { error: insertError } = await locals.supabase.from('wishes').insert({
				id: wishId,
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
			});

			if (insertError) {
				console.error('Error inserting wish:', insertError);
				return fail(500, {
					message: 'Fehler beim Speichern des Wunsches',
					errors: {},
					values: wishData
				});
			}

			// Weiterleitung zur Wunsch-Übersicht oder Detail-Ansicht
			throw redirect(303, `/dashboard/wishes/${wishId}`);
		} catch (error) {
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
