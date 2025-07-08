import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(302, '/auth/login');
	}

	// Get theme from parent layout
	const { userTheme } = await parent();

	// Get user profile and stats
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (!profile) {
		throw redirect(302, '/auth/login');
	}

	// Get dashboard stats
	const { data: wishStats } = await locals.supabase
		.from('wishes')
		.select('id, status, created_at')
		.eq('author_id', user.id);

	const stats = {
		total: wishStats?.length || 0,
		drafts: wishStats?.filter((w) => w.status === 'Entwurf').length || 0,
		pending: wishStats?.filter((w) => w.status === 'Zur Freigabe').length || 0,
		published: wishStats?.filter((w) => w.status === 'Freigegeben').length || 0
	};

	return {
		user: {
			id: user.id,
			email: user.email,
			name: profile.full_name,
			role: profile.role,
			isAdmin: profile.role === 'Administrator',
			avatar_url: profile.avatar_url
		},
		profile,
		stats,
		userTheme // Pass theme to dashboard pages
	};
};
