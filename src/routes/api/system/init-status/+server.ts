import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const supabase = createSupabaseServerClient({
			getAll: () => cookies.getAll(),
			setAll: (cookies) => cookies.forEach(({ name, value, options }) => {
				cookies.set(name, value, { ...options, path: '/' });
			})
		});

		// Check if system has been initialized
		const { data: initData, error: initError } = await supabase
			.from('system_initialization')
			.select('id, admin_email, created_at, setup_completed')
			.limit(1);

		if (initError) {
			console.error('Error checking initialization status:', initError);
			return json({
				status: 'error',
				message: 'Failed to check initialization status',
				error: initError.message
			}, { status: 500 });
		}

		const isInitialized = initData && initData.length > 0;

		// If not initialized, also check if any admin users exist
		// This is a fallback for systems that might have been set up manually
		let hasAdminUsers = false;
		if (!isInitialized) {
			const { data: adminData, error: adminError } = await supabase
				.from('profiles')
				.select('id')
				.eq('role', 'Administrator')
				.limit(1);

			if (adminError) {
				console.error('Error checking admin users:', adminError);
				// Don't fail completely, just log the error
			} else {
				hasAdminUsers = adminData && adminData.length > 0;
			}
		}

		return json({
			status: 'success',
			data: {
				isInitialized,
				hasAdminUsers,
				requiresSetup: !isInitialized && !hasAdminUsers,
				initializationInfo: isInitialized ? {
					adminEmail: initData[0].admin_email,
					completedAt: initData[0].created_at
				} : null
			},
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Unexpected error checking initialization status:', error);
		return json({
			status: 'error',
			message: 'Unexpected error occurred',
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};