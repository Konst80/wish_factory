import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	// Temporarily disable Supabase for UI testing
	// event.locals.supabase = createSupabaseServerClientFromSvelteKit(event.cookies);

	event.locals.safeGetSession = async () => {
		return { session: null, user: null };
	};

	// Skip all auth logic for now
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};

export const handle: Handle = sequence(handleAuth, handleParaglide);
