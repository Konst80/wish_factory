<script lang="ts">
	import { WishType, EventType, WishStatus, Relation, AgeGroup } from '$lib/types/Wish';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Status badge styles
	const statusStyles: Record<WishStatus, string> = {
		Entwurf: 'badge-warning',
		'Zur Freigabe': 'badge-info',
		Freigegeben: 'badge-success',
		Archiviert: 'badge-neutral'
	};

	// Event type icons
	const eventTypeIcons: Record<EventType, string> = {
		birthday: '🎂',
		anniversary: '💐',
		custom: '🎉'
	};

	// German translations for display
	const typeLabels = {
		[WishType.NORMAL]: 'Normal',
		[WishType.FUNNY]: 'Lustig'
	};

	const eventTypeLabels = {
		[EventType.BIRTHDAY]: 'Geburtstag',
		[EventType.ANNIVERSARY]: 'Jubiläum',
		[EventType.CUSTOM]: 'Individuell'
	};

	const relationLabels = {
		[Relation.FRIEND]: 'Freund/in',
		[Relation.FAMILY]: 'Familie',
		[Relation.PARTNER]: 'Partner/in',
		[Relation.COLLEAGUE]: 'Kollege/in'
	};

	const ageGroupLabels = {
		[AgeGroup.ALL]: 'Alle Altersgruppen',
		[AgeGroup.YOUNG]: 'Jung (bis 30)',
		[AgeGroup.MIDDLE]: 'Mittel (30-60)',
		[AgeGroup.SENIOR]: 'Senior (60+)'
	};

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		// TODO: Add toast notification
	}
</script>

<svelte:head>
	<title>Wunsch {data.wish.id} - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="breadcrumbs mb-4 text-sm">
		<ul>
			<li><a href="/dashboard" class="link-hover">Dashboard</a></li>
			<li><a href="/dashboard/wishes" class="link-hover">Wünsche</a></li>
			<li>{data.wish.id}</li>
		</ul>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Wunsch-Details</h1>
			<p class="text-base-content/70 mt-2">
				Vollständige Ansicht des Wunsches {data.wish.id}
			</p>
		</div>
		<div class="flex gap-2">
			<a href="/dashboard/wishes/{data.wish.id}/edit" class="btn btn-primary btn-sm">
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
						d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
					/>
				</svg>
				Bearbeiten
			</a>
		</div>
	</div>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main Content -->
	<div class="lg:col-span-2">
		<!-- Status and Meta Info -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title">
						<span class="text-lg">
							{eventTypeIcons[data.wish.eventType]}
						</span>
						{eventTypeLabels[data.wish.eventType]} - {typeLabels[data.wish.type]}
					</h2>
					<div class="badge {statusStyles[data.wish.status]} badge-lg">
						{data.wish.status}
					</div>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
					<div>
						<div class="text-base-content/70 text-xs font-medium uppercase tracking-wide">
							Sprache
						</div>
						<div class="font-mono text-lg uppercase">
							{data.wish.language}
						</div>
					</div>
					<div>
						<div class="text-base-content/70 text-xs font-medium uppercase tracking-wide">
							Erstellt
						</div>
						<div class="text-sm">
							{formatDate(data.wish.createdAt)}
						</div>
					</div>
					<div>
						<div class="text-base-content/70 text-xs font-medium uppercase tracking-wide">
							Aktualisiert
						</div>
						<div class="text-sm">
							{formatDate(data.wish.updatedAt)}
						</div>
					</div>
					<div>
						<div class="text-base-content/70 text-xs font-medium uppercase tracking-wide">ID</div>
						<div class="font-mono text-sm">
							{data.wish.id}
							<button
								class="btn btn-ghost btn-xs ml-2"
								onclick={() => copyToClipboard(data.wish.id)}
								title="ID kopieren"
							>
								📋
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Text -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z"
						/>
					</svg>
					Wunsch-Text
				</h3>
				<div class="divider my-2"></div>
				<div class="rounded-lg bg-base-200 p-4">
					<p class="whitespace-pre-wrap text-base leading-relaxed">
						{data.wish.text}
					</p>
				</div>
				<button
					class="btn btn-outline btn-sm mt-4 self-start"
					onclick={() => copyToClipboard(data.wish.text)}
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
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					Text kopieren
				</button>
			</div>
		</div>

		<!-- Belated Text -->
		{#if data.wish.belated}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Nachträglicher Text
					</h3>
					<div class="divider my-2"></div>
					<div class="bg-warning/10 rounded-lg border-l-4 border-warning p-4">
						<p class="whitespace-pre-wrap text-base leading-relaxed">
							{data.wish.belated}
						</p>
					</div>
					<button
						class="btn btn-outline btn-sm mt-4 self-start"
						onclick={() => copyToClipboard(data.wish.belated)}
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
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						Nachträglichen Text kopieren
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Sidebar -->
	<div class="lg:col-span-1">
		<!-- Target Groups -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
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
					Zielgruppen
				</h3>
				<div class="divider my-2"></div>

				<!-- Relations -->
				<div class="mb-4">
					<h4 class="text-base-content/70 mb-2 text-sm font-medium uppercase tracking-wide">
						Beziehungen
					</h4>
					<div class="flex flex-wrap gap-2">
						{#each data.wish.relations as relation (relation)}
							<div class="badge badge-primary">
								{relationLabels[relation]}
							</div>
						{/each}
					</div>
				</div>

				<!-- Age Groups -->
				<div class="mb-4">
					<h4 class="text-base-content/70 mb-2 text-sm font-medium uppercase tracking-wide">
						Altersgruppen
					</h4>
					<div class="flex flex-wrap gap-2">
						{#each data.wish.ageGroups as ageGroup (ageGroup)}
							<div class="badge badge-secondary">
								{ageGroupLabels[ageGroup]}
							</div>
						{/each}
					</div>
				</div>

				<!-- Specific Values -->
				{#if data.wish.specificValues && data.wish.specificValues.length > 0}
					<div>
						<h4 class="text-base-content/70 mb-2 text-sm font-medium uppercase tracking-wide">
							Spezifische Werte
						</h4>
						<div class="flex flex-wrap gap-2">
							{#each data.wish.specificValues as value (value)}
								<div class="badge badge-accent">
									{value}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
						/>
					</svg>
					Aktionen
				</h3>
				<div class="divider my-2"></div>

				<div class="space-y-2">
					<a
						href="/dashboard/wishes/{data.wish.id}/edit"
						class="btn btn-primary btn-sm w-full justify-start"
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
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
						Bearbeiten
					</a>

					<button
						class="btn btn-outline btn-sm w-full justify-start"
						onclick={() => copyToClipboard(JSON.stringify(data.wish, null, 2))}
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
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						JSON exportieren
					</button>

					<a href="/dashboard/wishes" class="btn btn-ghost btn-sm w-full justify-start">
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
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Zurück zur Übersicht
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
