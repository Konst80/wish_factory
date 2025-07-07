<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	onMount(async () => {
		await auth.signOut();
		goto('/auth/login');
	});
</script>

<svelte:head>
	<title>Abmelden - Wish Factory</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body text-center">
			<h1 class="card-title mb-6 text-2xl font-bold">Abmelden</h1>
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">Sie werden abgemeldet...</p>

			<!-- Hidden form removed since we're using client-side logout -->
		</div>
	</div>
</div>
