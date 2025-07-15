<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to dashboard if user tries to access login
		// This is a placeholder - in a real app, you'd have proper login functionality
		goto('/dashboard');
	});
</script>

<svelte:head>
	<title>Login - Wish Factory</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body">
			<h1 class="card-title text-2xl">Login</h1>
			<p class="text-base-content/70">Redirecting to dashboard...</p>
			<div class="loading loading-spinner loading-lg text-primary mx-auto"></div>
		</div>
	</div>
</div>
