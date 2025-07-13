<script lang="ts">
	import { goto } from '$app/navigation';
	import { EventType } from '$lib/types/Wish';
	import type { PageData } from './$types';
	import type { ReleasedWish } from '$lib/types/Wish';
	import { page } from '$app/stores';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';

	let { data }: { data: PageData } = $props();

	const releasedWishes = $derived(data.releasedWishes as ReleasedWish[]);
	const metadata = $derived(data.metadata);
	const filters = $derived(data.filters);
	const currentPage = $derived(data.currentPage);
	const totalPages = $derived(Math.ceil(data.total / 50));

	// Filter state - use derived for initial values, state for user changes
	let selectedLanguage = $state('');
	let selectedType = $state('');
	let selectedEventType = $state('');
	let selectedLength = $state('');
	let selectedBelated = $state('');

	// Initialize filter values from URL params
	$effect(() => {
		if (filters.language && !selectedLanguage) selectedLanguage = filters.language;
		if (filters.type && !selectedType) selectedType = filters.type;
		if (filters.eventType && !selectedEventType) selectedEventType = filters.eventType;
		if (filters.length && !selectedLength) selectedLength = filters.length;
		if (filters.belated !== undefined && !selectedBelated)
			selectedBelated = filters.belated.toString();
	});

	// UI State
	let showFilters = $state(false);
	let selectedWishes = $state<string[]>([]);
	let showExportModal = $state(false);
	let showWorkflowHelp = $state(false);

	// Sorting State - these are for future implementation
	// let currentSortBy = $state('released_at');
	// let currentSortOrder = $state('desc');

	// Event type icons
	const eventTypeIcons: Record<EventType, string> = {
		birthday: '🎂',
		anniversary: '💐',
		custom: '🎉'
	};

	// Apply filters
	function applyFilters() {
		const searchParams = new URLSearchParams();

		if (selectedLanguage) searchParams.set('language', selectedLanguage);
		if (selectedType) searchParams.set('type', selectedType);
		if (selectedEventType) searchParams.set('eventType', selectedEventType);
		if (selectedLength) searchParams.set('length', selectedLength);
		if (selectedBelated) searchParams.set('belated', selectedBelated);

		goto(`/dashboard/wishes/released?${searchParams.toString()}`);
		showFilters = false;
	}

	// Clear filters
	function clearFilters() {
		selectedLanguage = '';
		selectedType = '';
		selectedEventType = '';
		selectedLength = '';
		selectedBelated = '';
		goto('/dashboard/wishes/released');
	}

	// Get current URL for pagination
	const currentUrl = $derived($page.url);

	// Pagination
	function goToPage(pageNum: number) {
		const searchParams = new URLSearchParams(currentUrl.searchParams);
		searchParams.set('page', pageNum.toString());
		goto(`/dashboard/wishes/released?${searchParams.toString()}`);
	}

	// Format date similar to main wishes page
	function formatDate(date: Date): { date: string; time: string } {
		const dateObj = new Date(date);
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

	// Selection functions
	function toggleWishSelection(wishId: string) {
		if (selectedWishes.includes(wishId)) {
			selectedWishes = selectedWishes.filter((id) => id !== wishId);
		} else {
			selectedWishes = [...selectedWishes, wishId];
		}
	}

	function toggleAllSelection() {
		if (selectedWishes.length === releasedWishes.length) {
			selectedWishes = [];
		} else {
			selectedWishes = releasedWishes.map((w) => w.id);
		}
	}

	function clearSelection() {
		selectedWishes = [];
	}

	// Export function
	function exportSelected() {
		const selectedWishData = releasedWishes.filter((w) => selectedWishes.includes(w.id));
		const dataStr = JSON.stringify(selectedWishData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `released_wishes_export_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
		showExportModal = false;
		clearSelection();
	}

	// Unrelease wish
	async function unreleaseWish(wishId: string) {
		if (!confirm('Möchten Sie diesen Wunsch wirklich aus der Freigabe nehmen?')) {
			return;
		}

		try {
			const response = await fetch(`/api/wishes/${wishId}/release`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Reload page to refresh data
				window.location.reload();
			} else {
				const errorData = await response.json();
				alert(`Fehler: ${errorData.error}`);
			}
		} catch {
			alert('Ein Fehler ist aufgetreten');
		}
	}
</script>

<svelte:head>
	<title>Released Wishes - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Freigegebene Wünsche</h1>
			<p class="text-base-content/70 mt-2">
				Für WishSnap freigegebene Wünsche verwalten und exportieren
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button class="btn btn-ghost btn-sm" onclick={() => (showWorkflowHelp = true)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
				Hilfe
			</button>

			<button class="btn btn-primary btn-sm" onclick={() => (showFilters = !showFilters)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
						clip-rule="evenodd"
					/>
				</svg>
				Filter
			</button>
			{#if selectedWishes.length > 0}
				<button class="btn btn-primary btn-sm" onclick={() => (showExportModal = true)}>
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
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					Export ({selectedWishes.length})
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Statistics -->
<div class="stats stats-horizontal mb-6 w-full shadow">
	<div class="stat">
		<div class="stat-figure text-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8"
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
		</div>
		<div class="stat-title">Gesamt Freigegeben</div>
		<div class="stat-value text-primary">{metadata?.totalCount || 0}</div>
		<div class="stat-desc">
			Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			})}
		</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-secondary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
		</div>
		<div class="stat-title">Aktuelle Seite</div>
		<div class="stat-value text-secondary">{currentPage}</div>
		<div class="stat-desc">von {totalPages} Seiten</div>
	</div>
</div>

<!-- Filter Panel -->
{#if showFilters}
	<div class="card from-base-100 to-base-200 mb-6 bg-gradient-to-br shadow-xl">
		<div class="card-body">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Basic Filters -->
				<div>
					<h4
						class="text-base-content/70 mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
					>
						<div class="bg-primary h-2 w-2 rounded-full"></div>
						Basis Filter
					</h4>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Language Filter -->
						<div class="group">
							<label class="label pb-2" for="language">
								<span
									class="label-text text-base-content/80 flex items-center gap-2 text-sm font-medium"
								>
									🌐 Sprache
								</span>
							</label>
							<select
								id="language"
								class="select select-bordered bg-base-50 hover:bg-base-100 focus:border-primary focus:bg-base-100 focus:shadow-primary/10 w-full transition-all duration-200 focus:shadow-lg"
								bind:value={selectedLanguage}
							>
								<option value="">Alle Sprachen</option>
								{#each metadata.languages as language (language)}
									<option value={language}>{language.toUpperCase()}</option>
								{/each}
							</select>
						</div>

						<!-- Type Filter -->
						<div class="group">
							<label class="label pb-2" for="type">
								<span
									class="label-text text-base-content/80 flex items-center gap-2 text-sm font-medium"
								>
									🎨 Typ
								</span>
							</label>
							<select
								id="type"
								class="select select-bordered bg-base-50 hover:bg-base-100 focus:border-primary focus:bg-base-100 focus:shadow-primary/10 w-full transition-all duration-200 focus:shadow-lg"
								bind:value={selectedType}
							>
								<option value="">Alle Typen</option>
								{#each metadata.types as type (type)}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</div>

						<!-- Event Type Filter -->
						<div class="group">
							<label class="label pb-2" for="eventType">
								<span
									class="label-text text-base-content/80 flex items-center gap-2 text-sm font-medium"
								>
									🎉 Anlass
								</span>
							</label>
							<select
								id="eventType"
								class="select select-bordered bg-base-50 hover:bg-base-100 focus:border-info focus:bg-base-100 focus:shadow-info/10 w-full transition-all duration-200 focus:shadow-lg"
								bind:value={selectedEventType}
							>
								<option value="">Alle Anlässe</option>
								<option value="birthday">🎂 Geburtstag</option>
								<option value="anniversary">💐 Hochzeitstag</option>
								<option value="custom">🎊 Individuell</option>
							</select>
						</div>

						<!-- Length Filter -->
						<div class="group">
							<label class="label pb-2" for="length">
								<span
									class="label-text text-base-content/80 flex items-center gap-2 text-sm font-medium"
								>
									📏 Länge
								</span>
							</label>
							<select
								id="length"
								class="select select-bordered bg-base-50 hover:bg-base-100 focus:border-secondary focus:bg-base-100 focus:shadow-secondary/10 w-full transition-all duration-200 focus:shadow-lg"
								bind:value={selectedLength}
							>
								<option value="">Alle Längen</option>
								{#each metadata.lengths as length (length)}
									<option value={length}>{length}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- Additional Filters -->
				<div>
					<h4
						class="text-base-content/70 mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
					>
						<div class="bg-secondary h-2 w-2 rounded-full"></div>
						Spezielle Filter
					</h4>
					<div class="grid grid-cols-1 gap-6">
						<!-- Belated Filter -->
						<div class="group">
							<label class="label pb-2" for="belated">
								<span
									class="label-text text-base-content/80 flex items-center gap-2 text-sm font-medium"
								>
									⏰ Nachträglich
								</span>
							</label>
							<select
								id="belated"
								class="select select-bordered bg-base-50 hover:bg-base-100 focus:border-accent focus:bg-base-100 focus:shadow-accent/10 w-full transition-all duration-200 focus:shadow-lg"
								bind:value={selectedBelated}
							>
								<option value="">Alle</option>
								<option value="true">🔄 Nachträgliche Wünsche</option>
								<option value="false">⚡ Direkte Wünsche</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Filter Actions -->
			<div class="divider"></div>
			<div class="flex justify-between">
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
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					Filter zurücksetzen
				</button>
				<button class="btn btn-primary btn-sm" onclick={applyFilters}>
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
					Filter anwenden
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Data Table -->
<div class="border-base-300 bg-base-100 overflow-x-auto rounded-lg border shadow-sm">
	<div class="border-base-300 bg-base-200/50 flex items-center justify-between border-b px-4 py-3">
		<div class="flex items-center gap-4">
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-primary checkbox-sm"
					checked={selectedWishes.length === releasedWishes.length && releasedWishes.length > 0}
					onchange={toggleAllSelection}
				/>
				<span class="text-sm font-medium">
					{#if selectedWishes.length > 0}
						{selectedWishes.length} ausgewählt
					{:else}
						Alle auswählen
					{/if}
				</span>
			</label>
		</div>

		<div class="text-base-content/70 text-sm">
			{releasedWishes.length} von {data.total} Einträgen
		</div>
	</div>

	<div class="min-h-[400px]">
		<table class="table-zebra table w-full">
			<thead class="bg-base-200 text-base-content">
				<tr>
					<th class="w-12"></th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors"
					>
						Typ/Anlass
					</th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors"
					>
						Text
					</th>
					<th
						class="hover:bg-base-200 w-16 cursor-pointer px-3 py-4 text-center text-sm font-semibold transition-colors"
					>
						Lang
					</th>
					<th
						class="hover:bg-base-200 cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors"
					>
						Released
					</th>
					<th class="w-20 px-3 py-4 text-center text-sm font-semibold">Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each releasedWishes as wish (wish.id)}
					<tr class="hover:bg-base-50 transition-colors duration-150">
						<td class="px-3 py-3">
							<input
								type="checkbox"
								class="checkbox checkbox-primary checkbox-sm"
								checked={selectedWishes.includes(wish.id)}
								onchange={() => toggleWishSelection(wish.id)}
							/>
						</td>
						<td class="px-3 py-3">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<div class="badge badge-primary badge-sm">{wish.type}</div>
									<div class="badge badge-outline badge-sm">{wish.length}</div>
									{#if wish.belated}
										<div class="badge badge-warning badge-xs">Nachträglich</div>
									{/if}
								</div>
								<div class="flex items-center gap-1">
									<span
										class="text-xl"
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
									<div class="text-base-content/70 text-xs">
										{wish.relations.join(', ')} | {wish.ageGroups.join(', ')}
									</div>
								</div>
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="max-w-md">
								<div class="text-base-content text-sm leading-relaxed font-medium">
									{truncateText(wish.text, 120)}
								</div>
								{#if wish.specificValues.length > 0}
									<div class="text-base-content/50 mt-1 text-xs">
										Werte: {wish.specificValues.join(', ')}
									</div>
								{/if}
							</div>
						</td>
						<td class="px-3 py-3 text-center">
							<div class="badge badge-outline badge-sm font-mono font-bold">
								{wish.language.toUpperCase()}
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="text-base-content/70 text-xs">
								<div class="font-medium">{formatDate(wish.releasedAt).date}</div>
								<div class="text-base-content/50">{formatDate(wish.releasedAt).time}</div>
							</div>
						</td>
						<td class="px-3 py-3">
							<div class="flex justify-center">
								<button
									class="btn btn-error btn-xs"
									onclick={() => unreleaseWish(wish.originalWishId)}
									title="Aus Release entfernen"
									aria-label="Wish aus Release entfernen"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="h-3 w-3"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636"
										/>
									</svg>
								</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="text-center py-12">
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
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
									/>
								</svg>
								<div>
									<h3 class="text-lg font-medium">Keine released Wünsche gefunden</h3>
									<p class="text-sm opacity-70 mt-1">
										{#if Object.values(filters).some((v) => v)}
											Passen Sie Ihre Filter an oder geben Sie Wünsche für WishSnap frei.
										{:else}
											Geben Sie zuerst einige freigegebene Wünsche für WishSnap frei.
										{/if}
									</p>
								</div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Pagination -->
{#if totalPages > 1}
	<div class="mt-6 flex justify-center">
		<div class="join">
			<button
				class="join-item btn"
				class:btn-disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				«
			</button>

			{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
				const startPage = Math.max(1, currentPage - 2);
				return startPage + i;
			}) as pageNum (pageNum)}
				{#if pageNum <= totalPages}
					<button
						class="join-item btn"
						class:btn-active={pageNum === currentPage}
						onclick={() => goToPage(pageNum)}
					>
						{pageNum}
					</button>
				{/if}
			{/each}

			<button
				class="join-item btn"
				class:btn-disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				»
			</button>
		</div>
	</div>
{/if}

<!-- Export Modal -->
{#if showExportModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Released Wishes exportieren</h3>
			<p class="mb-4">
				Sie möchten {selectedWishes.length} ausgewählte released Wishes als JSON-Datei exportieren?
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
				<span>Die Datei wird alle Daten der ausgewählten released Wishes enthalten.</span>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showExportModal = false)}>Abbrechen</button>
				<button class="btn btn-primary" onclick={exportSelected}>Exportieren</button>
			</div>
		</div>
	</div>
{/if}

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} />
