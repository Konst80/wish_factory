import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SETUP_PASSWORD } from '$env/static/private';

interface SetupAdminRequest {
	presetPassword: string;
	adminEmail: string;
	adminFullName: string;
	adminPassword: string;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body: SetupAdminRequest = await request.json();

		// Validate required fields
		if (!body.presetPassword || !body.adminEmail || !body.adminFullName || !body.adminPassword) {
			return json(
				{
					status: 'error',
					message: 'Missing required fields'
				},
				{ status: 400 }
			);
		}

		// Validate preset password
		const correctPresetPassword = ADMIN_SETUP_PASSWORD || 'WishFactory2024!';
		if (body.presetPassword !== correctPresetPassword) {
			return json(
				{
					status: 'error',
					message: 'Invalid setup password'
				},
				{ status: 401 }
			);
		}

		// Create regular supabase client for checking status
		const supabase = createSupabaseServerClient({
			getAll: () => cookies.getAll(),
			setAll: (cookieValues) =>
				cookieValues.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...options, path: '/' });
				})
		});

		// Check if system is already initialized
		const { data: initData, error: initError } = await supabase
			.from('system_initialization')
			.select('id')
			.limit(1);

		if (initError) {
			console.error('Error checking initialization status:', initError);
			return json(
				{
					status: 'error',
					message: 'Failed to check system status'
				},
				{ status: 500 }
			);
		}

		if (initData && initData.length > 0) {
			return json(
				{
					status: 'error',
					message: 'System is already initialized'
				},
				{ status: 409 }
			);
		}

		// Create admin client for user creation
		const adminClient = createClient(
			process.env.PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		// Validate admin password strength
		if (body.adminPassword.length < 8) {
			return json(
				{
					status: 'error',
					message: 'Password must be at least 8 characters long'
				},
				{ status: 400 }
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.adminEmail)) {
			return json(
				{
					status: 'error',
					message: 'Invalid email format'
				},
				{ status: 400 }
			);
		}

		// Create admin user
		const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
			email: body.adminEmail,
			password: body.adminPassword,
			email_confirm: false, // Require email confirmation
			user_metadata: {
				full_name: body.adminFullName,
				role: 'Administrator'
			}
		});

		if (authError) {
			console.error('Error creating admin user:', authError);
			return json(
				{
					status: 'error',
					message: 'Failed to create admin user',
					error: authError.message
				},
				{ status: 500 }
			);
		}

		if (!authData.user) {
			return json(
				{
					status: 'error',
					message: 'Failed to create admin user - no user data returned'
				},
				{ status: 500 }
			);
		}

		// Create admin profile
		const { error: profileError } = await adminClient.from('profiles').insert({
			id: authData.user.id,
			email: body.adminEmail,
			full_name: body.adminFullName,
			role: 'Administrator'
		});

		if (profileError) {
			console.error('Error creating admin profile:', profileError);

			// Clean up the auth user if profile creation fails
			await adminClient.auth.admin.deleteUser(authData.user.id);

			return json(
				{
					status: 'error',
					message: 'Failed to create admin profile',
					error: profileError.message
				},
				{ status: 500 }
			);
		}

		// Mark system as initialized
		const { error: initializationError } = await adminClient.from('system_initialization').insert({
			admin_user_id: authData.user.id,
			admin_email: body.adminEmail,
			admin_full_name: body.adminFullName,
			setup_completed: true
		});

		if (initializationError) {
			console.error('Error marking system as initialized:', initializationError);

			// Clean up created user and profile
			await adminClient.auth.admin.deleteUser(authData.user.id);
			await adminClient.from('profiles').delete().eq('id', authData.user.id);

			return json(
				{
					status: 'error',
					message: 'Failed to complete initialization',
					error: initializationError.message
				},
				{ status: 500 }
			);
		}

		// Success response
		return json({
			status: 'success',
			message: 'Admin user created successfully',
			data: {
				userId: authData.user.id,
				email: body.adminEmail,
				fullName: body.adminFullName,
				emailConfirmationRequired: !authData.user.email_confirmed_at
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Unexpected error in admin setup:', error);
		return json(
			{
				status: 'error',
				message: 'Unexpected error occurred',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
