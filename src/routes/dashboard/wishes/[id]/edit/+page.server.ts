import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { createWishSchema, WishStatus } from '$lib/types/Wish';
import { z } from 'zod';
import { createSimilarityHooks } from '$lib/server/similarity-hooks.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Get authenticated user data securely
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();
	if (userError || !user) {
		throw redirect(303, '/auth/login');
	}

	const wishId = params.id;

	// Load the wish to edit
	const { data: wish, error: wishError } = await locals.supabase
		.from('wishes')
		.select('*')
		.eq('id', wishId)
		.single();

	if (wishError || !wish) {
		console.error('Error loading wish:', wishError);
		throw error(404, 'Wunsch nicht gefunden');
	}

	// Get user profile for permission checking
	const { data: profiles } = await locals.supabase.from('profiles').select('*').eq('id', user.id);

	const profile = profiles && profiles.length > 0 ? profiles[0] : null;

	// Check permissions
	const canEdit = profile && (profile.role === 'Administrator' || wish.created_by === user.id);

	if (!canEdit) {
		throw error(403, 'Keine Berechtigung zum Bearbeiten dieses Wunsches');
	}

	// Transform wish data to expected format
	const wishData = {
		id: wish.id,
		type: wish.type,
		eventType: wish.event_type,
		relations: wish.relations || [],
		ageGroups: wish.age_groups || [],
		specificValues: wish.specific_values || [],
		text: wish.text,
		belated: typeof wish.belated === 'boolean' ? wish.belated : wish.belated === 'true', // Convert string to boolean
		status: wish.status,
		language: wish.language,
		createdAt: wish.created_at ? new Date(wish.created_at) : new Date(),
		updatedAt: wish.updated_at ? new Date(wish.updated_at) : new Date(),
		createdBy: wish.created_by
	};

	return {
		wish: wishData,
		user: user,
		profile
	};
};

export const actions: Actions = {
	delete: async ({ request, params, locals }) => {
		// Get authenticated user data securely
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const wishId = params.id;
		const formData = await request.formData();
		const idFromForm = formData.get('id');

		// Verify the ID matches
		if (idFromForm !== wishId) {
			return fail(400, { message: 'ID stimmt nicht überein' });
		}

		// Load the wish to verify ownership/permissions
		const { data: wish, error: wishError } = await locals.supabase
			.from('wishes')
			.select('*')
			.eq('id', wishId)
			.single();

		if (wishError || !wish) {
			console.error('Error loading wish for deletion:', wishError);
			return fail(404, { message: 'Wunsch nicht gefunden' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase.from('profiles').select('*').eq('id', user.id);
		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Check permissions - only the creator or administrator can delete
		const canDelete = profile && (profile.role === 'Administrator' || wish.created_by === user.id);

		if (!canDelete) {
			return fail(403, { message: 'Keine Berechtigung zum Löschen dieses Wunsches' });
		}

		// Delete the wish
		const { error: deleteError } = await locals.supabase.from('wishes').delete().eq('id', wishId);

		if (deleteError) {
			console.error('Error deleting wish:', deleteError);
			return fail(500, { message: 'Fehler beim Löschen des Wunsches: ' + deleteError.message });
		}

		// Similarity-Hook: Cache invalidieren für gelöschten Wunsch
		try {
			const similarityHooks = createSimilarityHooks(locals.supabase);
			// Background-Ausführung um User nicht zu blockieren
			similarityHooks.onWishDeleted(wishId).catch((error) => {
				console.error('Similarity hook error for deleted wish:', error);
			});
		} catch (error) {
			console.error('Error initializing similarity hooks:', error);
		}

		// Redirect to wishes list
		throw redirect(303, '/dashboard/wishes');
	},

	update: async ({ request, params, locals }) => {
		// Get authenticated user data securely
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const wishId = params.id;
		const formData = await request.formData();

		// Extract form data
		const type = formData.get('type');
		const eventType = formData.get('eventType');
		const rawRelations = formData.getAll('relations');
		const rawAgeGroups = formData.getAll('ageGroups');
		const specificValuesStr = formData.get('specificValues');
		const rawText = formData.get('text');
		const belated = formData.get('belated') === 'true';

		// Ensure minimum requirements are met
		const relations = rawRelations.length > 0 ? rawRelations : ['friend'];
		const ageGroups = rawAgeGroups.length > 0 ? rawAgeGroups : ['all'];
		const text =
			rawText && rawText.toString().trim().length >= 10
				? rawText.toString()
				: 'Alles Gute zum [Anlass], liebe/r [Name]!';
		const language = formData.get('language');
		const status = formData.get('status') || WishStatus.ENTWURF;

		// Parse specific values
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

		// Prepare data for validation
		const updateData = {
			type,
			eventType,
			relations,
			ageGroups,
			specificValues,
			text,
			isBelated: belated,
			status,
			language,
			createdBy: user.id
		};

		try {
			// Validate the data
			const validatedData = createWishSchema.parse(updateData);

			// Update the wish in database
			const { error: updateError } = await locals.supabase
				.from('wishes')
				.update({
					type: validatedData.type,
					event_type: validatedData.eventType,
					relations: validatedData.relations,
					age_groups: validatedData.ageGroups,
					specific_values: validatedData.specificValues,
					text: validatedData.text,
					belated: validatedData.isBelated,
					status: validatedData.status,
					language: validatedData.language,
					updated_at: new Date().toISOString()
				})
				.eq('id', wishId);

			if (updateError) {
				console.error('Error updating wish:', updateError);
				return fail(500, {
					message: 'Fehler beim Aktualisieren des Wunsches: ' + updateError.message,
					errors: {},
					values: updateData
				});
			}

			// Similarity-Hook: Cache invalidieren und neu berechnen für aktualisierten Wunsch
			try {
				const similarityHooks = createSimilarityHooks(locals.supabase);
				const updatedWish = {
					...validatedData,
					id: wishId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				// Background-Ausführung um User nicht zu blockieren
				similarityHooks.onWishUpdated(wishId, updatedWish).catch((error) => {
					console.error('Similarity hook error for updated wish:', error);
				});
			} catch (error) {
				console.error('Error initializing similarity hooks:', error);
			}

			// Redirect to wish detail page
			throw redirect(303, `/dashboard/wishes/${wishId}`);
		} catch (error) {
			// Check if it's a redirect (which is expected)
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			if (error instanceof z.ZodError) {
				// Validation errors
				const errors: Record<string, string> = {};
				for (const issue of error.issues) {
					const path = issue.path.join('.');
					errors[path] = issue.message;
				}

				return fail(400, {
					message: 'Validierungsfehler',
					errors,
					values: updateData
				});
			}

			// Unknown error
			console.error('Unexpected error in edit:', error);
			return fail(500, {
				message: 'Ein unerwarteter Fehler ist aufgetreten',
				errors: {},
				values: updateData
			});
		}
	}
};
