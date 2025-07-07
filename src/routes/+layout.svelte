<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { isAuthLoading } from '$lib/stores/auth';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		auth.initialize();
	});
</script>

<svelte:head>
	<title>Wish Factory</title>
	<meta name="description" content="AI-powered wish generator and content management system" />
</svelte:head>

<main class="bg-base-100 min-h-screen">
	{#if $isAuthLoading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="loading loading-spinner loading-lg"></div>
		</div>
	{:else}
		{@render children()}
	{/if}
</main>
