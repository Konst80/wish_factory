import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	// Handle email confirmation codes from Supabase
	const code = url.searchParams.get('code');
	
	if (code) {
		try {
			// Exchange the code for a session
			const { error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (error) {
				console.error('Email confirmation error:', error);
				// Redirect to login with error message
				throw redirect(303, '/auth/login?error=confirmation_failed');
			}
			
			// Success - redirect to dashboard
			throw redirect(303, '/dashboard?message=email_confirmed');
		} catch (err) {
			console.error('Code exchange error:', err);
			throw redirect(303, '/auth/login?error=invalid_code');
		}
	}
	
	// No code, just redirect to dashboard (will handle auth there)
	throw redirect(303, '/dashboard');
};