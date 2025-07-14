import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookies) => cookies.forEach(({ name, value, options }) => {
			cookies.set(name, value, { ...options, path: '/' });
		})
	});

	try {
		// Check if system is already initialized
		const { data: initData, error: initError } = await supabase
			.from('system_initialization')
			.select('id')
			.limit(1);

		if (initError) {
			console.error('Error checking initialization status:', initError);
			// Allow access if we can't check - better than blocking legitimate setup
			return {};
		}

		// If system is already initialized, redirect to login
		if (initData && initData.length > 0) {
			throw redirect(302, '/auth/login?message=already_initialized');
		}

		// Also check if any admin users exist (fallback for manual setup)
		const { data: adminData, error: adminError } = await supabase
			.from('profiles')
			.select('id')
			.eq('role', 'Administrator')
			.limit(1);

		if (adminError) {
			console.error('Error checking admin users:', adminError);
			// Allow access if we can't check
			return {};
		}

		// If admin users exist, redirect to login
		if (adminData && adminData.length > 0) {
			throw redirect(302, '/auth/login?message=admin_exists');
		}

		// System needs setup, allow access to setup page
		return {};

	} catch (error) {
		if (error instanceof Response) {
			throw error; // Re-throw redirect responses
		}
		
		console.error('Unexpected error in setup-admin load:', error);
		// Allow access if unexpected error - better than blocking legitimate setup
		return {};
	}
};