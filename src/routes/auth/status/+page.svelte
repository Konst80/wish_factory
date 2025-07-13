<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { browser } from '$app/environment';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let authStatus = $state('Lade...');
	let storageInfo = $state('');
	let userInfo = $state<{ email?: string; id?: string } | null>(null);
	let envInfo = $state('');
	let dbConnectionStatus = $state('Nicht getestet');
	let deploymentInfo = $state('');
	let systemInfo = $state('');
	let apiStatus = $state('');

	onMount(async () => {
		if (!browser) {
			authStatus = 'Nicht im Browser';
			return;
		}

		// Detect environment and deployment info
		const isLocalhost = window.location.hostname === 'localhost';
		const isDev = PUBLIC_SUPABASE_URL?.includes('kgowrcgwzqfeiqitavdc');
		const isProd = PUBLIC_SUPABASE_URL?.includes('bnbzkfwowcqnecrdqdas');

		deploymentInfo = `${isLocalhost ? '🏠 Localhost' : '🌐 Deployed'} | ${isDev ? '🔧 Dev-DB' : isProd ? '🚀 Prod-DB' : '❓ Unknown-DB'}`;

		// System info
		systemInfo = `${navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'} | ${new Date().toLocaleString('de-DE')}`;

		// Environment variables check
		envInfo = `URL: ${PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : '❌ FEHLT'}, Key: ${PUBLIC_SUPABASE_ANON_KEY ? '✅ Vorhanden' : '❌ FEHLT'}`;

		console.log('System Check:', {
			client: !!supabase,
			browser,
			url: PUBLIC_SUPABASE_URL,
			isDev,
			isProd,
			isLocalhost
		});

		try {
			if (!supabase) {
				authStatus = 'Supabase Client nicht initialisiert';
				return;
			}

			// Check current auth status with timeout
			authStatus = 'Prüfe Session...';

			const sessionPromise = supabase.auth.getSession();
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Session check timeout')), 5000)
			);

			const result = (await Promise.race([sessionPromise, timeoutPromise])) as {
				data: { session: unknown };
				error?: { message: string };
			};
			const {
				data: { session },
				error: sessionError
			} = result;

			if (sessionError) {
				authStatus = 'Session Fehler: ' + sessionError.message;
				return;
			}

			authStatus = 'Prüfe User...';

			const userPromise = supabase.auth.getUser();
			const userTimeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('User check timeout')), 5000)
			);

			const userResult = (await Promise.race([userPromise, userTimeoutPromise])) as {
				data: { user: { email?: string; id?: string } | null };
				error?: { message: string };
			};
			const {
				data: { user },
				error: userError
			} = userResult;

			if (userError) {
				authStatus = 'User Fehler: ' + userError.message;
				return;
			}

			userInfo = user;
			authStatus = session ? `Eingeloggt (Session: ${!!session})` : 'Nicht eingeloggt';

			// Check local storage
			const storageKeys = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
					storageKeys.push(key);
				}
			}
			storageInfo = storageKeys.length > 0 ? storageKeys.join(', ') : 'Keine Auth-Keys im Storage';

			// Test database connection
			await testDatabaseConnection();

			// Test API endpoints
			await testApiEndpoints();
		} catch (error) {
			console.error('Auth status error:', error);
			authStatus = 'Fehler: ' + (error instanceof Error ? error.message : 'Unknown error');
		}
	});

	async function testDatabaseConnection() {
		try {
			dbConnectionStatus = 'Teste Verbindung...';

			if (!supabase) {
				dbConnectionStatus = '❌ Kein Supabase Client';
				return;
			}

			const dbResult = (await Promise.race([
				supabase.from('profiles').select('count').limit(1),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
			])) as { data: unknown; error?: { message: string } };
			const { error } = dbResult;

			if (error) {
				dbConnectionStatus = `❌ DB Fehler: ${error.message}`;
			} else {
				dbConnectionStatus = '✅ Datenbank erreichbar';
			}
		} catch (error) {
			dbConnectionStatus = `❌ Connection Timeout: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	async function testApiEndpoints() {
		try {
			apiStatus = 'Teste APIs...';

			const tests = [];

			// Test metadata endpoint
			tests.push(
				fetch('/api/public/wishes/metadata')
					.then((res) => (res.ok ? '✅ Metadata API' : `❌ Metadata API (${res.status})`))
					.catch(() => '❌ Metadata API (Fehler)')
			);

			// Test env check endpoint
			tests.push(
				fetch('/api/test/env-check')
					.then((res) => (res.ok ? '✅ Env Check API' : `❌ Env Check API (${res.status})`))
					.catch(() => '❌ Env Check API (Fehler)')
			);

			const results = await Promise.allSettled(
				tests.map((test) =>
					Promise.race([
						test,
						new Promise((resolve) => setTimeout(() => resolve('⏱️ Timeout'), 5000))
					])
				)
			);

			apiStatus = results
				.map((result) => (result.status === 'fulfilled' ? result.value : '❌ Test fehlgeschlagen'))
				.join(' | ');
		} catch (error) {
			apiStatus = `❌ API Tests fehlgeschlagen: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	async function forceLogout() {
		if (!browser) return;

		// Clear everything
		localStorage.clear();
		sessionStorage.clear();

		if (supabase) {
			await supabase.auth.signOut({ scope: 'global' });
		}

		window.location.href = '/auth/login';
	}
</script>

<svelte:head>
	<title>System Status - Wish Factory</title>
</svelte:head>

<div class="container mx-auto p-8">
	<div class="space-y-6">
		<!-- Main Status Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h1 class="card-title mb-6 text-3xl">🔍 System Status Dashboard</h1>

				<!-- Deployment Info -->
				<div class="alert alert-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<div class="font-bold">Deployment & Umgebung</div>
						<div class="text-sm">{deploymentInfo} | {systemInfo}</div>
					</div>
				</div>

				<!-- Status Grid -->
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Authentication Status -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h2 class="card-title text-lg">🔐 Authentifizierung</h2>
							<div class="space-y-2">
								<div><strong>Status:</strong> {authStatus}</div>
								{#if userInfo}
									<div><strong>User:</strong> {userInfo.email}</div>
									<div><strong>ID:</strong> {userInfo.id}</div>
								{/if}
								<div><strong>Storage:</strong> {storageInfo || 'Leer'}</div>
							</div>
						</div>
					</div>

					<!-- Environment Status -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h2 class="card-title text-lg">⚙️ Umgebungsvariablen</h2>
							<div class="space-y-2">
								<div>{envInfo}</div>
							</div>
						</div>
					</div>

					<!-- Database Status -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h2 class="card-title text-lg">🗄️ Datenbank</h2>
							<div class="space-y-2">
								<div><strong>Verbindung:</strong> {dbConnectionStatus}</div>
							</div>
						</div>
					</div>

					<!-- API Status -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h2 class="card-title text-lg">🔌 API Endpoints</h2>
							<div class="space-y-2">
								<div class="text-sm">{apiStatus}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="divider">Aktionen</div>
				<div class="flex flex-wrap gap-4">
					<a href="/auth/login" class="btn btn-primary">🔑 Login</a>
					<a href="/dashboard" class="btn btn-secondary">📊 Dashboard</a>
					<a href="/api/test/env-check" class="btn btn-accent" target="_blank">🔍 Env Check API</a>
					<button class="btn btn-error" onclick={forceLogout}>🚪 Force Logout</button>
					<button class="btn btn-info" onclick={() => window.location.reload()}>🔄 Neu laden</button
					>
				</div>
			</div>
		</div>

		<!-- Debug Info (nur für localhost) -->
		{#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
			<div class="card bg-base-300">
				<div class="card-body">
					<h2 class="card-title text-lg">🐛 Debug Info (nur lokal)</h2>
					<div class="text-xs">
						<div>
							<strong>URL:</strong>
							{typeof window !== 'undefined' ? window.location.href : 'N/A'}
						</div>
						<div>
							<strong>User Agent:</strong>
							{typeof navigator !== 'undefined'
								? navigator.userAgent.substring(0, 100) + '...'
								: 'N/A'}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
