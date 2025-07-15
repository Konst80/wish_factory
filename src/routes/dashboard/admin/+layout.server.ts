import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Get authenticated user
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(302, '/auth/login');
	}

	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!profile || profile.role !== 'Administrator') {
		throw redirect(302, '/dashboard/wishes');
	}

	return {
		user,
		profile
	};
};
