<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, WishStatus, Relation, AgeGroup } from '$lib/types/Wish';
	import type { PageData } from './$types';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';

	type FormResponse = {
		success?: boolean;
		message?: string;
	} | null;

	const { data, form }: { data: PageData; form: FormResponse } = $props();

	let isUpdatingStatus = $state(false);
	let showDeleteModal = $state(false);
	let showWorkflowHelp = $state(false);

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
		[WishType.HERZLICH]: 'Herzlich',
		[WishType.HUMORVOLL]: 'Humorvoll'
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

	// Get available status transitions based on current status and user role
	function getAvailableStatusTransitions() {
		const currentStatus = data.wish.status;
		const userRole = data.profile?.role;
		const transitions: { status: WishStatus; label: string; style: string }[] = [];

		if (currentStatus === WishStatus.ENTWURF) {
			transitions.push({
				status: WishStatus.ZUR_FREIGABE,
				label: 'Zur Freigabe senden',
				style: 'btn-info'
			});
		}

		if (currentStatus === WishStatus.ZUR_FREIGABE && userRole === 'Administrator') {
			transitions.push({
				status: WishStatus.FREIGEGEBEN,
				label: 'Freigeben',
				style: 'btn-success'
			});
			transitions.push({
				status: WishStatus.ENTWURF,
				label: 'Zur Überarbeitung zurück',
				style: 'btn-warning'
			});
		}

		if (currentStatus === WishStatus.FREIGEGEBEN && userRole === 'Administrator') {
			transitions.push({
				status: WishStatus.ARCHIVIERT,
				label: 'Archivieren',
				style: 'btn-neutral'
			});
		}

		return transitions;
	}
</script>

<svelte:head>
	<title>Wunsch {data.wish.id} - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/dashboard/wishes" class="btn btn-ghost btn-sm">
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
				Zurück
			</a>
			<div class="badge {statusStyles[data.wish.status]} badge-lg">
				{data.wish.status}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Status Workflow Buttons -->
			{#each getAvailableStatusTransitions() as transition (transition.status)}
				<form
					method="POST"
					action="?/updateStatus"
					use:enhance={() => {
						isUpdatingStatus = true;
						return async ({ update }) => {
							await update();
							isUpdatingStatus = false;
						};
					}}
				>
					<input type="hidden" name="status" value={transition.status} />
					<button type="submit" class="btn {transition.style} btn-sm" disabled={isUpdatingStatus}>
						{#if isUpdatingStatus}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							{transition.label}
						{/if}
					</button>
				</form>
			{/each}

			<a href="/dashboard/wishes/{data.wish.id}/edit" class="btn btn-primary btn-sm">
				Bearbeiten
			</a>

			{#if data.profile?.role === 'Administrator'}
				<button type="button" class="btn btn-error btn-sm" onclick={() => (showDeleteModal = true)}>
					Löschen
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Main Content -->
<div class="mx-auto max-w-4xl">
	<!-- Wish Header -->
	<div class="mb-8">
		<div class="mb-6 flex items-start gap-4">
			<div
				class="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
			>
				<span class="text-2xl">{eventTypeIcons[data.wish.eventType]}</span>
			</div>
			<div class="min-w-0 flex-1">
				<h1 class="mb-2 text-2xl leading-tight font-bold">
					{eventTypeLabels[data.wish.eventType]}
				</h1>
				<div class="text-base-content/70 flex items-center gap-2 text-sm">
					<span class="bg-base-200 rounded-md px-2 py-1 font-medium"
						>{typeLabels[data.wish.type]}</span
					>
					<span class="bg-base-200 rounded-md px-2 py-1 font-mono tracking-wider uppercase"
						>{data.wish.language}</span
					>
					{#if data.wish.belated}
						<span class="bg-warning/20 text-warning rounded-md px-2 py-1 font-medium"
							>Nachträglich</span
						>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Target Groups (Simplified) -->
	<div class="mb-8">
		<h3 class="mb-5 text-lg font-semibold">Zielgruppen</h3>
		<div class="bg-base-100 border-base-300 rounded-lg border p-5 shadow-sm">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h4 class="text-base-content/80 mb-3 flex items-center gap-2 text-sm font-semibold">
						<span class="bg-primary h-2 w-2 rounded-full"></span>
						Beziehungen
					</h4>
					<div class="flex flex-wrap gap-2">
						{#each data.wish.relations as relation (relation)}
							<span class="badge badge-primary badge-lg">{relationLabels[relation]}</span>
						{/each}
					</div>
				</div>
				<div>
					<h4 class="text-base-content/80 mb-3 flex items-center gap-2 text-sm font-semibold">
						<span class="bg-secondary h-2 w-2 rounded-full"></span>
						Altersgruppen
					</h4>
					<div class="flex flex-wrap gap-2">
						{#each data.wish.ageGroups as ageGroup (ageGroup)}
							<span class="badge badge-secondary badge-lg">{ageGroupLabels[ageGroup]}</span>
						{/each}
					</div>
				</div>
				{#if data.wish.specificValues && data.wish.specificValues.length > 0}
					<div class="border-base-300 border-t pt-3 md:col-span-2">
						<h4 class="text-base-content/80 mb-3 flex items-center gap-2 text-sm font-semibold">
							<span class="bg-accent h-2 w-2 rounded-full"></span>
							Spezifische Werte
						</h4>
						<div class="flex flex-wrap gap-2">
							{#each data.wish.specificValues as value (value)}
								<span class="badge badge-accent badge-lg">{value}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Text -->
	<div class="mb-8">
		<div class="bg-base-100 border-base-300 overflow-hidden rounded-lg border shadow-sm">
			<div class="p-6">
				<p class="text-lg leading-relaxed whitespace-pre-wrap">
					{data.wish.text}
				</p>
			</div>
			<div class="bg-base-200/50 border-base-300 border-t px-6 py-4">
				<div class="flex items-center justify-between">
					<button class="btn btn-outline btn-sm" onclick={() => copyToClipboard(data.wish.text)}>
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
						Kopieren
					</button>
					<div class="text-base-content/60 flex items-center gap-4 text-sm">
						<div class="flex items-center gap-1">
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
									d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-7 8h6m-7 4h6m-7-8h6m-7-4h6"
								/>
							</svg>
							<span>Erstellt: {formatDate(data.wish.createdAt)}</span>
						</div>
						<div class="flex items-center gap-1">
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
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
							<span class="font-mono">ID: {data.wish.id.slice(0, 8)}...</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Success/Error Messages -->
{#if form?.success}
	<div class="alert alert-success mt-6">
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
		<span>{form.message}</span>
	</div>
{:else if form?.message}
	<div class="alert alert-error mt-6">
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
				d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>{form.message}</span>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wunsch löschen</h3>
			<p class="mb-4">
				Möchten Sie den Wunsch "{data.wish.id}" wirklich unwiderruflich löschen?
			</p>
			<div class="alert alert-warning">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<span>Diese Aktion kann nicht rückgängig gemacht werden!</span>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showDeleteModal = false)}> Abbrechen </button>
				<form method="POST" action="?/delete" use:enhance>
					<button type="submit" class="btn btn-error"> Endgültig löschen </button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} />
