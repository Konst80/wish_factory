import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase-admin';

export const GET: RequestHandler = async () => {
	try {
		const supabase = createSupabaseAdminClient();
		
		// Simple test query to check connection
		const { data, error } = await supabase
			.from('api_keys')
			.select('count(*)')
			.limit(1);

		if (error) {
			return json({
				status: 'error',
				message: 'Database connection failed',
				error: error.message,
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		return json({
			status: 'success',
			message: 'Database connection successful',
			timestamp: new Date().toISOString(),
			env: {
				supabaseUrl: process.env.PUBLIC_SUPABASE_URL ? 'set' : 'missing',
				serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
				nodeEnv: process.env.NODE_ENV || 'not set'
			}
		});
	} catch (error) {
		return json({
			status: 'error',
			message: 'Connection test failed',
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};