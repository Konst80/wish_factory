<script lang="ts">
	import { goto } from '$app/navigation';
	import { WishType, EventType, WishLength } from '$lib/types/Wish';
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
	
	// Filter state
	let selectedLanguage = $state(filters.language || '');
	let selectedType = $state(filters.type || '');
	let selectedEventType = $state(filters.eventType || '');
	let selectedLength = $state(filters.length || '');
	let selectedBelated = $state(filters.belated?.toString() || '');
	
	// UI State
	let showFilters = $state(false);
	let selectedWishes = $state<string[]>([]);
	let showExportModal = $state(false);
	let showWorkflowHelp = $state(false);
	
	// Sorting State
	let currentSortBy = $state('released_at');
	let currentSortOrder = $state('desc');
	
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
				const error = await response.json();
				alert(`Fehler: ${error.error}`);
			}
		} catch (error) {
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
			<h1 class="text-base-content text-3xl font-bold">Released Wishes</h1>
			<p class="text-base-content/70 mt-2">
				Für WishSnap freigegebene Wünsche verwalten und exportieren
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (showWorkflowHelp = true)}>
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
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Hilfe
			</button>
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
<div class="stats stats-horizontal shadow w-full mb-6">
	<div class="stat">
		<div class="stat-title">Gesamt Released</div>
		<div class="stat-value text-2xl">{metadata.totalCount}</div>
		<div class="stat-desc">
			Zuletzt aktualisiert: {formatDate(metadata.lastUpdated).date}
		</div>
	</div>
	<div class="stat">
		<div class="stat-title">Aktuelle Seite</div>
		<div class="stat-value text-2xl">{releasedWishes.length}</div>
		<div class="stat-desc">von {data.total} Einträgen</div>
	</div>
</div>

<!-- Filter Panel -->
{#if showFilters}
	<div class="card mb-6 bg-gradient-to-br from-base-100 to-base-200 shadow-xl">
		<div class="card-body">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Basic Filters -->
				<div>
					<h4 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/70">
						<div class="h-2 w-2 rounded-full bg-primary"></div>
						Basis Filter
					</h4>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Language Filter -->
						<div class="group">
							<label class="label pb-2" for="language">
								<span class="label-text flex items-center gap-2 text-sm font-medium text-base-content/80">
									🌐 Sprache
								</span>
							</label>
							<select 
								id="language" 
								class="select select-bordered w-full bg-base-50 transition-all duration-200 hover:bg-base-100 focus:border-primary focus:bg-base-100 focus:shadow-lg focus:shadow-primary/10" 
								bind:value={selectedLanguage}
							>
								<option value="">Alle Sprachen</option>
								{#each metadata.languages as language}
									<option value={language}>{language.toUpperCase()}</option>
								{/each}
							</select>
						</div>

						<!-- Type Filter -->
						<div class="group">
							<label class="label pb-2" for="type">
								<span class="label-text flex items-center gap-2 text-sm font-medium text-base-content/80">
									🎨 Typ
								</span>
							</label>
							<select 
								id="type" 
								class="select select-bordered w-full bg-base-50 transition-all duration-200 hover:bg-base-100 focus:border-primary focus:bg-base-100 focus:shadow-lg focus:shadow-primary/10" 
								bind:value={selectedType}
							>
								<option value="">Alle Typen</option>
								{#each metadata.types as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</div>

						<!-- Event Type Filter -->
						<div class="group">
							<label class="label pb-2" for="eventType">
								<span class="label-text flex items-center gap-2 text-sm font-medium text-base-content/80">
									🎉 Anlass
								</span>
							</label>
							<select 
								id="eventType" 
								class="select select-bordered w-full bg-base-50 transition-all duration-200 hover:bg-base-100 focus:border-info focus:bg-base-100 focus:shadow-lg focus:shadow-info/10" 
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
								<span class="label-text flex items-center gap-2 text-sm font-medium text-base-content/80">
									📏 Länge
								</span>
							</label>
							<select 
								id="length" 
								class="select select-bordered w-full bg-base-50 transition-all duration-200 hover:bg-base-100 focus:border-secondary focus:bg-base-100 focus:shadow-lg focus:shadow-secondary/10" 
								bind:value={selectedLength}
							>
								<option value="">Alle Längen</option>
								{#each metadata.lengths as length}
									<option value={length}>{length}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- Additional Filters -->
				<div>
					<h4 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-base-content/70">
						<div class="h-2 w-2 rounded-full bg-secondary"></div>
						Spezielle Filter
					</h4>
					<div class="grid grid-cols-1 gap-6">
						<!-- Belated Filter -->
						<div class="group">
							<label class="label pb-2" for="belated">
								<span class="label-text flex items-center gap-2 text-sm font-medium text-base-content/80">
									⏰ Nachträglich
								</span>
							</label>
							<select 
								id="belated" 
								class="select select-bordered w-full bg-base-50 transition-all duration-200 hover:bg-base-100 focus:border-accent focus:bg-base-100 focus:shadow-lg focus:shadow-accent/10" 
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
<div class="overflow-x-auto rounded-lg border border-base-300 bg-base-100 shadow-sm">
	<div class="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-4 py-3">
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
		
		<div class="text-sm text-base-content/70">
			{releasedWishes.length} von {data.total} Einträgen
		</div>
	</div>

	<div class="min-h-[400px]">
		<table class="table table-zebra w-full">
			<thead class="bg-base-200 text-base-content">
				<tr>
					<th class="w-12"></th>
					<th class="cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors hover:bg-base-200">
						Typ/Anlass
					</th>
					<th class="cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors hover:bg-base-200">
						Text
					</th>
					<th class="cursor-pointer w-16 px-3 py-4 text-center text-sm font-semibold transition-colors hover:bg-base-200">
						Lang
					</th>
					<th class="cursor-pointer px-3 py-4 text-left text-sm font-semibold transition-colors hover:bg-base-200">
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
									<div class="text-xs text-base-content/70">
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
									<div class="text-xs text-base-content/50 mt-1">
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
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
										<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
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
	<div class="flex justify-center mt-6">
		<div class="join">
			<button 
				class="join-item btn" 
				class:btn-disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				«
			</button>
			
			{#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
				const startPage = Math.max(1, currentPage - 2);
				return startPage + i;
			}) as pageNum}
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