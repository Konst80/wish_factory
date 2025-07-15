import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { language } = await request.json();

		// Validate language
		if (!language || !['de', 'en'].includes(language)) {
			return json({ error: 'Invalid language' }, { status: 400 });
		}

		// Get current user
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Update user's language preference in profile
		const { error } = await locals.supabase
			.from('profiles')
			.update({ preferred_language: language })
			.eq('id', user.id);

		if (error) {
			console.error('Error updating language preference:', error);
			// Don't fail completely if column doesn't exist yet
			if (error.message.includes('column "preferred_language" does not exist')) {
				console.log('preferred_language column does not exist yet, skipping database update');
				return json({ success: true, note: 'Language preference saved locally only' });
			}
			return json({ error: 'Failed to update language preference' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in language preference update:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Get current user
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user's language preference from profile (gracefully handle missing column)
		const { data: profile, error } = await locals.supabase
			.from('profiles')
			.select('preferred_language')
			.eq('id', user.id)
			.single();

		if (error) {
			console.error('Error fetching language preference:', error);
			// Don't fail completely if column doesn't exist yet
			if (error.message.includes('column "preferred_language" does not exist')) {
				console.log('preferred_language column does not exist yet, using default');
				return json({
					language: 'de',
					success: true,
					note: 'Using default language preference'
				});
			}
			return json({ error: 'Failed to fetch language preference' }, { status: 500 });
		}

		return json({
			language: profile?.preferred_language || 'de',
			success: true
		});
	} catch (error) {
		console.error('Error in language preference fetch:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
