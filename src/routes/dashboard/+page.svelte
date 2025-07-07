<script lang="ts">
	import { currentUserProfile, isAdmin, isRedakteur } from '$lib/stores/auth';
</script>

<svelte:head>
	<title>Dashboard - Wish Factory</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Dashboard</h1>
		<p class="text-base-content/70">
			Willkommen zurück, {$currentUserProfile?.full_name || 'User'}!
		</p>
	</div>

	<!-- Role Badge -->
	<div class="mb-6">
		{#if $isAdmin}
			<div class="badge badge-error badge-lg">Administrator</div>
		{:else if $isRedakteur}
			<div class="badge badge-primary badge-lg">Redakteur</div>
		{/if}
	</div>

	<!-- Quick Stats -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="stat bg-base-100 rounded-lg shadow">
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
						d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
					></path>
				</svg>
			</div>
			<div class="stat-title">Meine Wünsche</div>
			<div class="stat-value">-</div>
			<div class="stat-desc">Gesamt erstellt</div>
		</div>

		<div class="stat bg-base-100 rounded-lg shadow">
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
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			</div>
			<div class="stat-title">Zur Freigabe</div>
			<div class="stat-value">-</div>
			<div class="stat-desc">Warten auf Genehmigung</div>
		</div>

		<div class="stat bg-base-100 rounded-lg shadow">
			<div class="stat-figure text-success">
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
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			</div>
			<div class="stat-title">Freigegeben</div>
			<div class="stat-value">-</div>
			<div class="stat-desc">Veröffentlicht</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 stroke-current"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
						></path>
					</svg>
					Neuen Wunsch erstellen
				</h2>
				<p>Erstelle einen neuen Wunsch mit oder ohne KI-Unterstützung</p>
				<div class="card-actions justify-end">
					<a href="/dashboard/wishes/new" class="btn btn-primary">Erstellen</a>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						></path>
					</svg>
					Wünsche verwalten
				</h2>
				<p>Alle deine Wünsche anzeigen und bearbeiten</p>
				<div class="card-actions justify-end">
					<a href="/dashboard/wishes" class="btn btn-secondary">Verwalten</a>
				</div>
			</div>
		</div>

		{#if $isAdmin}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="h-6 w-6 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							></path>
						</svg>
						Benutzer verwalten
					</h2>
					<p>Benutzerkonten und Rollen verwalten</p>
					<div class="card-actions justify-end">
						<a href="/dashboard/users" class="btn btn-accent">Verwalten</a>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Recent Activity (Placeholder) -->
	<div class="mt-12">
		<h2 class="mb-4 text-2xl font-bold">Letzte Aktivitäten</h2>
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="text-base-content/60 text-center">
					<p>Noch keine Aktivitäten vorhanden.</p>
					<p class="mt-2 text-sm">Erstelle deinen ersten Wunsch, um hier Aktivitäten zu sehen.</p>
				</div>
			</div>
		</div>
	</div>
</div>
