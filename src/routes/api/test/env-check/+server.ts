import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		return json({
			status: 'success',
			message: 'Environment check successful',
			timestamp: new Date().toISOString(),
			environment: {
				nodeEnv: process.env.NODE_ENV || 'not set',
				supabaseUrl: process.env.PUBLIC_SUPABASE_URL ? 
					`${process.env.PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'not set',
				anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY ? 
					`${process.env.PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'not set',
				serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
					`${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'not set',
				openaiKey: process.env.OPENAI_API_KEY ? 
					process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'not set',
				openrouterKey: process.env.OPENROUTER_API_KEY ? 
					process.env.OPENROUTER_API_KEY.substring(0, 20) + '...' : 'not set'
			}
		});
	} catch (error) {
		return json({
			status: 'error',
			message: 'Environment check failed',
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};