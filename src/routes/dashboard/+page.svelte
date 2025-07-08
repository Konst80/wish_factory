<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Theme-System - now uses database theme as source of truth
	let currentTheme = $state(data.userTheme || 'light');
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

	// Initialize theme from layout data and listen for changes
	onMount(() => {
		// Set initial theme from database
		if (data.userTheme) {
			currentTheme = data.userTheme;
		}

		// Listen for theme change events from settings page
		const handleThemeChange = (event: CustomEvent) => {
			const newTheme = event.detail.theme;
			currentTheme = newTheme;
			console.log('Dashboard: Theme updated via event:', newTheme);
		};

		// Add global event listener for theme changes
		window.addEventListener('themeChanged', handleThemeChange as EventListener);

		return () => {
			window.removeEventListener('themeChanged', handleThemeChange as EventListener);
		};
	});

	// Update theme and save to database via form submission
	const setTheme = async (theme: string) => {
		currentTheme = theme;

		// Apply theme immediately
		document.documentElement.setAttribute('data-theme', theme);

		// Update database by submitting to settings endpoint
		try {
			const formData = new FormData();
			formData.append('theme', theme);

			const response = await fetch('/dashboard/settings?/updatePreferences', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				console.log('Theme saved to database:', theme);
				// Dispatch event to notify other components
				window.dispatchEvent(
					new CustomEvent('themeChanged', {
						detail: { theme }
					})
				);
			} else {
				console.error('Failed to save theme to database');
			}
		} catch (error) {
			console.error('Error saving theme:', error);
		}
	};

	// Notification state
	let showWelcomeAlert = $state(true);

	// Helper function to format relative time
	function formatRelativeTime(dateStr: string) {
		const date = new Date(dateStr);
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

		if (diffInHours < 1) return 'vor wenigen Minuten';
		if (diffInHours < 24) return `vor ${diffInHours} Stunden`;
		if (diffInHours < 48) return 'gestern';
		return `vor ${Math.floor(diffInHours / 24)} Tagen`;
	}

	// Helper function to get status badge class
	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'Entwurf':
				return 'badge-warning';
			case 'Zur Freigabe':
				return 'badge-info';
			case 'Freigegeben':
				return 'badge-success';
			case 'Archiviert':
				return 'badge-neutral';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Wish Factory</title>
</svelte:head>

