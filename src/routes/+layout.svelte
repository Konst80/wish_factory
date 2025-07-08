<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// Apply user's saved theme on mount and handle theme changes
	onMount(() => {
		console.log('Layout mounted');

		// Apply the user's theme from database
		if (data.userTheme) {
			document.documentElement.setAttribute('data-theme', data.userTheme);
			console.log('Applied theme from database:', data.userTheme);
		}

		// Listen for theme change events from settings page
		const handleThemeChange = (event: CustomEvent) => {
			const newTheme = event.detail.theme;
			document.documentElement.setAttribute('data-theme', newTheme);
			console.log('Theme updated via event:', newTheme);
		};

		// Add global event listener for theme changes
		if (browser) {
			window.addEventListener('themeChanged', handleThemeChange as EventListener);

			return () => {
				window.removeEventListener('themeChanged', handleThemeChange as EventListener);
			};
		}
	});
</script>

<svelte:head>
	<title>Wish Factory</title>
	<meta name="description" content="AI-powered wish generator and content management system" />
</svelte:head>

<main class="bg-base-100 min-h-screen">
	{@render children()}
</main>
