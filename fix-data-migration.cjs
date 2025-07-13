#!/usr/bin/env node

const fs = require('fs').promises;

// Development Supabase configuration
const DEV_CONFIG = {
	url: 'https://kgowrcgwzqfeiqitavdc.supabase.co',
	anonKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnb3dyY2d3enFmZWlxaXRhdmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTg4NTQsImV4cCI6MjA2NzQ3NDg1NH0.hWV75O7HKV440EF9UgFXJFCf4xvxRNNXssvh6YnG5Cc',
	serviceKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnb3dyY2d3enFmZWlxaXRhdmRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg5ODg1NCwiZXhwIjoyMDY3NDc0ODU0fQ.e81n9hRlTsx6inJdDUSpOTycjHPknJTWp4__QAeqvfs'
};

// Production Supabase configuration
const PROD_CONFIG = {
	url: 'https://bnbzkfwowcqnecrdqdas.supabase.co',
	anonKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnprZndvd2NxbmVjcmRxZGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTMwMDQsImV4cCI6MjA2Nzk4OTAwNH0.8qEaXz0PJgsszmosACVuKjAJi167C11Y5_mqDK2B_PA',
	serviceKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnprZndvd2NxbmVjcmRxZGFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMzAwNCwiZXhwIjoyMDY3OTg5MDA0fQ.n1nkC69HIckc8Est6G3jgRiAkNrkblMvRRvOfpnnCAM'
};

// Tables to migrate in the correct order (respecting foreign key dependencies)
const TABLES = ['profiles', 'user_settings', 'wishes', 'released_wishes', 'api_keys'];

async function fetchFromSupabase(config, table) {
	const response = await fetch(`${config.url}/rest/v1/${table}?select=*`, {
		headers: {
			apikey: config.serviceKey,
			Authorization: `Bearer ${config.serviceKey}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ${table}: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

async function insertToSupabase(config, table, data) {
	if (data.length === 0) {
		console.log(`🔍 No data to migrate for table: ${table}`);
		return;
	}

	const response = await fetch(`${config.url}/rest/v1/${table}`, {
		method: 'POST',
		headers: {
			apikey: config.serviceKey,
			Authorization: `Bearer ${config.serviceKey}`,
			'Content-Type': 'application/json',
			Prefer: 'return=minimal'
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to insert ${table}: ${response.status} ${response.statusText} - ${errorText}`
		);
	}

	console.log(`✅ Migrated ${data.length} records to ${table}`);
}

function cleanData(tableName, data) {
	if (tableName === 'profiles') {
		// Fix role mapping and case sensitivity
		return data.map((record) => {
			let role = record.role;

			// Map German/different roles to valid schema values
			if (role === 'Administrator' || role === 'administrator') {
				role = 'administrator';
			} else if (
				role === 'redakteur' ||
				role === 'Redakteur' ||
				role === 'editor' ||
				role === 'Editor'
			) {
				role = 'editor';
			} else {
				role = 'editor'; // Default to editor for unknown roles
			}

			return {
				...record,
				role: role
			};
		});
	}

	return data;
}

async function migrateTable(tableName) {
	try {
		console.log(`📊 Migrating table: ${tableName}`);

		// Fetch data from development
		const rawData = await fetchFromSupabase(DEV_CONFIG, tableName);
		console.log(`📋 Found ${rawData.length} records in development ${tableName}`);

		if (rawData.length > 0) {
			// Clean and fix data before migration
			const cleanedData = cleanData(tableName, rawData);

			// Insert data to production
			await insertToSupabase(PROD_CONFIG, tableName, cleanedData);
		}
	} catch (error) {
		console.error(`❌ Error migrating ${tableName}:`, error.message);
		throw error;
	}
}

async function main() {
	console.log('🚀 Starting Supabase data migration...');
	console.log(`📤 Source: ${DEV_CONFIG.url}`);
	console.log(`📥 Target: ${PROD_CONFIG.url}`);
	console.log('');

	try {
		// Test connections
		console.log('🔌 Testing connections...');
		await fetchFromSupabase(DEV_CONFIG, 'profiles');
		await fetchFromSupabase(PROD_CONFIG, 'profiles');
		console.log('✅ Both Supabase instances are accessible');
		console.log('');

		// Migrate each table
		for (const table of TABLES) {
			await migrateTable(table);
		}

		console.log('');
		console.log('🎉 Data migration completed successfully!');
	} catch (error) {
		console.error('💥 Migration failed:', error.message);
		process.exit(1);
	}
}

// Run the migration
main();
