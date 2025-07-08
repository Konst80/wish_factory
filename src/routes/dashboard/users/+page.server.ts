import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	// Get current user's profile to check permissions
	const { data: currentUserProfile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (!currentUserProfile || currentUserProfile.role !== 'Administrator') {
		throw error(403, 'Nur Administratoren können Benutzer verwalten');
	}

	try {
		// Get search and filter parameters
		const searchTerm = url.searchParams.get('search') || '';
		const selectedRole = url.searchParams.get('role') || '';
		const selectedStatus = url.searchParams.get('status') || '';

		// Use admin client to bypass RLS for user management
		const adminClient = createSupabaseAdminClient();

		// First, get ALL profiles for statistics (unfiltered)
		const { data: allProfiles, error: allProfilesError } = await adminClient
			.from('profiles')
			.select(
				`
				id,
				email,
				full_name,
				role,
				created_at,
				updated_at
			`
			)
			.order('created_at', { ascending: false });

		if (allProfilesError) {
			console.error('Error fetching all profiles:', allProfilesError);
			throw error(500, 'Fehler beim Laden der Benutzerdaten');
		}

		// Then, build the query for filtered profiles
		let query = adminClient.from('profiles').select(`
				id,
				email,
				full_name,
				role,
				created_at,
				updated_at
			`);

		// Apply filters
		if (searchTerm) {
			query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
		}
		if (selectedRole === 'Administrator' || selectedRole === 'Redakteur') {
			query = query.eq('role', selectedRole);
		}

		const { data: profiles, error: profilesError } = await query.order('created_at', {
			ascending: false
		});

		if (profilesError) {
			console.error('Error fetching filtered profiles:', profilesError);
			throw error(500, 'Fehler beim Laden der Benutzerdaten');
		}

		// Transform ALL profiles for statistics calculation
		const allUsersForStats = (allProfiles || []).map((profile) => {
			// For now, mark users as active if they were created recently (within 30 days)
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const createdAt = new Date(profile.created_at);
			const isActive = createdAt > thirtyDaysAgo;

			return {
				id: profile.id,
				full_name: profile.full_name,
				email: profile.email,
				role: profile.role,
				status: isActive ? 'active' : ('inactive' as const),
				createdAt: createdAt,
				lastLogin: createdAt, // Placeholder - use creation date as fallback
				emailConfirmed: true // Placeholder
			};
		});

		// Transform the filtered data for display
		const filteredUsers = (profiles || []).map((profile) => {
			// For now, mark users as active if they were created recently (within 30 days)
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const createdAt = new Date(profile.created_at);
			const isActive = createdAt > thirtyDaysAgo;

			return {
				id: profile.id,
				full_name: profile.full_name,
				email: profile.email,
				role: profile.role,
				status: isActive ? 'active' : ('inactive' as const),
				createdAt: createdAt,
				lastLogin: createdAt, // Placeholder - use creation date as fallback
				emailConfirmed: true // Placeholder
			};
		});

		// Apply status filter to the already filtered users if specified
		const finalUsers =
			selectedStatus === 'active' || selectedStatus === 'inactive'
				? filteredUsers.filter((user) => user.status === selectedStatus)
				: filteredUsers;

		// Calculate statistics from ALL users (unfiltered)
		const stats = {
			total: allUsersForStats.length,
			active: allUsersForStats.filter((u) => u.status === 'active').length,
			administrators: allUsersForStats.filter((u) => u.role === 'Administrator').length,
			redakteure: allUsersForStats.filter((u) => u.role === 'Redakteur').length
		};

		return {
			users: finalUsers,
			stats,
			filters: {
				search: searchTerm,
				role: selectedRole,
				status: selectedStatus
			}
		};
	} catch (err) {
		console.error('Error loading users:', err);
		throw error(500, 'Fehler beim Laden der Benutzerdaten');
	}
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Use admin client for permission checks and updates
		const adminClient = createSupabaseAdminClient();

		// Check if current user is admin
		const { data: currentUserProfile } = await adminClient
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!currentUserProfile || currentUserProfile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('role') as string;

		if (!userId || !newRole || (newRole !== 'Administrator' && newRole !== 'Redakteur')) {
			return fail(400, { message: 'Ungültige Daten' });
		}

		// Prevent admin from removing their own admin role if they're the only admin
		if (userId === user.id && newRole !== 'Administrator') {
			const { count } = await adminClient
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('role', 'Administrator');

			if (count && count <= 1) {
				return fail(400, {
					message:
						'Sie können sich nicht selbst die Administrator-Rolle entziehen, wenn Sie der einzige Administrator sind'
				});
			}
		}

		const { error: updateError } = await adminClient
			.from('profiles')
			.update({ role: newRole, updated_at: new Date().toISOString() })
			.eq('id', userId);

		if (updateError) {
			console.error('Error updating user role:', updateError);
			return fail(500, { message: 'Fehler beim Aktualisieren der Rolle' });
		}

		return { success: true, message: 'Rolle erfolgreich aktualisiert' };
	},

	deleteUser: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Check if current user is admin
		const { data: currentUserProfile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!currentUserProfile || currentUserProfile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'Benutzer-ID fehlt' });
		}

		// Prevent admin from deleting themselves if they're the only admin
		if (userId === user.id) {
			const { count } = await locals.supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('role', 'Administrator');

			if (count && count <= 1) {
				return fail(400, {
					message: 'Sie können sich nicht selbst löschen, wenn Sie der einzige Administrator sind'
				});
			}
		}

		// Check if user has created wishes
		const { count: wishCount } = await locals.supabase
			.from('wishes')
			.select('*', { count: 'exact', head: true })
			.eq('created_by', userId);

		if (wishCount && wishCount > 0) {
			return fail(400, {
				message: `Benutzer kann nicht gelöscht werden, da er ${wishCount} Wünsche erstellt hat. Archivieren Sie den Benutzer stattdessen.`
			});
		}

		// Delete user (this will cascade to profile due to FK constraint)
		const adminClient = createSupabaseAdminClient();
		const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

		if (deleteError) {
			console.error('Error deleting user:', deleteError);
			return fail(500, { message: 'Fehler beim Löschen des Benutzers' });
		}

		return { success: true, message: 'Benutzer erfolgreich gelöscht' };
	},

	createUser: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Check if current user is admin
		const { data: currentUserProfile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!currentUserProfile || currentUserProfile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const fullName = formData.get('fullName') as string;
		const role = formData.get('role') as string;
		const password = formData.get('password') as string;

		if (!email || !fullName || !role || !password) {
			return fail(400, { message: 'Alle Felder sind erforderlich' });
		}

		if (role !== 'Administrator' && role !== 'Redakteur') {
			return fail(400, { message: 'Ungültige Rolle' });
		}

		// Validate full name length (must be 2-100 characters per database constraint)
		if (fullName.length < 2 || fullName.length > 100) {
			return fail(400, { message: 'Name muss zwischen 2 und 100 Zeichen lang sein' });
		}

		const adminClient = createSupabaseAdminClient();

		try {
			// Create user using Supabase Auth Admin API
			const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: {
					full_name: fullName
				}
			});

			if (createError) {
				console.error('Error creating user:', createError);
				return fail(500, { message: 'Fehler beim Erstellen des Benutzers: ' + createError.message });
			}

			if (!newUser.user) {
				return fail(500, { message: 'Benutzer wurde nicht erstellt' });
			}

			// Wait longer for database triggers to complete
			await new Promise(resolve => setTimeout(resolve, 500));

			// Check if profile was created by trigger
			const { data: existingProfile } = await adminClient
				.from('profiles')
				.select('id')
				.eq('id', newUser.user.id)
				.single();

			if (!existingProfile) {
				// Trigger didn't create profile, create it manually
				const { error: profileError } = await adminClient.from('profiles').insert({
					id: newUser.user.id,
					email: newUser.user.email || email,
					full_name: fullName,
					role: role as 'Administrator' | 'Redakteur',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				});

				if (profileError) {
					console.error('Error creating user profile:', profileError);
					// Clean up - delete the auth user if profile creation failed
					await adminClient.auth.admin.deleteUser(newUser.user.id);
					return fail(500, {
						message: 'Fehler beim Erstellen des Benutzerprofils: ' + profileError.message
					});
				}
			} else {
				// Profile exists, update it with the correct role and name
				const { error: updateError } = await adminClient
					.from('profiles')
					.update({
						full_name: fullName,
						role: role as 'Administrator' | 'Redakteur',
						updated_at: new Date().toISOString()
					})
					.eq('id', newUser.user.id);

				if (updateError) {
					console.error('Error updating user profile:', updateError);
					return fail(500, {
						message: 'Fehler beim Aktualisieren des Benutzerprofils: ' + updateError.message
					});
				}
			}

			return { success: true, message: 'Benutzer erfolgreich erstellt' };
		} catch (error) {
			console.error('Unexpected error during user creation:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	}
};
