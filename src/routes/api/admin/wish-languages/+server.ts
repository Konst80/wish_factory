import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface WishLanguage {
	id: string;
	code: string;
	name: string;
	flag: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

/**
 * GET: Alle Wunsch-Sprachen abrufen
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Authentication check
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin (only admins can view language management)
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Get all wish languages
		const { data: languages, error } = await locals.supabase
			.from('wish_languages')
			.select('*')
			.order('created_at', { ascending: true });

		if (error) {
			console.error('❌ Failed to fetch wish languages:', error);
			return json({ error: 'Failed to fetch wish languages' }, { status: 500 });
		}

		return json({ languages });
	} catch (err) {
		console.error('❌ Wish languages fetch failed:', err);
		return json(
			{
				error: 'Wish languages fetch failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST: Neue Wunsch-Sprache hinzufügen
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentication check
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const { code, name, flag } = body;

		// Validation
		if (!code || !name || !flag) {
			return json({ error: 'Code, name, and flag are required' }, { status: 400 });
		}

		if (!/^[a-z]{2}$/.test(code)) {
			return json({ error: 'Code must be exactly 2 lowercase letters' }, { status: 400 });
		}

		if (name.length < 2 || name.length > 50) {
			return json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 });
		}

		if (flag.length > 10) {
			return json({ error: 'Flag must be 10 characters or less' }, { status: 400 });
		}

		// Check if language code already exists
		const { data: existing } = await locals.supabase
			.from('wish_languages')
			.select('id')
			.eq('code', code)
			.single();

		if (existing) {
			return json({ error: 'Language code already exists' }, { status: 409 });
		}

		// Insert new language
		const { data: language, error } = await locals.supabase
			.from('wish_languages')
			.insert({
				code,
				name,
				flag,
				is_active: true
			})
			.select()
			.single();

		if (error) {
			console.error('❌ Failed to create wish language:', error);
			return json({ error: 'Failed to create wish language' }, { status: 500 });
		}

		return json({ language }, { status: 201 });
	} catch (err) {
		console.error('❌ Wish language creation failed:', err);
		return json(
			{
				error: 'Wish language creation failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT: Wunsch-Sprache aktualisieren (aktivieren/deaktivieren)
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentication check
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const { id, is_active, name, flag } = body;

		// Validation
		if (!id) {
			return json({ error: 'Language ID is required' }, { status: 400 });
		}

		// Build update object
		const updates: Partial<WishLanguage> = {};
		if (typeof is_active === 'boolean') {
			updates.is_active = is_active;
		}
		if (name && name.length >= 2 && name.length <= 50) {
			updates.name = name;
		}
		if (flag && flag.length <= 10) {
			updates.flag = flag;
		}

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid fields to update' }, { status: 400 });
		}

		// Update language
		const { data: language, error } = await locals.supabase
			.from('wish_languages')
			.update(updates)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('❌ Failed to update wish language:', error);
			// Check if it's the "at least one active" constraint
			if (error.message.includes('Mindestens eine Wunsch-Sprache muss aktiv sein')) {
				return json({ error: 'At least one language must remain active' }, { status: 400 });
			}
			return json({ error: 'Failed to update wish language' }, { status: 500 });
		}

		return json({ language });
	} catch (err) {
		console.error('❌ Wish language update failed:', err);
		return json(
			{
				error: 'Wish language update failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE: Wunsch-Sprache löschen
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentication check
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const { id } = body;

		// Validation
		if (!id) {
			return json({ error: 'Language ID is required' }, { status: 400 });
		}

		// Check if language is used in existing wishes
		const { data: wishesWithLanguage, error: wishError } = await locals.supabase
			.from('wishes')
			.select('id')
			.eq('language', id)
			.limit(1);

		if (wishError) {
			console.error('❌ Failed to check wishes for language:', wishError);
			return json({ error: 'Failed to check language usage' }, { status: 500 });
		}

		if (wishesWithLanguage && wishesWithLanguage.length > 0) {
			return json(
				{ error: 'Cannot delete language that is used in existing wishes' },
				{ status: 400 }
			);
		}

		// Delete language
		const { error } = await locals.supabase.from('wish_languages').delete().eq('id', id);

		if (error) {
			console.error('❌ Failed to delete wish language:', error);
			// Check if it's the "at least one active" constraint
			if (error.message.includes('Mindestens eine Wunsch-Sprache muss aktiv sein')) {
				return json({ error: 'At least one language must remain active' }, { status: 400 });
			}
			return json({ error: 'Failed to delete wish language' }, { status: 500 });
		}

		return json({ message: 'Language deleted successfully' });
	} catch (err) {
		console.error('❌ Wish language deletion failed:', err);
		return json(
			{
				error: 'Wish language deletion failed',
				message: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