<!-- Theme Toggle (Fixed Position) -->
<div class="fixed right-4 top-4 z-50">
	<div class="dropdown dropdown-end">
		<div tabindex="0" role="button" class="btn btn-ghost btn-circle" aria-label="Theme wechseln">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		</div>
		<ul class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
			{#each themes as theme (theme)}
				<li>
					<button onclick={() => setTheme(theme)} class={theme === currentTheme ? 'active' : ''}>
						<span class="capitalize">{theme.replace('-', ' ')}</span>
						{#if theme === currentTheme}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>

<!-- Page Header with Breadcrumbs -->
<div class="mb-8">
	<div class="breadcrumbs text-sm">
		<ul>
			<li><a href="/" class="link link-hover">Home</a></li>
			<li>Dashboard</li>
		</ul>
	</div>

	<div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-4xl font-bold">Dashboard</h1>
			<p class="text-base-content/70 mt-2 text-lg">
				Willkommen zurück, {data.user.name}!
			</p>
		</div>
		<div class="flex items-center gap-3">
			<div class="badge badge-lg {data.user.isAdmin ? 'badge-error' : 'badge-primary'} gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				{data.user.isAdmin ? 'Administrator' : 'Redakteur'}
			</div>
		</div>
	</div>
</div>

<!-- Welcome Alert -->
{#if showWelcomeAlert}
	<div class="alert alert-success mb-8">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<div>
			<h3 class="font-bold">Willkommen!</h3>
			<div class="text-xs">
				Ihr Dashboard wurde erfolgreich geladen. Hier finden Sie alle wichtigen Informationen auf
				einen Blick.
			</div>
		</div>
		<button
			class="btn btn-ghost btn-sm"
			onclick={() => (showWelcomeAlert = false)}
			aria-label="Willkommensnachricht schließen"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>
{/if}

<!-- Statistics -->
<div class="stats mb-8 w-full shadow">
	<div class="stat">
		<div class="stat-figure text-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
		</div>
		<div class="stat-title">Meine Wünsche</div>
		<div class="stat-value text-primary">{data.stats.userWishes}</div>
		<div class="stat-desc">Gesamt erstellt</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-warning">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div class="stat-title">Zur Freigabe</div>
		<div class="stat-value text-warning">{data.stats.pendingWishes}</div>
		<div class="stat-desc">
			{#if data.stats.todayWishes > 0}
				↗︎ {data.stats.todayWishes} neue heute
			{:else}
				Warten auf Genehmigung
			{/if}
		</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div class="stat-title">Freigegeben</div>
		<div class="stat-value text-success">{data.stats.approvedWishes}</div>
		<div class="stat-desc">
			{#if data.stats.totalWishes > 0}
				↗︎ {Math.round((data.stats.approvedWishes / data.stats.totalWishes) * 100)}% Freigaberate
			{:else}
				Bereit zur Nutzung
			{/if}
		</div>
	</div>
</div>

<!-- Main Content Grid -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Quick Actions -->
	<div class="lg:col-span-2">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="card-title text-2xl">Schnellzugriff</h2>
					<div class="badge badge-neutral">{data.user.isAdmin ? '4' : '2'} Aktionen</div>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Neuen Wunsch erstellen -->
					<div
						class="bg-primary/5 border-primary/20 hover:bg-primary/10 card border transition-colors"
					>
						<div class="card-body">
							<h3 class="card-title text-lg">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Neuen Wunsch erstellen
							</h3>
							<p class="text-sm opacity-70">
								Erstelle einen neuen Wunsch mit oder ohne KI-Unterstützung
							</p>
							<div class="card-actions mt-4 justify-end">
								<a
									href="/dashboard/wishes/new"
									class="btn btn-primary btn-sm"
									data-sveltekit-preload-data="hover"
									data-sveltekit-preload-code="hover"
								>
									Erstellen
								</a>
							</div>
						</div>
					</div>

					<!-- Wünsche verwalten -->
					<div
						class="bg-secondary/5 border-secondary/20 hover:bg-secondary/10 card border transition-colors"
					>
						<div class="card-body">
							<h3 class="card-title text-lg">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
								Wünsche verwalten
							</h3>
							<p class="text-sm opacity-70">Alle deine Wünsche anzeigen und bearbeiten</p>
							<div class="card-actions mt-4 justify-end">
								<a href="/dashboard/wishes" class="btn btn-secondary btn-sm">Verwalten</a>
							</div>
						</div>
					</div>

					{#if data.user.isAdmin}
						<!-- Benutzer verwalten -->
						<div
							class="bg-accent/5 border-accent/20 hover:bg-accent/10 card border transition-colors"
						>
							<div class="card-body">
								<h3 class="card-title text-lg">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									Benutzer verwalten
								</h3>
								<p class="text-sm opacity-70">Benutzerkonten und Rollen verwalten</p>
								<div class="card-actions mt-4 justify-end">
									<a href="/dashboard/users" class="btn btn-accent btn-sm">Verwalten</a>
								</div>
							</div>
						</div>

						<!-- Analytics -->
						<div class="bg-info/5 border-info/20 hover:bg-info/10 card border transition-colors">
							<div class="card-body">
								<h3 class="card-title text-lg">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
									Analytics Dashboard
								</h3>
								<p class="text-sm opacity-70">Detaillierte Berichte und Statistiken</p>
								<div class="card-actions mt-4 justify-end">
									<a href="/dashboard/analytics" class="btn btn-info btn-sm">Anzeigen</a>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Recent Activities -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="card-title">Letzte Aktivitäten</h3>
					<div class="badge badge-ghost">{data.recentActivities.length}</div>
				</div>

				<div class="space-y-4">
					{#each data.recentActivities as activity}
						<div class="flex items-start gap-3">
							<div class="badge {getStatusBadgeClass(activity.status)} p-3">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									{#if activity.status === 'Freigegeben'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									{:else if activity.status === 'Zur Freigabe'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									{:else}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										/>
									{/if}
								</svg>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium">
									{#if activity.status === 'Entwurf'}
										Neuer Wunsch erstellt
									{:else if activity.status === 'Zur Freigabe'}
										Wunsch zur Freigabe
									{:else if activity.status === 'Freigegeben'}
										Wunsch genehmigt
									{:else}
										Wunsch bearbeitet
									{/if}
								</p>
								<p class="text-xs opacity-60">{activity.title}</p>
								<p class="mt-1 text-xs opacity-40">
									{formatRelativeTime(activity.createdAt)} • von {activity.createdBy}
								</p>
							</div>
						</div>
					{:else}
						<div class="text-center py-8">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-12 w-12 mx-auto opacity-30"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2"
								/>
							</svg>
							<p class="text-sm opacity-70 mt-2">Noch keine Aktivitäten</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- System Status -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="card-title">System Status</h3>
					<div class="badge badge-success gap-2">
						<div class="h-2 w-2 animate-pulse rounded-full bg-success"></div>
						Online
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm">KI-Service</span>
						<div class="badge badge-success badge-sm gap-1">
							<div class="h-1.5 w-1.5 rounded-full bg-success"></div>
							Online
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Datenbank</span>
						<div class="badge badge-success badge-sm gap-1">
							<div class="h-1.5 w-1.5 rounded-full bg-success"></div>
							Online
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">E-Mail Service</span>
						<div class="badge badge-success badge-sm gap-1">
							<div class="h-1.5 w-1.5 rounded-full bg-success"></div>
							Online
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm">Backup System</span>
						<div class="badge badge-info badge-sm gap-1">
							<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-info"></div>
							Läuft
						</div>
					</div>
				</div>

				<div class="card-actions mt-4">
					<a href="/dashboard/system" class="btn btn-outline btn-sm btn-block">Details anzeigen</a>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Additional Information -->
<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Tips & Tricks -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="card-title mb-6">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
					/>
				</svg>
				Tipps & Tricks
			</h3>

			<div class="space-y-4">
				<div class="flex items-start gap-4">
					<div class="badge badge-primary badge-lg">1</div>
					<div>
						<h4 class="font-semibold">KI-Unterstützung nutzen</h4>
						<p class="text-sm opacity-70">
							Nutzen Sie unsere KI, um personalisierte Wünsche zu erstellen, die perfekt zu jedem
							Anlass passen.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-4">
					<div class="badge badge-secondary badge-lg">2</div>
					<div>
						<h4 class="font-semibold">Workflow optimieren</h4>
						<p class="text-sm opacity-70">
							Arbeiten Sie effizient mit unserem Freigabeprozess und behalten Sie den Überblick über
							alle Wünsche.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-4">
					<div class="badge badge-accent badge-lg">3</div>
					<div>
						<h4 class="font-semibold">Team-Zusammenarbeit</h4>
						<p class="text-sm opacity-70">
							Arbeiten Sie nahtlos mit Ihrem Team zusammen und teilen Sie Wünsche einfach.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Performance Metrics -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="card-title mb-6">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
				Performance Metriken
			</h3>

			<div class="stats stats-vertical shadow-none">
				<div class="stat px-0">
					<div class="stat-figure text-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block h-6 w-6 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div class="stat-title text-sm">Erstellungszeit</div>
					<div class="stat-value text-lg text-success">2min</div>
					<div class="stat-desc">↓ 80% schneller mit KI</div>
				</div>

				<div class="stat px-0">
					<div class="stat-figure text-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block h-6 w-6 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div class="stat-title text-sm">Zufriedenheit</div>
					<div class="stat-value text-lg text-success">98%</div>
					<div class="stat-desc">↑ 12% mehr Engagement</div>
				</div>

				<div class="stat px-0">
					<div class="stat-figure text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block h-6 w-6 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div class="stat-title text-sm">Freigaberate</div>
					<div class="stat-value text-lg text-primary">89%</div>
					<div class="stat-desc">↑ 5% vs. letzte Woche</div>
				</div>
			</div>
		</div>
	</div>
</div>
