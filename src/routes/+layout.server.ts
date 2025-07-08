import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session } = await safeGetSession();

	let userTheme = 'light'; // Default theme

	// If user is logged in, fetch their theme preference
	if (session?.user) {
		try {
			const { data: settings } = await supabase
				.from('user_settings')
				.select('theme')
				.eq('user_id', session.user.id)
				.single();
			
			if (settings?.theme) {
				userTheme = settings.theme;
			}
		} catch (error) {
			console.error('Error fetching user theme:', error);
			// Keep default theme on error
		}
	}

	return {
		session,
		userTheme
	};
};
