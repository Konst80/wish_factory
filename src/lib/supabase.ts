import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/supabase';

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

interface SvelteKitCookies {
	getAll(): Array<{ name: string; value: string }>;
	set(name: string, value: string, options: Record<string, unknown> & { path: string }): void;
}

export const createSupabaseServerClientFromSvelteKit = (cookies: SvelteKitCookies) => {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
};

export const supabase = isBrowser()
	? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
	: null;
