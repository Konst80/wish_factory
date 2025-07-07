import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Get user profile
	const { data: profiles, error: profileError } = user
		? await locals.supabase.from('profiles').select('*').eq('id', user.id)
		: { data: null, error: null };

	// Take the first profile if multiple exist, or null if none
	const profile = profiles && profiles.length > 0 ? profiles[0] : null;

	// Log any profile errors for debugging
	if (profileError) {
		console.error('Profile fetch error:', profileError);
	}

	return {
		session,
		profile
	};
};
