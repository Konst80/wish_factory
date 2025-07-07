<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/stores/auth';

	onMount(() => {
		if ($isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Welcome - Wish Factory</title>
</svelte:head>

<div class="from-primary/10 to-secondary/10 min-h-screen bg-gradient-to-br">
	<div class="container mx-auto px-4 py-16">
		<div class="mb-16 text-center">
			<h1 class="text-primary mb-4 text-6xl font-bold">Wish Factory</h1>
			<p class="text-base-content/80 mb-8 text-xl">
				AI-powered wish generator and content management system
			</p>
			<div class="flex justify-center gap-4">
				<a href="/auth/login" class="btn btn-primary btn-lg"> Anmelden </a>
				<a href="/auth/register" class="btn btn-outline btn-lg"> Registrieren </a>
			</div>
		</div>

		<div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div class="mb-4 text-4xl">🎯</div>
					<h2 class="card-title justify-center">Smart Wishes</h2>
					<p>Create personalized wishes with AI assistance for any occasion</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div class="mb-4 text-4xl">⚡</div>
					<h2 class="card-title justify-center">Workflow</h2>
					<p>Manage approval workflows with role-based permissions</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div class="mb-4 text-4xl">🌐</div>
					<h2 class="card-title justify-center">Multi-Language</h2>
					<p>Support for German and English with localized content</p>
				</div>
			</div>
		</div>

		<div class="mt-16 text-center">
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block h-8 w-8 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							></path>
						</svg>
					</div>
					<div class="stat-title">Wishes Created</div>
					<div class="stat-value text-primary">1,200+</div>
				</div>

				<div class="stat">
					<div class="stat-figure text-secondary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block h-8 w-8 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							></path>
						</svg>
					</div>
					<div class="stat-title">Happy Users</div>
					<div class="stat-value text-secondary">98%</div>
				</div>
			</div>
		</div>
	</div>
</div>
