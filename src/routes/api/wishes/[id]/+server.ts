import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSimilarityHooks } from '$lib/server/similarity-hooks.js';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		// Get authenticated user data securely
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase.from('profiles').select('*').eq('id', user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Only administrators can delete wishes
		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Keine Berechtigung zum Löschen von Wünschen' }, { status: 403 });
		}

		const { id } = params;

		if (!id) {
			return json({ error: 'Wunsch-ID fehlt' }, { status: 400 });
		}

		// Delete the wish
		const { error: deleteError } = await locals.supabase.from('wishes').delete().eq('id', id);

		if (deleteError) {
			console.error('Error deleting wish:', deleteError);
			return json(
				{
					error: 'Fehler beim Löschen des Wunsches: ' + deleteError.message
				},
				{ status: 500 }
			);
		}

		// Similarity-Hook: Cache bereinigen für gelöschten Wunsch
		try {
			const similarityHooks = createSimilarityHooks(locals.supabase);
			// Background-Ausführung
			similarityHooks.onWishDeleted(id).catch((error) => {
				console.error(`Similarity hook error for deleted wish ${id}:`, error);
			});
		} catch (error) {
			console.error('Error initializing similarity hooks:', error);
		}

		return json({ success: true, message: 'Wunsch erfolgreich gelöscht' });
	} catch (error) {
		console.error('Unexpected error in wish deletion:', error);
		return json(
			{
				error: 'Ein unerwarteter Fehler ist aufgetreten'
			},
			{ status: 500 }
		);
	}
};
