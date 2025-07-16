<script lang="ts">
	import { onMount } from 'svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { activeWishLanguages, loadActiveWishLanguages } from '$lib/stores/wishLanguages';

	interface WishSimilarityResult {
		id: string;
		text: string;
		type: string;
		eventType: string;
		status: string;
		language: string;
		relations: string[];
		ageGroups: string[];
		createdAt?: string;
		similarWishes: Array<{
			id: string;
			text: string;
			similarity: number;
			type: string;
			eventType: string;
		}>;
		duplicateStatus: 'duplicate' | 'similar' | 'unique';
		maxSimilarity: number;
	}

	let wishes = $state<WishSimilarityResult[]>([]);
	let loading = $state(false);
	let error = $state('');
	let analysisProgress = $state(0);
	let selectedTab = $state('duplicates');
	let cacheHits = $state(0);
	let totalProcessed = $state(0);
	let expandedWishes = $state(new Set<string>());
	let selectedWishes = $state(new Set<string>());
	let showDeleteModal = $state(false);
	let showAutoCleanModal = $state(false);
	let showSimilarWishDeleteModal = $state(false);
	let similarWishToDelete = $state<string | null>(null);
	let autoCleanThreshold = $state(90);
	let isDeleting = $state(false);

	// Request debouncing
	let analysisAbortController: AbortController | null = null;
	let analysisTimeout: NodeJS.Timeout | null = null;

	// Create a reactive store for the current locale
	let currentLocale = $state(getLocale());

	// Periodically check for locale changes
	let localeCheckInterval: NodeJS.Timeout;

	// Filter by language only (for statistics)
	const wishesForCurrentLanguage = $derived(
		wishes.filter((wish) => wish.language === currentLocale)
	);

	const filteredWishes = $derived(
		wishesForCurrentLanguage.filter((wish) => {
			let matchesTab = false;
			if (selectedTab === 'duplicates') matchesTab = wish.duplicateStatus === 'duplicate';
			else if (selectedTab === 'similar') matchesTab = wish.duplicateStatus === 'similar';
			else if (selectedTab === 'unique') matchesTab = wish.duplicateStatus === 'unique';
			else matchesTab = true;

			return matchesTab;
		})
	);

	// Pagination state
	let currentPage = $state(1);
	const pageSize = $state(50);
	const totalPages = $derived(Math.ceil(filteredWishes.length / pageSize));
	const paginatedWishes = $derived(
		filteredWishes.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	onMount(() => {
		loadActiveWishLanguages();
		analyzeAllWishes();

		// Check for locale changes every 100ms
		localeCheckInterval = setInterval(() => {
			const newLocale = getLocale();
			if (newLocale !== currentLocale) {
				currentLocale = newLocale;
			}
		}, 100);

		// Cleanup interval on component destroy
		return () => {
			if (localeCheckInterval) {
				clearInterval(localeCheckInterval);
			}
		};
	});

	function debouncedAnalyze() {
		// Cancel any pending analysis
		if (analysisTimeout) {
			clearTimeout(analysisTimeout);
		}

		// Abort any ongoing request
		if (analysisAbortController) {
			analysisAbortController.abort();
		}

		// Set up new analysis with debouncing
		analysisTimeout = setTimeout(() => {
			analyzeAllWishes();
		}, 300);
	}

	async function analyzeAllWishes() {
		// Cancel any pending timeout
		if (analysisTimeout) {
			clearTimeout(analysisTimeout);
			analysisTimeout = null;
		}

		// Abort any ongoing request
		if (analysisAbortController) {
			analysisAbortController.abort();
		}

		// Create new abort controller
		analysisAbortController = new AbortController();

		loading = true;
		error = '';
		analysisProgress = 0;
		wishes = [];
		currentPage = 1; // Reset pagination
		cacheHits = 0;
		totalProcessed = 0;

		try {
			const response = await fetch('/api/wishes/similarity/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					language: currentLocale
				}),
				signal: analysisAbortController.signal
			});

			if (!response.ok) {
				throw new Error('Failed to analyze wishes');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					// Check if request was aborted
					if (analysisAbortController.signal.aborted) {
						reader.cancel();
						break;
					}

					const chunk = decoder.decode(value);
					const lines = chunk.split('\n');

					for (const line of lines) {
						if (line.trim()) {
							try {
								const data = JSON.parse(line);

								if (data.type === 'progress') {
									analysisProgress = data.progress;
								} else if (data.type === 'result') {
									console.log(
										'Received wish:',
										data.wish.id,
										'cached:',
										data.cached,
										'relations:',
										data.wish.relations,
										'ageGroups:',
										data.wish.ageGroups
									);
									wishes = [...wishes, data.wish];
									totalProcessed++;
									if (data.cached) {
										cacheHits++;
									}
								} else if (data.type === 'error') {
									error = data.error;
									break;
								}
							} catch {
								// Ignore malformed JSON lines
							}
						}
					}
				}
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				// Request was aborted, don't show error
				console.log('Analysis request was aborted');
			} else {
				error = err instanceof Error ? err.message : 'An error occurred';
			}
		} finally {
			loading = false;
			analysisAbortController = null;
		}
	}

	// Make counts reactive based on wishes for current language (not filtered by tab)
	const duplicateCount = $derived(
		wishesForCurrentLanguage.filter((w) => w.duplicateStatus === 'duplicate').length
	);
	const similarCount = $derived(
		wishesForCurrentLanguage.filter((w) => w.duplicateStatus === 'similar').length
	);
	const uniqueCount = $derived(
		wishesForCurrentLanguage.filter((w) => w.duplicateStatus === 'unique').length
	);

	// Total count for current language
	const totalCount = $derived(wishesForCurrentLanguage.length);

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.9) return 'text-red-600';
		if (similarity >= 0.7) return 'text-yellow-600';
		return 'text-green-600';
	}

	function formatRelations(relations: string[]): string {
		const relationMap: Record<string, string> = {
			friend: 'Freund/in',
			family: 'Familie',
			partner: 'Partner/in',
			colleague: 'Kollege/in'
		};
		return relations.map((rel) => relationMap[rel] || rel).join(', ');
	}

	function formatAgeGroups(ageGroups: string[]): string {
		const ageGroupMap: Record<string, string> = {
			all: 'Alle',
			young: 'Jung (18-35)',
			middle: 'Mittleres Alter (36-55)',
			senior: 'Senior (55+)'
		};
		return ageGroups.map((age) => ageGroupMap[age] || age).join(', ');
	}

	function formatWishType(type: string): string {
		const typeMap: Record<string, string> = {
			normal: 'Normal',
			herzlich: 'Herzlich',
			humorvoll: 'Humorvoll'
		};
		return typeMap[type] || type;
	}

	function formatEventType(eventType: string): string {
		const eventMap: Record<string, string> = {
			birthday: 'Geburtstag',
			anniversary: 'Jubiläum',
			custom: 'Sonstiges'
		};
		return eventMap[eventType] || eventType;
	}

	function formatLanguage(language: string): string {
		return $activeWishLanguages.find((lang) => lang.code === language)?.name || language;
	}

	async function exportResults() {
		const exportData = {
			analysis_date: new Date().toISOString(),
			summary: {
				total: wishes.length,
				duplicates: duplicateCount,
				similar: similarCount,
				unique: uniqueCount
			},
			wishes: wishes.map((wish) => ({
				id: wish.id,
				text: wish.text.substring(0, 100) + '...',
				type: wish.type,
				eventType: wish.eventType,
				status: wish.status,
				language: wish.language,
				relations: wish.relations || [],
				ageGroups: wish.ageGroups || [],
				duplicateStatus: wish.duplicateStatus,
				maxSimilarity: wish.maxSimilarity,
				similarWishesCount: wish.similarWishes.length,
				topSimilarWishes: wish.similarWishes.slice(0, 3).map((sw) => ({
					id: sw.id,
					similarity: sw.similarity,
					text: sw.text.substring(0, 50) + '...'
				}))
			}))
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `wish-similarity-analysis-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function toggleWishExpansion(wishId: string) {
		if (expandedWishes.has(wishId)) {
			expandedWishes.delete(wishId);
		} else {
			expandedWishes.add(wishId);
		}
		expandedWishes = new Set(expandedWishes);
	}

	function toggleWishSelection(wishId: string) {
		if (selectedWishes.has(wishId)) {
			selectedWishes.delete(wishId);
		} else {
			selectedWishes.add(wishId);
		}
		selectedWishes = new Set(selectedWishes);
	}

	function selectAllVisible() {
		paginatedWishes.forEach((wish) => selectedWishes.add(wish.id));
		selectedWishes = new Set(selectedWishes);
	}

	function switchTab(newTab: string) {
		selectedTab = newTab;
		currentPage = 1; // Reset to first page when switching tabs
	}

	function clearSelection() {
		selectedWishes.clear();
		selectedWishes = new Set(selectedWishes);
	}

	async function deleteSelectedWishes() {
		if (selectedWishes.size === 0) return;

		isDeleting = true;
		try {
			const wishIds = Array.from(selectedWishes);
			const response = await fetch('/api/wishes/bulk-delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ wishIds })
			});

			if (response.ok) {
				// Remove deleted wishes from local state
				wishes = wishes.filter((w) => !selectedWishes.has(w.id));
				selectedWishes.clear();
				selectedWishes = new Set(selectedWishes);
				showDeleteModal = false;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Fehler beim Löschen der Wünsche';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler aufgetreten';
		} finally {
			isDeleting = false;
		}
	}

	async function autoCleanSimilarWishes() {
		if (autoCleanThreshold < 70 || autoCleanThreshold > 100) return;

		isDeleting = true;
		try {
			// Find all wishes that should be deleted based on similarity threshold
			const wishesToDelete = new Set<string>();

			wishes.forEach((wish) => {
				if (wish.maxSimilarity >= autoCleanThreshold / 100) {
					// Keep the first occurrence, delete similar ones
					const similarGroup = [
						wish,
						...wish.similarWishes.map((sw) => wishes.find((w) => w.id === sw.id))
					]
						.filter((w): w is WishSimilarityResult => w !== undefined)
						.sort(
							(a, b) =>
								new Date(a.createdAt || '0').getTime() - new Date(b.createdAt || '0').getTime()
						);

					// Delete all but the first (oldest) wish
					similarGroup.slice(1).forEach((w) => wishesToDelete.add(w.id));
				}
			});

			if (wishesToDelete.size === 0) {
				error = 'Keine Wünsche gefunden, die dem Ähnlichkeits-Schwellenwert entsprechen';
				isDeleting = false;
				return;
			}

			const response = await fetch('/api/wishes/bulk-delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ wishIds: Array.from(wishesToDelete) })
			});

			if (response.ok) {
				// Remove deleted wishes from local state
				wishes = wishes.filter((w) => !wishesToDelete.has(w.id));
				showAutoCleanModal = false;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Fehler beim Auto-Clean';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler aufgetreten';
		} finally {
			isDeleting = false;
		}
	}

	function getAutoCleanCount(): number {
		const wishesToDelete = new Set<string>();

		wishes.forEach((wish) => {
			if (wish.maxSimilarity >= autoCleanThreshold / 100) {
				// Find similar wishes and count how many would be deleted
				wish.similarWishes.forEach((sw) => {
					if (sw.similarity >= autoCleanThreshold / 100) {
						wishesToDelete.add(sw.id);
					}
				});
			}
		});

		return wishesToDelete.size;
	}

	function showSimilarWishDeleteConfirmation(wishId: string) {
		similarWishToDelete = wishId;
		showSimilarWishDeleteModal = true;
	}

	async function confirmDeleteSimilarWish() {
		if (!similarWishToDelete) return;

		isDeleting = true;
		try {
			const response = await fetch('/api/wishes/bulk-delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ wishIds: [similarWishToDelete] })
			});

			if (response.ok) {
				// Remove the deleted wish from all similar wishes lists
				wishes = wishes
					.map((wish) => ({
						...wish,
						similarWishes: wish.similarWishes.filter((sw) => sw.id !== similarWishToDelete)
					}))
					.filter((wish) => wish.id !== similarWishToDelete); // Also remove the wish itself if it's in the main list

				showSimilarWishDeleteModal = false;
				similarWishToDelete = null;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Fehler beim Löschen des Wunsches';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler aufgetreten';
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Similarity Analysis - Wish Factory</title>
</svelte:head>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Ähnlichkeitsanalyse</h1>
			<p class="text-base-content/70 mt-2">
				Analysieren und verwalten Sie ähnliche Wünsche in Ihrer Sammlung
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button class="btn btn-outline btn-sm" onclick={debouncedAnalyze} disabled={loading}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-4 w-4"
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
				Neu analysieren
			</button>
			<button
				class="btn btn-error btn-sm"
				onclick={() => (showAutoCleanModal = true)}
				disabled={loading || wishes.length === 0}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-4 w-4"
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
				Auto-Clean
			</button>
			<button
				class="btn btn-outline btn-sm"
				onclick={exportResults}
				disabled={loading || wishes.length === 0}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
					/>
				</svg>
				Ergebnisse exportieren
			</button>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<h2 class="card-title">Analysiere Wünsche...</h2>
						<p class="text-base-content/70">Führe Ähnlichkeitsanalyse für alle Wünsche durch</p>
					</div>
					<button
						class="btn btn-ghost btn-sm"
						onclick={() => {
							if (analysisAbortController) {
								analysisAbortController.abort();
							}
						}}
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
						Abbrechen
					</button>
				</div>
				<progress class="progress progress-primary w-full" value={analysisProgress} max="100"
				></progress>
				<div class="flex items-center justify-between">
					<p class="text-base-content/70 text-sm">{analysisProgress}% abgeschlossen</p>
					{#if totalProcessed > 0}
						<p class="text-base-content/70 text-sm">
							Cache-Treffer: {cacheHits}/{totalProcessed}
							<span class="text-success">({Math.round((cacheHits / totalProcessed) * 100)}%)</span>
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-error">
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
			<div>
				<h3 class="font-bold">Analysefehler</h3>
				<div class="text-xs">{error}</div>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if wishes.length > 0}
		<!-- Statistics -->
		<div class="stats stats-vertical lg:stats-horizontal w-full shadow">
			<div class="stat">
				<div class="stat-title">Gesamt</div>
				<div class="stat-value text-primary">{totalCount}</div>
				<div class="stat-desc">
					{formatLanguage(currentLocale)} Wünsche
				</div>
			</div>
			<div class="stat">
				<div class="stat-title">Duplikate</div>
				<div class="stat-value text-error">
					{duplicateCount}
				</div>
				<div class="stat-desc">Sehr ähnlich (≥90%)</div>
			</div>
			<div class="stat">
				<div class="stat-title">Ähnlich</div>
				<div class="stat-value text-warning">
					{similarCount}
				</div>
				<div class="stat-desc">Mäßig ähnlich (≥70%)</div>
			</div>
			<div class="stat">
				<div class="stat-title">Einzigartig</div>
				<div class="stat-value text-success">
					{uniqueCount}
				</div>
				<div class="stat-desc">Unter 70% Ähnlichkeit</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="tabs tabs-boxed">
			<button
				class="tab {selectedTab === 'duplicates' ? 'tab-active' : ''}"
				onclick={() => switchTab('duplicates')}
			>
				Duplikate ({duplicateCount})
			</button>
			<button
				class="tab {selectedTab === 'similar' ? 'tab-active' : ''}"
				onclick={() => switchTab('similar')}
			>
				Ähnlich ({similarCount})
			</button>
			<button
				class="tab {selectedTab === 'unique' ? 'tab-active' : ''}"
				onclick={() => switchTab('unique')}
			>
				Einzigartig ({uniqueCount})
			</button>
		</div>

		<!-- Bulk Actions -->
		{#if selectedWishes.size > 0}
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
				<div>
					<h3 class="font-bold">{selectedWishes.size} Wünsche ausgewählt</h3>
					<div class="text-xs">Sie können die ausgewählten Wünsche löschen.</div>
				</div>
				<div class="flex gap-2">
					<button class="btn btn-error btn-sm" onclick={() => (showDeleteModal = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1 h-4 w-4"
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
						Löschen
					</button>
					<button class="btn btn-ghost btn-sm" onclick={clearSelection}>Auswahl aufheben</button>
				</div>
			</div>
		{/if}

		<!-- Selection Controls -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex gap-2">
				<button class="btn btn-outline btn-xs" onclick={selectAllVisible}>
					Alle auf dieser Seite auswählen
				</button>
				{#if selectedWishes.size > 0}
					<button class="btn btn-ghost btn-xs" onclick={clearSelection}>
						Auswahl aufheben ({selectedWishes.size})
					</button>
				{/if}
			</div>
			<div class="text-base-content/70 text-sm">
				{filteredWishes.length} Wünsche gesamt • Seite {currentPage} von {totalPages}
			</div>
		</div>

		<!-- Wishes List -->
		<div class="space-y-4">
			{#if filteredWishes.length === 0}
				<!-- Empty State Message -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body py-12 text-center">
						<div class="mb-4 flex justify-center">
							{#if selectedTab === 'duplicates'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-success h-16 w-16"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{:else if selectedTab === 'similar'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-success h-16 w-16"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-info h-16 w-16"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{/if}
						</div>
						<h3 class="mb-2 text-xl font-bold">
							{#if selectedTab === 'duplicates'}
								Keine Duplikate gefunden
							{:else if selectedTab === 'similar'}
								Keine ähnlichen Wünsche gefunden
							{:else}
								Alle Wünsche sind einzigartig
							{/if}
						</h3>
						<p class="text-base-content/70 mx-auto max-w-md">
							{#if selectedTab === 'duplicates'}
								Es wurden keine Wünsche mit einer Ähnlichkeit von 90% oder höher gefunden. Ihre
								Sammlung enthält keine exakten Duplikate.
							{:else if selectedTab === 'similar'}
								Es wurden keine Wünsche mit einer Ähnlichkeit zwischen 70% und 89% gefunden. Ihre
								Sammlung ist gut diversifiziert.
							{:else}
								Alle Ihre Wünsche sind einzigartig und haben eine Ähnlichkeit von weniger als 70%
								zueinander.
							{/if}
						</p>
						<div class="mt-6">
							<button
								class="btn btn-primary btn-outline"
								onclick={() => (selectedTab = 'duplicates')}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-4 w-4"
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
								Übersicht anzeigen
							</button>
						</div>
					</div>
				</div>
			{:else}
				{#each paginatedWishes as wish (wish.id)}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex items-start gap-3">
								<!-- Selection Checkbox -->
								<label class="cursor-pointer">
									<input
										type="checkbox"
										class="checkbox checkbox-primary"
										checked={selectedWishes.has(wish.id)}
										onchange={() => toggleWishSelection(wish.id)}
									/>
								</label>

								<!-- Main Content -->
								<div class="flex-1">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center justify-between">
												<h2 class="card-title flex-1 text-lg">
													{expandedWishes.has(wish.id)
														? wish.text
														: `${wish.text.substring(0, 80)}...`}
												</h2>
												<div class="flex items-center gap-3">
													<!-- Prominenter Ähnlichkeitsstatus -->
													<div class="flex items-center gap-2">
														{#if wish.duplicateStatus === 'duplicate'}
															<div
																class="bg-error/10 flex items-center gap-1 rounded-full px-3 py-1"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="text-error h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		stroke-width="2"
																		d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
																	/>
																</svg>
																<span class="text-error text-sm font-bold">Duplikat</span>
																<span class="text-error font-mono text-xs"
																	>{Math.round(wish.maxSimilarity * 100)}%</span
																>
															</div>
														{:else if wish.duplicateStatus === 'similar'}
															<div
																class="bg-warning/10 flex items-center gap-1 rounded-full px-3 py-1"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="text-warning h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		stroke-width="2"
																		d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
																	/>
																</svg>
																<span class="text-warning text-sm font-bold">Ähnlich</span>
																<span class="text-warning font-mono text-xs"
																	>{Math.round(wish.maxSimilarity * 100)}%</span
																>
															</div>
														{:else}
															<div
																class="bg-success/10 flex items-center gap-1 rounded-full px-3 py-1"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="text-success h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		stroke-width="2"
																		d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
																	/>
																</svg>
																<span class="text-success text-sm font-bold">Einzigartig</span>
															</div>
														{/if}
													</div>
													<button
														class="btn btn-ghost btn-xs"
														onclick={() => toggleWishExpansion(wish.id)}
														aria-label={expandedWishes.has(wish.id)
															? 'Wunsch zuklappen'
															: 'Wunsch erweitern'}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4 transition-transform {expandedWishes.has(wish.id)
																? 'rotate-180'
																: ''}"
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
												</div>
											</div>
											<!-- Organisierte Tag-Struktur -->
											<div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
												<!-- Linke Spalte: Grunddaten -->
												<div class="space-y-2">
													<div class="flex items-center gap-2">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="text-info h-4 w-4"
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
														<span class="text-info text-xs font-semibold">Eigenschaften</span>
													</div>
													<div class="flex flex-wrap gap-1 pl-6">
														<span class="badge badge-info badge-xs"
															>{formatWishType(wish.type)}</span
														>
														<span class="badge badge-success badge-xs"
															>{formatEventType(wish.eventType)}</span
														>
														<span class="badge badge-accent badge-xs"
															>{formatLanguage(wish.language)}</span
														>
														<span class="badge badge-warning badge-xs">{wish.status}</span>
													</div>
												</div>

												<!-- Rechte Spalte: Zielgruppen -->
												<div class="space-y-2">
													<div class="flex items-center gap-2">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="text-primary h-4 w-4"
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
														<span class="text-primary text-xs font-semibold">Zielgruppen</span>
													</div>
													<div class="flex flex-wrap gap-1 pl-6">
														{#if wish.relations && wish.relations.length > 0}
															{#each wish.relations as relation (relation)}
																<span class="badge badge-primary badge-outline badge-xs"
																	>{formatRelations([relation])}</span
																>
															{/each}
														{:else}
															<span class="badge badge-ghost badge-xs text-base-content/50"
																>Keine Beziehungen</span
															>
														{/if}
														<!-- Trenner -->
														{#if wish.relations && wish.relations.length > 0 && wish.ageGroups && wish.ageGroups.length > 0}
															<span class="text-base-content/30 text-xs">|</span>
														{/if}
														{#if wish.ageGroups && wish.ageGroups.length > 0}
															{#each wish.ageGroups as ageGroup (ageGroup)}
																<span class="badge badge-secondary badge-outline badge-xs"
																	>{formatAgeGroups([ageGroup])}</span
																>
															{/each}
														{:else}
															<span class="badge badge-ghost badge-xs text-base-content/50"
																>Keine Altersgruppen</span
															>
														{/if}
													</div>
												</div>
											</div>
										</div>
									</div>

									<!-- Expanded Content -->
									{#if expandedWishes.has(wish.id)}
										<div class="mt-4 space-y-4">
											<!-- Individual Actions -->
											<div class="flex gap-2">
												<a href="/dashboard/wishes/{wish.id}" class="btn btn-outline btn-sm">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="mr-1 h-4 w-4"
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
													Anzeigen
												</a>
												<a href="/dashboard/wishes/{wish.id}/edit" class="btn btn-outline btn-sm">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="mr-1 h-4 w-4"
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
													class="btn btn-error btn-sm"
													onclick={() => {
														selectedWishes.clear();
														selectedWishes.add(wish.id);
														selectedWishes = new Set(selectedWishes);
														showDeleteModal = true;
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="mr-1 h-4 w-4"
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
													Löschen
												</button>
											</div>
										</div>
									{/if}

									{#if wish.similarWishes && wish.similarWishes.length > 0 && expandedWishes.has(wish.id)}
										<div class="mt-4">
											<h4 class="mb-3 font-medium">
												Ähnliche Wünsche ({wish.similarWishes.length})
											</h4>
											<div class="space-y-2">
												{#each wish.similarWishes as similar (similar.id)}
													<div
														class="bg-base-200 group hover:bg-base-300 flex items-center justify-between rounded-lg p-3 transition-colors"
													>
														<span class="flex-1 pr-4 text-sm">
															{similar.text}
														</span>
														<div class="flex items-center gap-2">
															<div class="badge badge-outline badge-sm">
																{similar.type} • {similar.eventType}
															</div>
															<span
																class="font-mono text-sm {getSimilarityColor(similar.similarity)}"
															>
																{Math.round(similar.similarity * 100)}%
															</span>
															<button
																class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content opacity-0 transition-opacity group-hover:opacity-100"
																onclick={() => showSimilarWishDeleteConfirmation(similar.id)}
																title="Ähnlichen Wunsch löschen"
																aria-label="Ähnlichen Wunsch löschen"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="h-3 w-3"
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
															</button>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Pagination Controls -->
		{#if filteredWishes.length > pageSize}
			<div class="mt-6 flex items-center justify-center gap-2">
				<div class="join">
					<button
						class="join-item btn btn-sm"
						onclick={() => (currentPage = 1)}
						disabled={currentPage === 1}
					>
						«
					</button>
					<button
						class="join-item btn btn-sm"
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
					>
						‹
					</button>

					{#if totalPages <= 7}
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
							<button
								class="join-item btn btn-sm {currentPage === page ? 'btn-active' : ''}"
								onclick={() => (currentPage = page)}
							>
								{page}
							</button>
						{/each}
					{:else if currentPage <= 3}
						{#each [1, 2, 3, 4] as page (page)}
							<button
								class="join-item btn btn-sm {currentPage === page ? 'btn-active' : ''}"
								onclick={() => (currentPage = page)}
							>
								{page}
							</button>
						{/each}
						<button class="join-item btn btn-sm btn-disabled">...</button>
						<button class="join-item btn btn-sm" onclick={() => (currentPage = totalPages)}>
							{totalPages}
						</button>
					{:else if currentPage >= totalPages - 2}
						<button class="join-item btn btn-sm" onclick={() => (currentPage = 1)}> 1 </button>
						<button class="join-item btn btn-sm btn-disabled">...</button>
						{#each [totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as page (page)}
							<button
								class="join-item btn btn-sm {currentPage === page ? 'btn-active' : ''}"
								onclick={() => (currentPage = page)}
							>
								{page}
							</button>
						{/each}
					{:else}
						<button class="join-item btn btn-sm" onclick={() => (currentPage = 1)}> 1 </button>
						<button class="join-item btn btn-sm btn-disabled">...</button>
						{#each [currentPage - 1, currentPage, currentPage + 1] as page (page)}
							<button
								class="join-item btn btn-sm {currentPage === page ? 'btn-active' : ''}"
								onclick={() => (currentPage = page)}
							>
								{page}
							</button>
						{/each}
						<button class="join-item btn btn-sm btn-disabled">...</button>
						<button class="join-item btn btn-sm" onclick={() => (currentPage = totalPages)}>
							{totalPages}
						</button>
					{/if}

					<button
						class="join-item btn btn-sm"
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
					>
						›
					</button>
					<button
						class="join-item btn btn-sm"
						onclick={() => (currentPage = totalPages)}
						disabled={currentPage === totalPages}
					>
						»
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wünsche löschen</h3>
			<p class="mb-4">
				Möchten Sie wirklich {selectedWishes.size}
				{selectedWishes.size === 1 ? 'Wunsch' : 'Wünsche'} löschen?
			</p>
			<div class="alert alert-warning mb-4">
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
				<button
					class="btn btn-ghost"
					onclick={() => (showDeleteModal = false)}
					disabled={isDeleting}
				>
					Abbrechen
				</button>
				<button class="btn btn-error" onclick={deleteSelectedWishes} disabled={isDeleting}>
					{#if isDeleting}
						<span class="loading loading-spinner loading-sm"></span>
						Lösche...
					{:else}
						Löschen
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Auto-Clean Modal -->
{#if showAutoCleanModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Auto-Clean Ähnlichkeits-Bereinigung</h3>
			<p class="mb-4">
				Automatisches Löschen von Wünschen mit hoher Ähnlichkeit. Es wird immer der älteste Wunsch
				beibehalten.
			</p>

			<div class="form-control mb-4">
				<label class="label" for="auto-clean-threshold">
					<span class="label-text">Ähnlichkeits-Schwellenwert:</span>
					<span class="label-text-alt">{autoCleanThreshold}%</span>
				</label>
				<input
					id="auto-clean-threshold"
					type="range"
					class="range range-primary"
					min="70"
					max="100"
					step="5"
					bind:value={autoCleanThreshold}
					aria-label="Ähnlichkeits-Schwellenwert in Prozent"
				/>
				<div class="mt-1 flex w-full justify-between px-2 text-xs">
					<span>70%</span>
					<span>85%</span>
					<span>100%</span>
				</div>
			</div>

			<div class="alert alert-info mb-4">
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
					<h4 class="font-bold">Vorschau</h4>
					<div class="text-sm">
						Etwa <strong>{getAutoCleanCount()}</strong> Wünsche würden bei {autoCleanThreshold}%
						Ähnlichkeit gelöscht.
					</div>
				</div>
			</div>

			{#if autoCleanThreshold >= 95}
				<div class="alert alert-warning mb-4">
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
					<span>Hoher Schwellenwert! Es werden nur sehr ähnliche Wünsche gelöscht.</span>
				</div>
			{/if}

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => (showAutoCleanModal = false)}
					disabled={isDeleting}
				>
					Abbrechen
				</button>
				<button
					class="btn btn-error"
					onclick={autoCleanSimilarWishes}
					disabled={isDeleting || getAutoCleanCount() === 0}
				>
					{#if isDeleting}
						<span class="loading loading-spinner loading-sm"></span>
						Bereinige...
					{:else}
						Auto-Clean starten
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Similar Wish Delete Confirmation Modal -->
{#if showSimilarWishDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Ähnlichen Wunsch löschen</h3>
			<p class="mb-4">Möchten Sie diesen ähnlichen Wunsch wirklich löschen?</p>
			<div class="alert alert-warning mb-4">
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
				<button
					class="btn btn-ghost"
					onclick={() => (showSimilarWishDeleteModal = false)}
					disabled={isDeleting}
				>
					Abbrechen
				</button>
				<button class="btn btn-error" onclick={confirmDeleteSimilarWish} disabled={isDeleting}>
					{#if isDeleting}
						<span class="loading loading-spinner loading-sm"></span>
						Lösche...
					{:else}
						Löschen
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
