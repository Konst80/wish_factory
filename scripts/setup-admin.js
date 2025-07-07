#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing required environment variables');
	console.error('Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
	try {
		console.log('Creating admin user...');

		// Create user with email and password
		const { data: authData, error: authError } = await supabase.auth.admin.createUser({
			email: 'admin@example.com',
			password: 'Konst',
			email_confirm: true
		});

		if (authError) {
			console.error('Error creating auth user:', authError);
			return;
		}

		console.log('Auth user created:', authData.user.id);

		// Create user profile
		const { error: profileError } = await supabase.from('profiles').insert({
			id: authData.user.id,
			email: 'admin@example.com',
			full_name: 'Administrator',
			role: 'Administrator'
		});

		if (profileError) {
			console.error('Error creating profile:', profileError);
			return;
		}

		console.log('✅ Admin user created successfully!');
		console.log('Email: admin@example.com');
		console.log('Password: Konst');
		console.log('Role: Administrator');
	} catch (error) {
		console.error('Error:', error);
	}
}

createAdminUser();
