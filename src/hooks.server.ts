import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
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

export const handle: Handle = sequence(handleAuth, handleParaglide);
