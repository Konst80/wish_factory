<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

	// Temporarily disable auth for testing
	onMount(() => {
		console.log('Layout mounted');
	});
</script>

<svelte:head>
	<title>Wish Factory</title>
	<meta name="description" content="AI-powered wish generator and content management system" />
</svelte:head>

<main class="bg-base-100 min-h-screen">
	{@render children()}
</main>
