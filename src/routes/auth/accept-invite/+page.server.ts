import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getInvitationByToken, markInvitationAsAccepted } from '$lib/server/invitations';
import { createSupabaseAdminClient } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ url, locals }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return {
			error: 'Kein Einladungstoken angegeben.'
		};
	}

	// Use admin client to read invitation (anonymous access)
	const adminClient = createSupabaseAdminClient();
	const invitation = await getInvitationByToken(adminClient, token);

	if (!invitation) {
		return {
			error: 'Diese Einladung ist ungültig oder abgelaufen.'
		};
	}

	return {
		invitation: {
			email: invitation.email,
			full_name: invitation.full_name,
			role: invitation.role,
			token: invitation.token
		}
	};
};

export const actions: Actions = {
	acceptInvite: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token || !password || !confirmPassword) {
			return fail(400, { error: 'Alle Felder sind erforderlich' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwörter stimmen nicht überein' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Passwort muss mindestens 6 Zeichen lang sein' });
		}

		const adminClient = createSupabaseAdminClient();

		// Get invitation details
		const invitation = await getInvitationByToken(adminClient, token);
		if (!invitation) {
			return fail(400, { error: 'Diese Einladung ist ungültig oder abgelaufen' });
		}

		try {
			// Create the user account
			const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
				email: invitation.email,
				password,
				email_confirm: true,
				user_metadata: {
					full_name: invitation.full_name
				}
			});

			if (createError) {
				console.error('Error creating user:', createError);
				return fail(500, { error: 'Fehler beim Erstellen des Accounts' });
			}

			if (!newUser.user) {
				return fail(500, { error: 'Account konnte nicht erstellt werden' });
			}

			// Wait for database triggers
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Check if profile was created by trigger
			const { data: existingProfile } = await adminClient
				.from('profiles')
				.select('id')
				.eq('id', newUser.user.id)
				.single();

			if (!existingProfile) {
				// Create profile manually if trigger didn't
				const { error: profileError } = await adminClient.from('profiles').insert({
					id: newUser.user.id,
					email: invitation.email,
					full_name: invitation.full_name,
					role: invitation.role,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				});

				if (profileError) {
					console.error('Error creating user profile:', profileError);
					// Clean up - delete the auth user
					await adminClient.auth.admin.deleteUser(newUser.user.id);
					return fail(500, { error: 'Fehler beim Erstellen des Profils' });
				}
			} else {
				// Update profile with correct role
				const { error: updateError } = await adminClient
					.from('profiles')
					.update({
						full_name: invitation.full_name,
						role: invitation.role,
						updated_at: new Date().toISOString()
					})
					.eq('id', newUser.user.id);

				if (updateError) {
					console.error('Error updating user profile:', updateError);
					return fail(500, { error: 'Fehler beim Aktualisieren des Profils' });
				}
			}

			// Mark invitation as accepted
			await markInvitationAsAccepted(adminClient, token);

			// Sign in the user automatically
			const { error: signInError } = await adminClient.auth.admin.updateUserById(
				newUser.user.id,
				{ email_confirm: true }
			);

			if (signInError) {
				console.error('Error confirming user email:', signInError);
			}

			// Redirect to login page with success message
			throw redirect(303, '/auth/login?registered=true');
		} catch (error) {
			if (error instanceof Response) {
				throw error;
			}
			console.error('Unexpected error during invitation acceptance:', error);
			return fail(500, { error: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	}
};