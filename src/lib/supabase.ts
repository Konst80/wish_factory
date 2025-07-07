import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/database.types';

export const createSupabaseLoadClient = (fetch: typeof globalThis.fetch) => {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		},
		cookies: {
			getAll: () => [],
			setAll: () => {}
		}
	});
};

export const createSupabaseServerClient = (cookies: {
	getAll: () => Array<{ name: string; value: string }>;
	setAll: (cookies: Array<{ name: string; value: string; options: object }>) => void;
}) => {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => cookies.setAll(cookiesToSet)
		}
	});
};

export const supabase = isBrowser()
	? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
	: null;
