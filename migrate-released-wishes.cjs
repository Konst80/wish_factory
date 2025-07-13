#!/usr/bin/env node

// Migration script for public/released data only (not user-specific data)
const DEV_CONFIG = {
	url: 'https://kgowrcgwzqfeiqitavdc.supabase.co',
	serviceKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnb3dyY2d3enFmZWlxaXRhdmRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg5ODg1NCwiZXhwIjoyMDY3NDc0ODU0fQ.e81n9hRlTsx6inJdDUSpOTycjHPknJTWp4__QAeqvfs'
};

const PROD_CONFIG = {
	url: 'https://bnbzkfwowcqnecrdqdas.supabase.co',
	serviceKey:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnprZndvd2NxbmVjcmRxZGFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMzAwNCwiZXhwIjoyMDY3OTg5MDA0fQ.n1nkC69HIckc8Est6G3jgRiAkNrkblMvRRvOfpnnCAM'
};

// Only migrate public/released data (no user-specific data)
const TABLES = [
	'released_wishes' // Only public wishes that don't depend on users
];

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

	// Remove user references for released wishes
	const cleanedData = data.map((record) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { released_by, ...rest } = record;
		return rest; // Remove released_by since users don't exist in production
	});

	const response = await fetch(`${config.url}/rest/v1/${table}`, {
		method: 'POST',
		headers: {
			apikey: config.serviceKey,
			Authorization: `Bearer ${config.serviceKey}`,
			'Content-Type': 'application/json',
			Prefer: 'return=minimal'
		},
		body: JSON.stringify(cleanedData)
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to insert ${table}: ${response.status} ${response.statusText} - ${errorText}`
		);
	}

	console.log(`✅ Migrated ${cleanedData.length} records to ${table}`);
}

async function migrateTable(tableName) {
	try {
		console.log(`📊 Migrating table: ${tableName}`);

		const data = await fetchFromSupabase(DEV_CONFIG, tableName);
		console.log(`📋 Found ${data.length} records in development ${tableName}`);

		if (data.length > 0) {
			await insertToSupabase(PROD_CONFIG, tableName, data);
		}
	} catch (error) {
		console.error(`❌ Error migrating ${tableName}:`, error.message);
		throw error;
	}
}

async function main() {
	console.log('🚀 Starting public data migration...');
	console.log(`📤 Source: ${DEV_CONFIG.url}`);
	console.log(`📥 Target: ${PROD_CONFIG.url}`);
	console.log('');
	console.log('ℹ️  Note: Only migrating public/released data');
	console.log(
		'ℹ️  User-specific data (profiles, wishes, settings) will be created when users register'
	);
	console.log('');

	try {
		// Test connections
		console.log('🔌 Testing connections...');
		await fetchFromSupabase(DEV_CONFIG, 'released_wishes');
		await fetchFromSupabase(PROD_CONFIG, 'released_wishes');
		console.log('✅ Both Supabase instances are accessible');
		console.log('');

		// Migrate public tables only
		for (const table of TABLES) {
			await migrateTable(table);
		}

		console.log('');
		console.log('🎉 Public data migration completed successfully!');
		console.log('');
		console.log('📋 Summary:');
		console.log('✅ Database schema created');
		console.log('✅ Public/released wishes migrated');
		console.log('ℹ️  Users will need to register new accounts');
		console.log('ℹ️  User-specific data will be created on first login');
	} catch (error) {
		console.error('💥 Migration failed:', error.message);
		process.exit(1);
	}
}

main();
