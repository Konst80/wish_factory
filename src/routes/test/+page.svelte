<script lang="ts">
	import { onMount } from 'svelte';

	const themes = [
		'light',
		'dark',
		'corporate',
		'business',
		'winter',
		'dracula',
		'cyberpunk',
		'valentine',
		'aqua'
	];

	let currentTheme = $state('light');

	onMount(() => {
		// Set initial theme
		document.documentElement.setAttribute('data-theme', currentTheme);
	});

	function setTheme(theme: string) {
		currentTheme = theme;
		document.documentElement.setAttribute('data-theme', theme);

		// Debug logging
		console.log('Theme changed to:', theme);
		console.log('data-theme attribute:', document.documentElement.getAttribute('data-theme'));

		// Check CSS variables
		const computedStyle = getComputedStyle(document.documentElement);
		console.log('Primary color (--p):', computedStyle.getPropertyValue('--p'));
		console.log('Base-100 (--b1):', computedStyle.getPropertyValue('--b1'));
		console.log('Base-content (--bc):', computedStyle.getPropertyValue('--bc'));
	}
</script>

<svelte:head>
	<title>Theme Test - Wish Factory</title>
</svelte:head>

<div class="bg-base-100 min-h-screen p-8">
	<div class="mx-auto max-w-4xl">
		<h1 class="text-base-content mb-8 text-4xl font-bold">DaisyUI Theme Test</h1>

		<div class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Current Theme: {currentTheme}</h2>
			<div class="flex flex-wrap gap-2">
				{#each themes as theme}
					<button
						class="btn {theme === currentTheme ? 'btn-primary' : 'btn-outline'}"
						onclick={() => setTheme(theme)}
					>
						{theme}
					</button>
				{/each}
			</div>
		</div>

		<!-- Test Elements -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-primary">Primary Card</h3>
					<p class="text-base-content">This card shows primary colors</p>
					<div class="card-actions justify-end">
						<button class="btn btn-primary">Primary</button>
						<button class="btn btn-secondary">Secondary</button>
					</div>
				</div>
			</div>

			<div class="card bg-base-300 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-secondary">Secondary Card</h3>
					<p class="text-base-content">This card shows secondary colors</p>
					<div class="card-actions justify-end">
						<button class="btn btn-accent">Accent</button>
						<button class="btn btn-neutral">Neutral</button>
					</div>
				</div>
			</div>

			<div class="card bg-primary text-primary-content shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Primary Content</h3>
					<p>White text on primary background</p>
					<div class="card-actions justify-end">
						<button class="btn btn-ghost">Ghost</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Color Palette Display -->
		<div class="mt-8">
			<h2 class="mb-4 text-2xl font-semibold">Color Palette</h2>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
				<div class="bg-primary text-primary-content rounded-lg p-4 text-center">
					<div class="font-bold">Primary</div>
				</div>
				<div class="bg-secondary text-secondary-content rounded-lg p-4 text-center">
					<div class="font-bold">Secondary</div>
				</div>
				<div class="bg-accent text-accent-content rounded-lg p-4 text-center">
					<div class="font-bold">Accent</div>
				</div>
				<div class="bg-neutral text-neutral-content rounded-lg p-4 text-center">
					<div class="font-bold">Neutral</div>
				</div>
				<div class="bg-base-100 text-base-content rounded-lg border p-4 text-center">
					<div class="font-bold">Base 100</div>
				</div>
				<div class="bg-base-200 text-base-content rounded-lg p-4 text-center">
					<div class="font-bold">Base 200</div>
				</div>
				<div class="bg-base-300 text-base-content rounded-lg p-4 text-center">
					<div class="font-bold">Base 300</div>
				</div>
				<div class="bg-info text-info-content rounded-lg p-4 text-center">
					<div class="font-bold">Info</div>
				</div>
			</div>
		</div>

		<!-- Debug Info -->
		<div class="mt-8">
			<h2 class="mb-4 text-2xl font-semibold">Debug Info</h2>
			<div class="mockup-code">
				<pre><code>Current data-theme: {currentTheme}</code></pre>
				<pre><code>Check browser console for CSS variable values</code></pre>
			</div>
		</div>
	</div>
</div>
