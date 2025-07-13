<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { browser } from '$app/environment';

	let logoutStatus = $state('Abmelden läuft...');

	onMount(async () => {
		if (!browser) return;

		// Force redirect after maximum 5 seconds regardless of what happens
		const forceRedirectTimer = setTimeout(() => {
			console.log('Force redirect triggered');
			clearAllStorage();
			window.location.href = '/auth/login';
		}, 5000);

		try {
			logoutStatus = 'Lösche lokale Daten...';
			clearAllStorage();

			logoutStatus = 'Abmelden von Supabase...';
			if (supabase) {
				await supabase.auth.signOut({ scope: 'global' });
			}

			logoutStatus = 'Weiterleitung...';
			clearTimeout(forceRedirectTimer);

			// Force a complete page reload to clear all state
			window.location.href = '/auth/login';
		} catch (error) {
			console.error('Logout error:', error);
			logoutStatus = 'Fehler beim Abmelden - erzwinge Weiterleitung...';
			clearAllStorage();
			clearTimeout(forceRedirectTimer);
			window.location.href = '/auth/login';
		}
	});

	function clearAllStorage() {
		try {
			// Clear all possible storage locations
			localStorage.clear();
			sessionStorage.clear();

			// Clear specific Supabase keys if they exist
			const keysToRemove = [
				'supabase.auth.token',
				'sb-' + 'kgowrcgwzqfeiqitavdc' + '-auth-token',
				'sb-' + 'bnbzkfwowcqnecrdqdas' + '-auth-token'
			];

			keysToRemove.forEach((key) => {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			});
		} catch (e) {
			console.log('Storage clear failed:', e);
		}
	}
</script>

<svelte:head>
	<title>Abmelden - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body text-center">
			<h1 class="card-title mb-6 text-2xl font-bold">Abmelden</h1>
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">{logoutStatus}</p>

			<!-- Debug info -->
			<div class="mt-2 text-xs text-gray-500">
				Falls die Weiterleitung nicht funktioniert:
				<a href="/auth/login" class="link">Hier klicken</a>
			</div>
		</div>
	</div>
</div>
