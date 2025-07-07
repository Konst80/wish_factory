import { createSupabaseLoadClient } from '../supabase';

export function testSupabaseConnection() {
	try {
		const client = createSupabaseLoadClient(fetch);
		console.log('✅ Supabase client created successfully');
		return { success: true, client };
	} catch (error) {
		console.error('❌ Supabase client creation failed:', error);
		return { success: false, error };
	}
}
