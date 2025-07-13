<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	onMount(async () => {
		try {
			await auth.signOut();
			// Wait a bit for the auth state to clear
			setTimeout(() => {
				goto('/auth/login');
			}, 500);
		} catch (error) {
			console.error('Logout error:', error);
			// Force redirect even if logout fails
			goto('/auth/login');
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
			<p class="mt-4">Sie werden abgemeldet...</p>

			<!-- Hidden form removed since we're using client-side logout -->
		</div>
	</div>
</div>
