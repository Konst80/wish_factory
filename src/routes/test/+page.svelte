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

<div class="min-h-screen bg-base-100 p-8">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-8 text-4xl font-bold text-base-content">DaisyUI Theme Test</h1>

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
				<div class="rounded-lg bg-primary p-4 text-center text-primary-content">
					<div class="font-bold">Primary</div>
				</div>
				<div class="rounded-lg bg-secondary p-4 text-center text-secondary-content">
					<div class="font-bold">Secondary</div>
				</div>
				<div class="rounded-lg bg-accent p-4 text-center text-accent-content">
					<div class="font-bold">Accent</div>
				</div>
				<div class="rounded-lg bg-neutral p-4 text-center text-neutral-content">
					<div class="font-bold">Neutral</div>
				</div>
				<div class="rounded-lg border bg-base-100 p-4 text-center text-base-content">
					<div class="font-bold">Base 100</div>
				</div>
				<div class="rounded-lg bg-base-200 p-4 text-center text-base-content">
					<div class="font-bold">Base 200</div>
				</div>
				<div class="rounded-lg bg-base-300 p-4 text-center text-base-content">
					<div class="font-bold">Base 300</div>
				</div>
				<div class="rounded-lg bg-info p-4 text-center text-info-content">
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
