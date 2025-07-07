import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createSupabaseServerClientFromSvelteKit } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';

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
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	const { session } = await event.locals.safeGetSession();

	if (event.url.pathname.startsWith('/auth')) {
		if (session) {
			throw redirect(303, '/dashboard');
		}
		return resolve(event);
	}

	if (event.url.pathname.startsWith('/dashboard')) {
		if (!session) {
			throw redirect(303, '/auth/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};

export const handle: Handle = sequence(handleAuth, handleParaglide);
