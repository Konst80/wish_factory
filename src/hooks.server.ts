import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createSupabaseServerClientFromSvelteKit } from '$lib/supabase';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClientFromSvelteKit(event.cookies);

	event.locals.safeGetSession = async () => {
		try {
			// Use getUser() for secure authentication
			const {
				data: { user },
				error
			} = await event.locals.supabase.auth.getUser();
			if (error) {
				console.error('Error getting user:', error);
				return { session: null, user: null };
			}

			// If we have a user, get the session for completeness
			const {
				data: { session }
			} = await event.locals.supabase.auth.getSession();

			return { session, user };
		} catch (err) {
			console.error('Error in safeGetSession:', err);
			return { session: null, user: null };
		}
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};

const handleInitialization: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);
	
	// Skip initialization check for API routes, setup page, and static assets
	if (url.pathname.startsWith('/api/') || 
		url.pathname.startsWith('/auth/setup-admin') ||
		url.pathname.startsWith('/_app/') ||
		url.pathname.startsWith('/favicon') ||
		url.pathname.includes('.')) {
		return resolve(event);
	}

	// Only check initialization on routes that require it
	const publicRoutes = ['/auth/login', '/auth/logout', '/auth/status'];
	const isPublicRoute = publicRoutes.includes(url.pathname);

	try {
		// Check if system needs initialization
		const { data: initData, error: initError } = await event.locals.supabase
			.from('system_initialization')
			.select('id')
			.limit(1);

		if (initError) {
			console.error('Error checking initialization status:', initError);
			// Continue on error to avoid breaking the app
			return resolve(event);
		}

		const isInitialized = initData && initData.length > 0;

		if (!isInitialized && !isPublicRoute) {
			// Check if any admin users exist as fallback
			const { data: adminData, error: adminError } = await event.locals.supabase
				.from('profiles')
				.select('id')
				.eq('role', 'Administrator')
				.limit(1);

			if (adminError) {
				console.error('Error checking admin users:', adminError);
				return resolve(event);
			}

			const hasAdminUsers = adminData && adminData.length > 0;

			// If no admins exist, redirect to setup
			if (!hasAdminUsers) {
				throw redirect(302, '/auth/setup-admin');
			}
		}

		return resolve(event);
	} catch (error) {
		// Check if it's a redirect response
		if (error instanceof Response && error.status >= 300 && error.status < 400) {
			throw error; // Re-throw redirect responses
		}
		
		// Check if it's a redirect error object
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error; // Re-throw redirect objects
		}
		
		console.error('Unexpected error in initialization check:', error);
		return resolve(event);
	}
};

export const handle: Handle = sequence(handleAuth, handleInitialization, handleParaglide);
