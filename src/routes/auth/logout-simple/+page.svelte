<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	onMount(() => {
		if (browser) {
			// Clear any local storage
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch (e) {
				console.log('Storage clear failed:', e);
			}
			
			// Immediate redirect
			window.location.href = '/auth/login';
		}
	});
</script>

<svelte:head>
	<title>Abmelden - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body text-center">
			<h1 class="card-title mb-6 text-2xl font-bold">Abmelden</h1>
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">Abmeldung läuft...</p>
		</div>
	</div>
</div>