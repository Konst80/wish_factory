import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { WishStatus } from '$lib/types/Wish';

// Client-side fallback for status transition validation
function validateStatusTransition(oldStatus: string, newStatus: string, userRole: string): boolean {
	// Redakteur Berechtigungen
	if (userRole === 'Redakteur' || userRole === 'editor') {
		// Kann von Entwurf zu "Zur Freigabe" wechseln
		if (oldStatus === 'Entwurf' && newStatus === 'Zur Freigabe') {
			return true;
		}
		// Kann von "Zur Freigabe" zurück zu Entwurf wechseln
		if (oldStatus === 'Zur Freigabe' && newStatus === 'Entwurf') {
			return true;
		}
		return false;
	}

	// Administrator Berechtigungen (kann alle Übergänge)
	if (userRole === 'Administrator' || userRole === 'administrator') {
		switch (oldStatus) {
			case 'Entwurf':
				return ['Zur Freigabe', 'Archiviert'].includes(newStatus);
			case 'Zur Freigabe':
				return ['Entwurf', 'Freigegeben', 'Archiviert'].includes(newStatus);
			case 'Freigegeben':
				return newStatus === 'Archiviert';
			case 'Archiviert':
				return newStatus === 'Entwurf'; // Reaktivierung möglich
			default:
				return false;
		}
	}

	return false;
}

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

	// Wunsch aus Datenbank laden
	const { data: wish, error: wishError } = await locals.supabase
		.from('wishes')
		.select('*')
		.eq('id', wishId)
		.single();

	if (wishError || !wish) {
		console.error('Error loading wish:', wishError);
		throw error(404, 'Wunsch nicht gefunden');
	}

	// Daten in das erwartete Format umwandeln
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

	// Get user profile for role-based actions
	const { data: profiles } = await locals.supabase.from('profiles').select('*').eq('id', user.id);

	const profile = profiles && profiles.length > 0 ? profiles[0] : null;

	return {
		wish: wishData,
		user: user,
		profile: profile || null
	};
};

export const actions: Actions = {
	updateStatus: async ({ params, request, locals }) => {
		// Get authenticated user data securely
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const newStatus = formData.get('status') as WishStatus;
		const wishId = params.id;

		if (!newStatus || !Object.values(WishStatus).includes(newStatus)) {
			return fail(400, { message: 'Ungültiger Status' });
		}

		try {
			// Get user profile to check permissions
			const { data: profile } = await locals.supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (!profile) {
				return fail(403, { message: 'Benutzer-Profil nicht gefunden' });
			}

			// Get current wish status
			const { data: currentWish } = await locals.supabase
				.from('wishes')
				.select('status')
				.eq('id', wishId)
				.single();

			if (!currentWish) {
				return fail(404, { message: 'Wunsch nicht gefunden' });
			}

			// Validate status transition with fallback
			let isValidTransition = false;
			try {
				// Try database function first
				const { data: dbResult, error: validationError } = await locals.supabase.rpc(
					'validate_status_transition',
					{
						current_status: currentWish.status,
						new_status: newStatus,
						user_role: profile.role
					}
				);

				if (validationError) {
					console.log('Database function not available, using fallback:', validationError.message);
					// Fallback to client-side validation
					isValidTransition = validateStatusTransition(currentWish.status, newStatus, profile.role);
				} else {
					isValidTransition = dbResult;
				}
			} catch (error) {
				console.error('Error with status validation:', error);
				// Final fallback to client-side validation
				isValidTransition = validateStatusTransition(currentWish.status, newStatus, profile.role);
			}

			if (!isValidTransition) {
				return fail(400, {
					message: `Status-Übergang von "${currentWish.status}" zu "${newStatus}" ist nicht erlaubt`
				});
			}

			// Update the wish status
			const { error: updateError } = await locals.supabase
				.from('wishes')
				.update({ status: newStatus })
				.eq('id', wishId);

			if (updateError) {
				console.error('Error updating wish status:', updateError);
				return fail(500, { message: 'Fehler beim Aktualisieren des Status' });
			}

			return { success: true, message: `Status erfolgreich auf "${newStatus}" geändert` };
		} catch (err) {
			console.error('Error in updateStatus action:', err);
			return fail(500, { message: 'Unbekannter Fehler beim Status-Update' });
		}
	},

	delete: async ({ params, locals }) => {
		// Get authenticated user data securely
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			throw redirect(302, '/auth/login');
		}

		const wishId = params.id;

		try {
			// Get user profile to check permissions
			const { data: profile } = await locals.supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (!profile || profile.role !== 'Administrator') {
				return fail(403, { message: 'Nur Administratoren können Wünsche löschen' });
			}

			// Delete the wish
			const { error: deleteError } = await locals.supabase.from('wishes').delete().eq('id', wishId);

			if (deleteError) {
				console.error('Error deleting wish:', deleteError);
				return fail(500, { message: 'Fehler beim Löschen des Wunsches' });
			}

			throw redirect(302, '/dashboard/wishes?deleted=true');
		} catch (err) {
			// Check if it's a redirect (which is expected)
			if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
				// This is the expected redirect, let it through
				throw err;
			}
			console.error('Error in delete action:', err);
			return fail(500, { message: 'Unbekannter Fehler beim Löschen' });
		}
	}
};
