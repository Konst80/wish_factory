import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { Database } from '../types/supabase';

// Admin client for server-side admin operations (user creation, deletion, etc.)
export const createSupabaseAdminClient = () => {
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	
	if (!serviceRoleKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
	}

	return createServerClient<Database>(PUBLIC_SUPABASE_URL, serviceRoleKey, {
		cookies: {
			getAll: () => [],
			setAll: () => {}
		}
	});
};
