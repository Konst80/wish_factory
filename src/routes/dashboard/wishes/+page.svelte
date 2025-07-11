<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { WishStatus, EventType, Relation, AgeGroup } from '$lib/types/Wish';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Filter State
	let searchTerm = $state(data.filters.search || '');
	let selectedLanguage = $state(data.filters.language || '');
	let selectedStatus = $state(data.filters.status || '');
	let selectedEventType = $state(data.filters.eventType || '');
	let selectedRelations = $state(data.filters.relations || []);
	let selectedAgeGroups = $state(data.filters.ageGroups || []);
	let selectedBelated = $state(data.filters.belated !== undefined ? data.filters.belated : '');

	// Sorting State
	let currentSortBy = $state(data.sorting?.sortBy || 'created_at');
	let currentSortOrder = $state(data.sorting?.sortOrder || 'desc');

	// UI State
	let showFilters = $state(false);
	let selectedWishes = $state<string[]>([]);
	let showDeleteModal = $state(false);
	let showExportModal = $state(false);
	let isDeleting = $state(false);

	// Load saved filters on page mount
	$effect(() => {
		loadFiltersFromSession();
	});

	// Status badge styles
	const statusStyles: Record<WishStatus, string> = {
		Entwurf: 'badge-warning',
		'Zur Freigabe': 'badge-info',
		Freigegeben: 'badge-success',
		Archiviert: 'badge-ghost'
	};

	// Event type icons
	const eventTypeIcons: Record<EventType, string> = {
		birthday: '🎂',
		anniversary: '💐',
		custom: '🎉'
	};

	// Apply filters function
	function applyFilters() {
		const params = new URLSearchParams();

		if (searchTerm) params.set('search', searchTerm);
		if (selectedLanguage) params.set('language', selectedLanguage);
		if (selectedStatus) params.set('status', selectedStatus);
		if (selectedEventType) params.set('eventType', selectedEventType);
		if (selectedRelations.length) params.set('relations', selectedRelations.join(','));
		if (selectedAgeGroups.length) params.set('ageGroups', selectedAgeGroups.join(','));
		if (selectedBelated) params.set('belated', selectedBelated);

		// Preserve current sorting
		if (currentSortBy !== 'created_at') params.set('sortBy', currentSortBy);
		if (currentSortOrder !== 'desc') params.set('sortOrder', currentSortOrder);

		// Save filters to session storage
		saveFiltersToSession();

		goto(`?${params.toString()}`, { replaceState: true });

		// Collapse the filter section after applying
		showFilters = false;
	}

	// Sorting function
	function sortBy(column: string) {
		const params = new URLSearchParams(window.location.search);

		// Toggle sort order if clicking the same column
		if (currentSortBy === column) {
			currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			currentSortBy = column;
			currentSortOrder = 'desc'; // Default to descending for new columns
		}

		// Update URL parameters
		params.set('sortBy', currentSortBy);
		params.set('sortOrder', currentSortOrder);

		goto(`?${params.toString()}`, { replaceState: true });
	}

	function clearFilters() {
		searchTerm = '';
		selectedLanguage = '';
		selectedStatus = '';
		selectedEventType = '';
		selectedRelations = [];
		selectedAgeGroups = [];
		selectedBelated = '';

		// Clear filters from session storage
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem('wishFilters');
		}

		goto('/dashboard/wishes', { replaceState: true });
	}

	// Save filters to session storage
	function saveFiltersToSession() {
		if (typeof sessionStorage !== 'undefined') {
			const filters = {
				searchTerm,
				selectedLanguage,
				selectedStatus,
				selectedEventType,
				selectedRelations,
				selectedAgeGroups,
				selectedBelated
			};
			sessionStorage.setItem('wishFilters', JSON.stringify(filters));
		}
	}

	// Load filters from session storage
	function loadFiltersFromSession() {
		if (typeof sessionStorage !== 'undefined') {
			const saved = sessionStorage.getItem('wishFilters');
			if (saved) {
				try {
					const filters = JSON.parse(saved);
					// Only apply saved filters if URL doesn't have filter params
					const urlParams = new URLSearchParams(window.location.search);
					const hasUrlFilters =
						urlParams.has('search') ||
						urlParams.has('language') ||
						urlParams.has('status') ||
						urlParams.has('eventType') ||
						urlParams.has('relations') ||
						urlParams.has('ageGroups') ||
						urlParams.has('belated');

					if (!hasUrlFilters) {
						searchTerm = filters.searchTerm || '';
						selectedLanguage = filters.selectedLanguage || '';
						selectedStatus = filters.selectedStatus || '';
						selectedEventType = filters.selectedEventType || '';
						selectedRelations = filters.selectedRelations || [];
						selectedAgeGroups = filters.selectedAgeGroups || [];
						selectedBelated = filters.selectedBelated || '';

						// Apply the loaded filters
						const hasFilters =
							searchTerm ||
							selectedLanguage ||
							selectedStatus ||
							selectedEventType ||
							selectedRelations.length ||
							selectedAgeGroups.length ||
							selectedBelated;

						if (hasFilters) {
							setTimeout(() => applyFilters(), 0);
						}
					}
				} catch (error) {
					console.warn('Error loading saved filters:', error);
				}
			}
		}
	}

	function toggleWishSelection(wishId: string) {
		if (selectedWishes.includes(wishId)) {
			selectedWishes = selectedWishes.filter((id) => id !== wishId);
		} else {
			selectedWishes = [...selectedWishes, wishId];
		}
	}

	function selectAllWishes() {
		selectedWishes = data.wishes.map((w) => w.id);
	}

	function clearSelection() {
		selectedWishes = [];
	}

	function formatDate(date: Date | string | null) {
		if (!date) {
			return { date: 'Unbekannt', time: '' };
		}
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return {
			date: dateObj.toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			}),
			time: dateObj.toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit'
			})
		};
	}

	function truncateText(text: string, maxLength: number = 100) {
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	function exportSelected() {
		const selectedWishData = data.wishes.filter((w) => selectedWishes.includes(w.id));
		const dataStr = JSON.stringify(selectedWishData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `wishes_export_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
		showExportModal = false;
		clearSelection();
	}
</script>

<svelte:head>
	<title>Wünsche verwalten - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Wünsche verwalten</h1>
			<p class="text-base-content/70 mt-2">
				Verwalten Sie alle Ihre Wünsche mit erweiterten Filter- und Suchoptionen
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (showFilters = !showFilters)}>
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
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
					/>
				</svg>
				{showFilters ? 'Filter ausblenden' : 'Filter einblenden'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 transition-transform {showFilters ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			<a href="/dashboard/wishes/new" class="btn btn-primary btn-sm">
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
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Neuer Wunsch
			</a>
		</div>
	</div>
</div>

<!-- Success Messages -->
{#if data.deleted}
	<div class="alert alert-success mb-6">
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
			<h3 class="font-bold">
				{data.deletedCount > 1
					? `${data.deletedCount} Wünsche erfolgreich gelöscht`
					: 'Wunsch erfolgreich gelöscht'}
			</h3>
			<div class="text-xs">
				{data.deletedCount > 1
					? 'Die Wünsche wurden unwiderruflich aus der Datenbank entfernt.'
					: 'Der Wunsch wurde unwiderruflich aus der Datenbank entfernt.'}
			</div>
		</div>
		<button
			class="btn btn-ghost btn-sm btn-circle"
			onclick={() => {
				const url = new URL(window.location.href);
				url.searchParams.delete('deleted');
				url.searchParams.delete('count');
				goto(url.pathname + url.search, { replaceState: true });
			}}
			title="Nachricht schließen"
			aria-label="Erfolgsmeldung schließen"
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
<div class="stats mb-6 w-full shadow">
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
		<div class="stat-title">Gesamt</div>
		<div class="stat-value text-primary">{data.stats.total}</div>
		<div class="stat-desc">Alle Wünsche</div>
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
					d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
				/>
			</svg>
		</div>
		<div class="stat-title">Entwurf</div>
		<div class="stat-value text-warning">{data.stats.entwurf}</div>
		<div class="stat-desc">In Bearbeitung</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-info">
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
		<div class="stat-value text-info">{data.stats.zurFreigabe}</div>
		<div class="stat-desc">Warten auf Genehmigung</div>
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
		<div class="stat-value text-success">{data.stats.freigegeben}</div>
		<div class="stat-desc">Bereit zur Nutzung</div>
	</div>
</div>

<!-- Filter Panel -->
{#if showFilters}
	<div class="card border-primary bg-base-100 mb-6 border-l-4 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="card-title text-primary">
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
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
						/>
					</svg>
					🔍 Erweiterte Filter & Suche
				</h3>
				<button class="btn btn-ghost btn-sm" onclick={clearFilters}>
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
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Zurücksetzen
				</button>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<!-- Search -->
				<div class="form-control">
					<label class="label" for="search">
						<span class="label-text">Suche</span>
					</label>
					<input
						id="search"
						type="text"
						placeholder="ID oder Text durchsuchen..."
						class="input-bordered input w-full"
						bind:value={searchTerm}
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
				</div>

				<!-- Language -->
				<div class="form-control">
					<label class="label" for="language">
						<span class="label-text">Sprache</span>
					</label>
					<select id="language" class="select-bordered select w-full" bind:value={selectedLanguage}>
						<option value="">Alle Sprachen</option>
						<option value="de">Deutsch</option>
						<option value="en">English</option>
					</select>
				</div>

				<!-- Status -->
				<div class="form-control">
					<label class="label" for="status">
						<span class="label-text">Status</span>
					</label>
					<select id="status" class="select-bordered select w-full" bind:value={selectedStatus}>
						<option value="">Alle Status</option>
						{#each Object.values(WishStatus) as status (status)}
							<option value={status}>{status}</option>
						{/each}
					</select>
				</div>

				<!-- Event Type -->
				<div class="form-control">
					<label class="label" for="eventType">
						<span class="label-text">Anlass</span>
					</label>
					<select
						id="eventType"
						class="select-bordered select w-full"
						bind:value={selectedEventType}
					>
						<option value="">Alle Anlässe</option>
						<option value="birthday">Geburtstag</option>
						<option value="anniversary">Jubiläum</option>
						<option value="custom">Individuell</option>
					</select>
				</div>

				<!-- Relations -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Beziehungen</span>
					</label>
					<div class="flex flex-wrap gap-2">
						{#each Object.values(Relation) as relation (relation)}
							<label class="label cursor-pointer">
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									bind:group={selectedRelations}
									value={relation}
								/>
								<span class="label-text ml-2 capitalize">{relation}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Age Groups -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Altersgruppen</span>
					</label>
					<div class="flex flex-wrap gap-2">
						{#each Object.values(AgeGroup) as ageGroup (ageGroup)}
							<label class="label cursor-pointer">
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									bind:group={selectedAgeGroups}
									value={ageGroup}
								/>
								<span class="label-text ml-2 capitalize">{ageGroup}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Belated -->
				<div class="form-control">
					<label class="label" for="belated">
						<span class="label-text">Nachträglich</span>
					</label>
					<select id="belated" class="select-bordered select w-full" bind:value={selectedBelated}>
						<option value="">Alle</option>
						<option value="true">Nur nachträgliche</option>
						<option value="false">Nur reguläre</option>
					</select>
				</div>
			</div>

			<div class="card-actions mt-6 justify-end">
				<button class="btn btn-primary" onclick={applyFilters}> Filter anwenden </button>
			</div>
		</div>
	</div>
{/if}

<!-- Bulk Actions -->
{#if selectedWishes.length > 0}
	<div class="alert alert-info mb-6">
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
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<div>
			<h3 class="font-bold">{selectedWishes.length} Wünsche ausgewählt</h3>
			<div class="text-xs">
				Sie können die ausgewählten Wünsche exportieren{#if data.profile?.role === 'Administrator'}
					oder löschen{/if}.
			</div>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (showExportModal = true)}>
				Exportieren
			</button>
			{#if data.profile?.role === 'Administrator'}
				<button class="btn btn-error btn-sm" onclick={() => (showDeleteModal = true)}>
					Löschen
				</button>
			{/if}
			<button class="btn btn-ghost btn-sm" onclick={clearSelection}> Auswahl aufheben </button>
		</div>
	</div>
{/if}

<!-- Wishes Table -->
<div class="card bg-base-100 shadow-xl">
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr class="border-base-300 border-b">
					<th class="w-12 px-3 py-4">
						<label>
							<input
								type="checkbox"
								class="checkbox checkbox-sm"
								onchange={selectedWishes.length === data.wishes.length
									? clearSelection
									: selectAllWishes}
								checked={selectedWishes.length === data.wishes.length && data.wishes.length > 0}
								aria-label="Alle Wünsche auswählen"
							/>
						</label>
					</th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors select-none"
						onclick={() => sortBy('event_type')}
						title="Nach Anlass sortieren"
					>
						<div class="flex items-center gap-2">
							<span>Anlass</span>
							{#if currentSortBy === 'event_type'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {currentSortOrder === 'asc' ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="hover:bg-base-200 min-w-80 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors select-none"
						onclick={() => sortBy('text')}
						title="Nach Text sortieren"
					>
						<div class="flex items-center gap-2">
							<span>Text</span>
							{#if currentSortBy === 'text'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {currentSortOrder === 'asc' ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors select-none"
						onclick={() => sortBy('status')}
						title="Nach Status sortieren"
					>
						<div class="flex items-center gap-2">
							<span>Status</span>
							{#if currentSortBy === 'status'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {currentSortOrder === 'asc' ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="hover:bg-base-200 w-16 cursor-pointer px-3 py-4 text-center text-sm font-semibold transition-colors select-none"
						onclick={() => sortBy('language')}
						title="Nach Sprache sortieren"
					>
						<div class="flex items-center justify-center gap-2">
							<span>Lang</span>
							{#if currentSortBy === 'language'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {currentSortOrder === 'asc' ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors select-none"
						onclick={() => sortBy('created_at')}
						title="Nach Erstellungsdatum sortieren"
					>
						<div class="flex items-center gap-2">
							<span>Erstellt</span>
							{#if currentSortBy === 'created_at'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 {currentSortOrder === 'asc' ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th class="px-3 py-4 text-left text-sm font-semibold">Von</th>
					<th class="w-20 px-3 py-4 text-center text-sm font-semibold">Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each data.wishes as wish (wish.id)}
					<tr class="hover:bg-base-50 border-base-200/50 border-b transition-colors">
						<td class="px-3 py-3">
							<label>
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									checked={selectedWishes.includes(wish.id)}
									onchange={() => toggleWishSelection(wish.id)}
									aria-label="Wunsch {wish.id} auswählen"
								/>
							</label>
						</td>
						<td class="px-3 py-3 text-center">
							<span
								class="text-2xl"
								title="{wish.eventType === 'birthday'
									? 'Geburtstag'
									: wish.eventType === 'anniversary'
										? 'Jubiläum'
										: 'Benutzerdefiniert'}{wish.specificValues && wish.specificValues.length > 0
									? ' - ' + wish.specificValues.join(', ')
									: ''}"
							>
								{eventTypeIcons[wish.eventType]}
							</span>
						</td>
						<td class="px-3 py-3">
							<div class="max-w-md">
								<div class="text-base-content text-sm leading-relaxed font-medium">
									{truncateText(wish.text, 120)}
								</div>
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="badge {statusStyles[wish.status]} badge-sm font-medium whitespace-nowrap">
								{wish.status}
							</div>
						</td>
						<td class="px-3 py-3 text-center">
							<div class="badge badge-outline badge-sm font-mono font-bold">
								{wish.language.toUpperCase()}
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="text-base-content/70 text-xs">
								<div class="font-medium">{formatDate(wish.createdAt).date}</div>
								<div class="text-base-content/50">{formatDate(wish.createdAt).time}</div>
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="text-base-content/70 text-xs font-medium">
								{wish.createdBy || 'Unbekannt'}
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="flex justify-center gap-1">
								<a
									href="/dashboard/wishes/{wish.id}"
									class="btn btn-ghost text-primary hover:bg-primary/10"
									title="Anzeigen"
									aria-label="Wunsch anzeigen"
								>
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
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								</a>
								<a
									href="/dashboard/wishes/{wish.id}/edit"
									class="btn btn-ghost text-secondary hover:bg-secondary/10"
									title="Bearbeiten"
									aria-label="Wunsch bearbeiten"
								>
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
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										/>
									</svg>
								</a>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="text-center py-12">
							<div class="flex flex-col items-center gap-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-16 w-16 opacity-30"
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
								<div>
									<h3 class="text-lg font-medium">Keine Wünsche gefunden</h3>
									<p class="text-sm opacity-70 mt-1">
										{#if Object.values(data.filters).some((v) => v && (Array.isArray(v) ? v.length > 0 : true))}
											Passen Sie Ihre Filter an oder erstellen Sie einen neuen Wunsch.
										{:else}
											Erstellen Sie Ihren ersten Wunsch, um loszulegen.
										{/if}
									</p>
									<a href="/dashboard/wishes/new" class="btn btn-primary btn-sm mt-4">
										Ersten Wunsch erstellen
									</a>
								</div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Export Modal -->
{#if showExportModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wünsche exportieren</h3>
			<p class="mb-4">
				Sie möchten {selectedWishes.length} ausgewählte Wünsche als JSON-Datei exportieren?
			</p>
			<div class="alert alert-info">
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
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>Die Datei wird alle Daten der ausgewählten Wünsche enthalten.</span>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showExportModal = false)}>Abbrechen</button>
				<button class="btn btn-primary" onclick={exportSelected}>Exportieren</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wünsche löschen</h3>
			<p class="mb-4">
				Möchten Sie wirklich {selectedWishes.length} ausgewählte Wünsche löschen?
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
				<button class="btn btn-ghost" onclick={() => (showDeleteModal = false)}>Abbrechen</button>
				<form
					method="POST"
					action="?/bulkDelete"
					style="display: inline;"
					use:enhance={() => {
						isDeleting = true;
						return async ({ update }) => {
							await update();
							isDeleting = false;
							showDeleteModal = false;
							clearSelection();
						};
					}}
				>
					{#each selectedWishes as wishId}
						<input type="hidden" name="wishIds" value={wishId} />
					{/each}
					<button type="submit" class="btn btn-error" disabled={isDeleting}>
						{#if isDeleting}
							<span class="loading loading-spinner loading-sm"></span>
							Lösche...
						{:else}
							Löschen
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
