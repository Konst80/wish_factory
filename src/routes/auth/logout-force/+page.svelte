<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	onMount(() => {
		if (!browser) return;

		// Aggressive logout - clear everything immediately
		console.log('Force logout starting...');
		
		// Clear all storage
		try {
			localStorage.clear();
			sessionStorage.clear();
			console.log('Storage cleared');
		} catch (e) {
			console.log('Storage clear failed:', e);
		}

		// Clear all cookies by setting them to expire
		try {
			const cookies = document.cookie.split(";");
			for (let cookie of cookies) {
				const eqPos = cookie.indexOf("=");
				const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
			}
			console.log('Cookies cleared');
		} catch (e) {
			console.log('Cookie clear failed:', e);
		}

		// Force redirect
		setTimeout(() => {
			console.log('Redirecting to login...');
			window.location.href = '/auth/login';
		}, 1000);
	});
</script>

<svelte:head>
	<title>Force Logout - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body text-center">
			<h1 class="card-title mb-6 text-2xl font-bold">Force Logout</h1>
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">Lösche alle lokalen Daten...</p>
			<p class="text-sm text-gray-500 mt-2">Weiterleitung in wenigen Sekunden...</p>
		</div>
	</div>
</div>