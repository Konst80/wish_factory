import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET: Alle aktiven Wunsch-Sprachen abrufen (öffentlich zugänglich)
 * Für Dropdowns in Wunsch-Formularen
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Authentication check (alle eingeloggten Benutzer können aktive Sprachen abrufen)
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get only active wish languages
		const { data: languages, error } = await locals.supabase
			.from('wish_languages')
			.select('id, code, name, flag')
			.eq('is_active', true)
			.order('name', { ascending: true });

		if (error) {
			console.error('❌ Failed to fetch active wish languages:', error);
			return json({ error: 'Failed to fetch active wish languages' }, { status: 500 });
		}

		return json({ languages });
	} catch (err) {
		console.error('❌ Active wish languages fetch failed:', err);
		return json(
			{
				error: 'Active wish languages fetch failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
