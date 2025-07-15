import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		const session = await locals.safeGetSession();
		if (!session) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const { wishIds } = await request.json();

		if (!Array.isArray(wishIds) || wishIds.length === 0) {
			return json({ error: 'Keine Wünsche zum Löschen angegeben' }, { status: 400 });
		}

		// Validate all wishIds are valid UUIDs
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		for (const id of wishIds) {
			if (!uuidRegex.test(id)) {
				return json({ error: `Ungültige Wunsch-ID: ${id}` }, { status: 400 });
			}
		}

		// Check if user has permission to delete wishes
		// For now, only allow deletion if user is admin or the wishes belong to them
		if (!session.user?.id) {
			return json({ error: 'Benutzer-ID nicht gefunden' }, { status: 401 });
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		// Get the wishes to verify ownership/permissions
		const { data: wishesToDelete, error: fetchError } = await locals.supabase
			.from('wishes')
			.select('id, created_by')
			.in('id', wishIds);

		if (fetchError) {
			console.error('Error fetching wishes for deletion:', fetchError);
			return json({ error: 'Fehler beim Laden der Wünsche' }, { status: 500 });
		}

		if (!wishesToDelete || wishesToDelete.length === 0) {
			return json({ error: 'Keine Wünsche gefunden' }, { status: 404 });
		}

		// Check permissions: Admin can delete any wish, users can only delete their own
		if (profile?.role !== 'Administrator') {
			const userId = session.user.id;
			const unauthorizedWishes = wishesToDelete.filter((wish) => wish.created_by !== userId);
			if (unauthorizedWishes.length > 0) {
				return json(
					{
						error: 'Sie haben keine Berechtigung, einige der ausgewählten Wünsche zu löschen'
					},
					{ status: 403 }
				);
			}
		}

		// Delete the wishes
		const { error: deleteError } = await locals.supabase.from('wishes').delete().in('id', wishIds);

		if (deleteError) {
			console.error('Error deleting wishes:', deleteError);
			return json({ error: 'Fehler beim Löschen der Wünsche' }, { status: 500 });
		}

		return json({
			message: `${wishesToDelete.length} Wünsche erfolgreich gelöscht`,
			deletedCount: wishesToDelete.length,
			deletedIds: wishIds
		});
	} catch (error) {
		console.error('Error in bulk delete:', error);
		return json({ error: 'Interner Serverfehler beim Löschen der Wünsche' }, { status: 500 });
	}
};
