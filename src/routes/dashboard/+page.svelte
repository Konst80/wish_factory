<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import QuickActionCard from '$lib/components/ui/QuickActionCard.svelte';

	// Mock data for testing
	const mockUser = { full_name: 'Test User' };
	const isAdmin = true;
	const isRedakteur = false;
</script>

<svelte:head>
	<title>Dashboard - Wish Factory</title>
</svelte:head>

<PageHeader title="Dashboard" subtitle="Willkommen zurück, {mockUser?.full_name || 'User'}!" />

<!-- Role Badge -->
<div class="mb-6">
	{#if isAdmin}
		<div class="badge badge-error badge-lg">Administrator</div>
	{:else if isRedakteur}
		<div class="badge badge-primary badge-lg">Redakteur</div>
	{/if}
</div>

<!-- Quick Stats -->
<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
	<StatCard title="Meine Wünsche" value="-" description="Gesamt erstellt" color="primary">
		{#snippet icon()}
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
		{/snippet}
	</StatCard>

	<StatCard title="Zur Freigabe" value="-" description="Warten auf Genehmigung" color="secondary">
		{#snippet icon()}
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
		{/snippet}
	</StatCard>

	<StatCard title="Freigegeben" value="-" description="Veröffentlicht" color="success">
		{#snippet icon()}
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
		{/snippet}
	</StatCard>
</div>

<!-- Quick Actions -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
	<QuickActionCard
		title="Neuen Wunsch erstellen"
		description="Erstelle einen neuen Wunsch mit oder ohne KI-Unterstützung"
		href="/dashboard/wishes/new"
		buttonText="Erstellen"
		buttonVariant="primary"
	>
		{#snippet icon()}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-6 w-6 stroke-current"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
				></path>
			</svg>
		{/snippet}
	</QuickActionCard>

	<QuickActionCard
		title="Wünsche verwalten"
		description="Alle deine Wünsche anzeigen und bearbeiten"
		href="/dashboard/wishes"
		buttonText="Verwalten"
		buttonVariant="secondary"
	>
		{#snippet icon()}
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
		{/snippet}
	</QuickActionCard>

	{#if isAdmin}
		<QuickActionCard
			title="Benutzer verwalten"
			description="Benutzerkonten und Rollen verwalten"
			href="/dashboard/users"
			buttonText="Verwalten"
			buttonVariant="accent"
		>
			{#snippet icon()}
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
			{/snippet}
		</QuickActionCard>
	{/if}
</div>

<!-- Recent Activity -->
<div class="mt-12">
	<h2 class="mb-6 text-2xl font-bold">Letzte Aktivitäten</h2>
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="text-base-content/60 text-center">
				<div class="mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="mx-auto h-12 w-12 opacity-50"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125m3-6.75h3.875c.621 0 1.125-.504 1.125-1.125V8.25m-6.75 0V6.108c0-1.135.845-2.098 1.976-2.192z"
						/>
					</svg>
				</div>
				<p class="text-lg font-medium">Noch keine Aktivitäten vorhanden</p>
				<p class="mt-2 text-sm">Erstelle deinen ersten Wunsch, um hier Aktivitäten zu sehen.</p>
			</div>
		</div>
	</div>
</div>
