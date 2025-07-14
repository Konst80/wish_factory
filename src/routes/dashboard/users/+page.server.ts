import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase-admin';
import { createInvitation } from '$lib/server/invitations';
import { sendInvitationEmail } from '$lib/server/email';

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

		// Get ALL invitations for statistics (unfiltered) 
		const { data: allInvitations, error: allInvitationsError } = await adminClient
			.from('invitations')
			.select(
				`
				id,
				email,
				full_name,
				role,
				created_at,
				expires_at,
				accepted_at
			`
			)
			.is('accepted_at', null)
			.order('created_at', { ascending: false });

		if (allInvitationsError) {
			console.error('Error fetching all invitations:', allInvitationsError);
			throw error(500, 'Fehler beim Laden der Einladungsdaten');
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

		// Build query for filtered invitations
		let invitationQuery = adminClient.from('invitations').select(`
				id,
				email,
				full_name,
				role,
				created_at,
				expires_at,
				accepted_at
			`).is('accepted_at', null);

		// Apply filters to invitations
		if (searchTerm) {
			invitationQuery = invitationQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
		}
		if (selectedRole === 'Administrator' || selectedRole === 'Redakteur') {
			invitationQuery = invitationQuery.eq('role', selectedRole);
		}

		const { data: invitations, error: invitationsError } = await invitationQuery.order('created_at', {
			ascending: false
		});

		if (invitationsError) {
			console.error('Error fetching filtered invitations:', invitationsError);
			throw error(500, 'Fehler beim Laden der Einladungsdaten');
		}

		// Transform ALL profiles for statistics calculation
		const allUsersForStats = (allProfiles || []).map((profile) => {
			// For now, mark users as active if they were created recently (within 30 days)
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const createdAt = profile.created_at ? new Date(profile.created_at) : new Date(0);
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

		// Transform the filtered data for display - combine users and invitations
		const filteredUsers = (profiles || []).map((profile) => {
			// For now, mark users as active if they were created recently (within 30 days)
			const now = new Date();
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const createdAt = profile.created_at ? new Date(profile.created_at) : new Date(0);
			const isActive = createdAt > thirtyDaysAgo;

			return {
				id: profile.id,
				full_name: profile.full_name,
				email: profile.email,
				role: profile.role,
				status: isActive ? 'active' : ('inactive' as const),
				createdAt: createdAt,
				lastLogin: createdAt, // Placeholder - use creation date as fallback
				emailConfirmed: true,
				type: 'user' as const
			};
		});

		// Transform invitations for display
		const filteredInvitations = (invitations || []).map((invitation) => {
			const createdAt = invitation.created_at ? new Date(invitation.created_at) : new Date(0);
			const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : new Date(0);
			const now = new Date();
			const isExpired = expiresAt < now;

			return {
				id: invitation.id,
				full_name: invitation.full_name,
				email: invitation.email,
				role: invitation.role,
				status: isExpired ? 'expired' : ('invited' as const),
				createdAt: createdAt,
				lastLogin: createdAt,
				emailConfirmed: false,
				type: 'invitation' as const,
				expiresAt: expiresAt
			};
		});

		// Combine users and invitations
		const allUsersAndInvitations = [...filteredUsers, ...filteredInvitations];

		// Apply status filter to the combined list if specified
		const finalUsers =
			selectedStatus === 'active' || selectedStatus === 'inactive'
				? allUsersAndInvitations.filter((user) => user.status === selectedStatus)
				: selectedStatus === 'invited'
				? allUsersAndInvitations.filter((user) => user.status === 'invited')
				: selectedStatus === 'expired'
				? allUsersAndInvitations.filter((user) => user.status === 'expired')
				: allUsersAndInvitations;

		// Sort by creation date (newest first)
		finalUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		// Transform invitations for statistics
		const allInvitationsForStats = (allInvitations || []).map((invitation) => {
			const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : new Date(0);
			const now = new Date();
			const isExpired = expiresAt < now;

			return {
				id: invitation.id,
				full_name: invitation.full_name,
				email: invitation.email,
				role: invitation.role,
				status: isExpired ? 'expired' : ('invited' as const),
				type: 'invitation' as const
			};
		});

		// Calculate statistics from ALL users and invitations (unfiltered)
		const stats = {
			total: allUsersForStats.length,
			active: allUsersForStats.filter((u) => u.status === 'active').length,
			administrators: allUsersForStats.filter((u) => u.role === 'Administrator').length,
			redakteure: allUsersForStats.filter((u) => u.role === 'Redakteur').length,
			invited: allInvitationsForStats.filter((i) => i.status === 'invited').length,
			expired: allInvitationsForStats.filter((i) => i.status === 'expired').length
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

	inviteUser: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Check if current user is admin
		const { data: currentUserProfile } = await locals.supabase
			.from('profiles')
			.select('role, full_name')
			.eq('id', user.id)
			.single();

		if (!currentUserProfile || currentUserProfile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const fullName = formData.get('fullName') as string;
		const role = formData.get('role') as string;

		if (!email || !fullName || !role) {
			return fail(400, { message: 'Alle Felder sind erforderlich' });
		}

		if (role !== 'Administrator' && role !== 'Redakteur') {
			return fail(400, { message: 'Ungültige Rolle' });
		}

		// Validate full name length (must be 2-100 characters per database constraint)
		if (fullName.length < 2 || fullName.length > 100) {
			return fail(400, { message: 'Name muss zwischen 2 und 100 Zeichen lang sein' });
		}

		// Check if user already exists
		const adminClient = createSupabaseAdminClient();
		const { data: existingUser } = await adminClient
			.from('profiles')
			.select('email')
			.eq('email', email)
			.single();

		if (existingUser) {
			return fail(400, { message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' });
		}

		try {
			// Create invitation
			const invitation = await createInvitation(
				adminClient,
				email,
				fullName,
				role as 'Administrator' | 'Redakteur',
				user.id
			);

			// Send invitation email
			const emailResult = await sendInvitationEmail({
				to: email,
				fullName,
				inviterName: currentUserProfile.full_name,
				role,
				token: invitation.token
			});

			if (!emailResult.success) {
				// Delete invitation if email failed
				await adminClient.from('invitations').delete().eq('id', invitation.id);
				return fail(500, { message: 'Fehler beim Senden der Einladungs-E-Mail' });
			}

			return { success: true, message: 'Einladung erfolgreich versendet' };
		} catch (error) {
			console.error('Unexpected error during invitation:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	}
};
