import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Force server-side logout on page load
	try {
		await supabase.auth.signOut({ scope: 'global' });
	} catch (error) {
		console.error('Server-side logout error:', error);
	}

	return {};
};

export const actions: Actions = {
	default: async ({ locals: { supabase } }) => {
		try {
			await supabase.auth.signOut({ scope: 'global' });
		} catch (error) {
			console.error('Action logout error:', error);
		}
		throw redirect(303, '/auth/login');
	}
};
