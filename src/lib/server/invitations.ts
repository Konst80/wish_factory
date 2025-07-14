import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export function generateInviteToken(): string {
	return randomBytes(32).toString('base64url');
}

export async function createInvitation(
	supabase: SupabaseClient,
	email: string,
	fullName: string,
	role: 'Administrator' | 'Redakteur',
	createdBy: string
) {
	const token = generateInviteToken();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7); // Invitation expires in 7 days

	const { data, error } = await supabase
		.from('invitations')
		.insert({
			email,
			full_name: fullName,
			role,
			token,
			created_by: createdBy,
			expires_at: expiresAt.toISOString()
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function getInvitationByToken(supabase: SupabaseClient, token: string) {
	const { data, error } = await supabase
		.from('invitations')
		.select('*')
		.eq('token', token)
		.is('accepted_at', null)
		.gte('expires_at', new Date().toISOString())
		.single();

	if (error) {
		return null;
	}

	return data;
}

export async function markInvitationAsAccepted(supabase: SupabaseClient, token: string) {
	const { error } = await supabase
		.from('invitations')
		.update({ accepted_at: new Date().toISOString() })
		.eq('token', token);

	if (error) {
		throw error;
	}
}