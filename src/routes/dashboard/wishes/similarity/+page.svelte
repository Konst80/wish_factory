<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';

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

	let wishes: WishSimilarityResult[] = [];
	let loading = false;
	let error = '';
	let analysisProgress = 0;
	let duplicateCount = 0;
	let similarCount = 0;
	let uniqueCount = 0;
	let selectedTab = 'all';
	let expandedWishes = new Set<string>();
	let selectedWishes = new Set<string>();
	let showDeleteModal = false;
	let showAutoCleanModal = false;
	let showSimilarWishDeleteModal = false;
	let similarWishToDelete: string | null = null;
	let autoCleanThreshold = 90;
	let isDeleting = false;

	$: filteredWishes = wishes.filter(wish => {
		if (selectedTab === 'duplicates') return wish.duplicateStatus === 'duplicate';
		if (selectedTab === 'similar') return wish.duplicateStatus === 'similar';
		if (selectedTab === 'unique') return wish.duplicateStatus === 'unique';
		return true;
	});

	onMount(() => {
		analyzeAllWishes();
	});

	async function analyzeAllWishes() {
		loading = true;
		error = '';
		analysisProgress = 0;
		wishes = [];

		try {
			const response = await fetch('/api/wishes/similarity/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
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

					const chunk = decoder.decode(value);
					const lines = chunk.split('\n');

					for (const line of lines) {
						if (line.trim()) {
							try {
								const data = JSON.parse(line);
								
								if (data.type === 'progress') {
									analysisProgress = data.progress;
								} else if (data.type === 'result') {
									console.log('Received wish:', data.wish.id, 'relations:', data.wish.relations, 'ageGroups:', data.wish.ageGroups);
									wishes = [...wishes, data.wish];
									updateCounts();
								}
							} catch (e) {
								// Ignore malformed JSON lines
							}
						}
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function updateCounts() {
		duplicateCount = wishes.filter(w => w.duplicateStatus === 'duplicate').length;
		similarCount = wishes.filter(w => w.duplicateStatus === 'similar').length;
		uniqueCount = wishes.filter(w => w.duplicateStatus === 'unique').length;
	}

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.9) return 'text-red-600';
		if (similarity >= 0.7) return 'text-yellow-600';
		return 'text-green-600';
	}

	function getBadgeClass(status: string): string {
		switch (status) {
			case 'duplicate': return 'badge-error';
			case 'similar': return 'badge-warning';
			default: return 'badge-success';
		}
	}

	function formatRelations(relations: string[]): string {
		const relationMap: Record<string, string> = {
			'friend': 'Freund/in',
			'family': 'Familie',
			'partner': 'Partner/in',
			'colleague': 'Kollege/in'
		};
		return relations.map(rel => relationMap[rel] || rel).join(', ');
	}

	function formatAgeGroups(ageGroups: string[]): string {
		const ageGroupMap: Record<string, string> = {
			'all': 'Alle',
			'young': 'Jung (18-35)',
			'middle': 'Mittleres Alter (36-55)',
			'senior': 'Senior (55+)'
		};
		return ageGroups.map(age => ageGroupMap[age] || age).join(', ');
	}

	function formatWishType(type: string): string {
		const typeMap: Record<string, string> = {
			'normal': 'Normal',
			'herzlich': 'Herzlich',
			'humorvoll': 'Humorvoll'
		};
		return typeMap[type] || type;
	}

	function formatEventType(eventType: string): string {
		const eventMap: Record<string, string> = {
			'birthday': 'Geburtstag',
			'anniversary': 'Jubiläum',
			'custom': 'Sonstiges'
		};
		return eventMap[eventType] || eventType;
	}

	function formatLanguage(language: string): string {
		const languageMap: Record<string, string> = {
			'de': 'Deutsch',
			'en': 'English'
		};
		return languageMap[language] || language;
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
			wishes: wishes.map(wish => ({
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
				topSimilarWishes: wish.similarWishes.slice(0, 3).map(sw => ({
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
		expandedWishes = expandedWishes;
	}

	function toggleWishSelection(wishId: string) {
		if (selectedWishes.has(wishId)) {
			selectedWishes.delete(wishId);
		} else {
			selectedWishes.add(wishId);
		}
		selectedWishes = selectedWishes;
	}

	function selectAllVisible() {
		filteredWishes.forEach(wish => selectedWishes.add(wish.id));
		selectedWishes = selectedWishes;
	}

	function clearSelection() {
		selectedWishes.clear();
		selectedWishes = selectedWishes;
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
				wishes = wishes.filter(w => !selectedWishes.has(w.id));
				selectedWishes.clear();
				selectedWishes = selectedWishes;
				updateCounts();
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
			
			wishes.forEach(wish => {
				if (wish.maxSimilarity >= (autoCleanThreshold / 100)) {
					// Keep the first occurrence, delete similar ones
					const similarGroup = [wish, ...wish.similarWishes.map(sw => 
						wishes.find(w => w.id === sw.id)
					)].filter((w): w is WishSimilarityResult => w !== undefined).sort((a, b) => 
						new Date(a.createdAt || '0').getTime() - new Date(b.createdAt || '0').getTime()
					);
					
					// Delete all but the first (oldest) wish
					similarGroup.slice(1).forEach(w => wishesToDelete.add(w.id));
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
				wishes = wishes.filter(w => !wishesToDelete.has(w.id));
				updateCounts();
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
		
		wishes.forEach(wish => {
			if (wish.maxSimilarity >= (autoCleanThreshold / 100)) {
				// Find similar wishes and count how many would be deleted
				wish.similarWishes.forEach(sw => {
					if (sw.similarity >= (autoCleanThreshold / 100)) {
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
				wishes = wishes.map(wish => ({
					...wish,
					similarWishes: wish.similarWishes.filter(sw => sw.id !== similarWishToDelete)
				})).filter(wish => wish.id !== similarWishToDelete); // Also remove the wish itself if it's in the main list
				
				// Update counts
				updateCounts();
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

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Ähnlichkeitsanalyse</h1>
			<p class="text-base-content/70 mt-2">Analysieren und verwalten Sie ähnliche Wünsche in Ihrer Sammlung</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" on:click={analyzeAllWishes} disabled={loading}>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Neu analysieren
			</button>
			<button class="btn btn-error btn-sm" on:click={() => showAutoCleanModal = true} disabled={loading || wishes.length === 0}>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				Auto-Clean
			</button>
			<button class="btn btn-outline btn-sm" on:click={exportResults} disabled={loading || wishes.length === 0}>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
				</svg>
				Ergebnisse exportieren
			</button>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Analysiere Wünsche...</h2>
				<p class="text-base-content/70">Führe Ähnlichkeitsanalyse für alle Wünsche durch</p>
				<progress class="progress progress-primary w-full" value={analysisProgress} max="100"></progress>
				<p class="text-sm text-base-content/70">{analysisProgress}% abgeschlossen</p>
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-error">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
		<div class="stats stats-vertical lg:stats-horizontal shadow w-full">
			<div class="stat">
				<div class="stat-title">Gesamt</div>
				<div class="stat-value text-primary">{wishes.length}</div>
				<div class="stat-desc">Alle Wünsche</div>
			</div>
			<div class="stat">
				<div class="stat-title">Duplikate</div>
				<div class="stat-value text-error">{duplicateCount}</div>
				<div class="stat-desc">Sehr ähnlich (≥90%)</div>
			</div>
			<div class="stat">
				<div class="stat-title">Ähnlich</div>
				<div class="stat-value text-warning">{similarCount}</div>
				<div class="stat-desc">Mäßig ähnlich (≥70%)</div>
			</div>
			<div class="stat">
				<div class="stat-title">Einzigartig</div>
				<div class="stat-value text-success">{uniqueCount}</div>
				<div class="stat-desc">Unter 70% Ähnlichkeit</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="tabs tabs-boxed">
			<button class="tab {selectedTab === 'all' ? 'tab-active' : ''}" on:click={() => selectedTab = 'all'}>
				Alle ({wishes.length})
			</button>
			<button class="tab {selectedTab === 'duplicates' ? 'tab-active' : ''}" on:click={() => selectedTab = 'duplicates'}>
				Duplikate ({duplicateCount})
			</button>
			<button class="tab {selectedTab === 'similar' ? 'tab-active' : ''}" on:click={() => selectedTab = 'similar'}>
				Ähnlich ({similarCount})
			</button>
			<button class="tab {selectedTab === 'unique' ? 'tab-active' : ''}" on:click={() => selectedTab = 'unique'}>
				Einzigartig ({uniqueCount})
			</button>
		</div>

		<!-- Bulk Actions -->
		{#if selectedWishes.size > 0}
			<div class="alert alert-info">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h3 class="font-bold">{selectedWishes.size} Wünsche ausgewählt</h3>
					<div class="text-xs">Sie können die ausgewählten Wünsche löschen.</div>
				</div>
				<div class="flex gap-2">
					<button class="btn btn-error btn-sm" on:click={() => showDeleteModal = true}>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Löschen
					</button>
					<button class="btn btn-ghost btn-sm" on:click={clearSelection}>Auswahl aufheben</button>
				</div>
			</div>
		{/if}

		<!-- Selection Controls -->
		<div class="flex justify-between items-center mb-4">
			<div class="flex gap-2">
				<button class="btn btn-outline btn-xs" on:click={selectAllVisible}>
					Alle sichtbaren auswählen
				</button>
				{#if selectedWishes.size > 0}
					<button class="btn btn-ghost btn-xs" on:click={clearSelection}>
						Auswahl aufheben ({selectedWishes.size})
					</button>
				{/if}
			</div>
			<div class="text-sm text-base-content/70">
				{filteredWishes.length} Wünsche angezeigt
			</div>
		</div>

		<!-- Wishes List -->
		<div class="space-y-4">
			{#each filteredWishes as wish}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="flex items-start gap-3">
							<!-- Selection Checkbox -->
							<label class="cursor-pointer">
								<input 
									type="checkbox" 
									class="checkbox checkbox-primary"
									checked={selectedWishes.has(wish.id)}
									on:change={() => toggleWishSelection(wish.id)}
								/>
							</label>

							<!-- Main Content -->
							<div class="flex-1">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<div class="flex items-center">
											<h2 class="card-title text-lg flex-1">
												{expandedWishes.has(wish.id) ? wish.text : `${wish.text.substring(0, 80)}...`}
											</h2>
											<button 
												class="btn btn-ghost btn-xs ml-2"
												on:click={() => toggleWishExpansion(wish.id)}
												aria-label={expandedWishes.has(wish.id) ? 'Wunsch zuklappen' : 'Wunsch erweitern'}
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform {expandedWishes.has(wish.id) ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										</div>
										<div class="flex flex-wrap gap-2 mt-1">
											<span class="badge badge-info badge-sm">{formatWishType(wish.type)}</span>
											<span class="badge badge-success badge-sm">{formatEventType(wish.eventType)}</span>
											<span class="badge badge-accent badge-sm">{formatLanguage(wish.language)}</span>
											<span class="badge badge-warning badge-sm">{wish.status}</span>
										</div>
										<div class="flex flex-wrap gap-4 mt-2">
											<!-- Beziehungen -->
											<div class="flex flex-wrap gap-2">
												<div class="flex items-center gap-1">
													<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
													</svg>
													<span class="text-xs font-medium text-primary">Beziehungen:</span>
												</div>
												{#if wish.relations && wish.relations.length > 0}
													{#each wish.relations as relation}
														<span class="badge badge-outline badge-sm">{formatRelations([relation])}</span>
													{/each}
												{:else}
													<span class="badge badge-ghost badge-sm text-base-content/50">Keine Beziehungen</span>
												{/if}
											</div>
											
											<!-- Altersgruppen -->
											<div class="flex flex-wrap gap-2">
												<div class="flex items-center gap-1">
													<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span class="text-xs font-medium text-secondary">Altersgruppen:</span>
												</div>
												{#if wish.ageGroups && wish.ageGroups.length > 0}
													{#each wish.ageGroups as ageGroup}
														<span class="badge badge-secondary badge-outline badge-sm">{formatAgeGroups([ageGroup])}</span>
													{/each}
												{:else}
													<span class="badge badge-ghost badge-sm text-base-content/50">Keine Altersgruppen</span>
												{/if}
											</div>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<div class="badge {getBadgeClass(wish.duplicateStatus)}">
											{wish.duplicateStatus === 'duplicate' ? 'Duplikat' : 
											 wish.duplicateStatus === 'similar' ? 'Ähnlich' : 'Einzigartig'}
										</div>
										{#if wish.duplicateStatus !== 'unique'}
											<span class="text-sm font-mono {getSimilarityColor(wish.maxSimilarity)}">
												{Math.round(wish.maxSimilarity * 100)}%
											</span>
										{/if}
									</div>
								</div>

								<!-- Expanded Content -->
								{#if expandedWishes.has(wish.id)}
									<div class="mt-4 space-y-4">
										<!-- Individual Actions -->
										<div class="flex gap-2">
											<a href="/dashboard/wishes/{wish.id}" class="btn btn-outline btn-sm">
												<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
												Anzeigen
											</a>
											<a href="/dashboard/wishes/{wish.id}/edit" class="btn btn-outline btn-sm">
												<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
												</svg>
												Bearbeiten
											</a>
											<button class="btn btn-error btn-sm" on:click={() => {selectedWishes.clear(); selectedWishes.add(wish.id); selectedWishes = selectedWishes; showDeleteModal = true;}}>
												<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												Löschen
											</button>
										</div>
									</div>
								{/if}
								
								{#if wish.similarWishes.length > 0 && expandedWishes.has(wish.id)}
									<div class="mt-4">
										<h4 class="font-medium mb-3">Ähnliche Wünsche ({wish.similarWishes.length})</h4>
										<div class="space-y-2">
											{#each wish.similarWishes as similar}
												<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg group hover:bg-base-300 transition-colors">
													<span class="text-sm flex-1 pr-4">
														{similar.text}
													</span>
													<div class="flex items-center gap-2">
														<div class="badge badge-outline badge-sm">
															{similar.type} • {similar.eventType}
														</div>
														<span class="text-sm font-mono {getSimilarityColor(similar.similarity)}">
															{Math.round(similar.similarity * 100)}%
														</span>
														<button 
															class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content opacity-0 group-hover:opacity-100 transition-opacity"
															on:click={() => showSimilarWishDeleteConfirmation(similar.id)}
															title="Ähnlichen Wunsch löschen"
															aria-label="Ähnlichen Wunsch löschen"
														>
															<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
		</div>
	{/if}
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">Wünsche löschen</h3>
			<p class="mb-4">
				Möchten Sie wirklich {selectedWishes.size} {selectedWishes.size === 1 ? 'Wunsch' : 'Wünsche'} löschen?
			</p>
			<div class="alert alert-warning mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<span>Diese Aktion kann nicht rückgängig gemacht werden!</span>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" on:click={() => showDeleteModal = false} disabled={isDeleting}>
					Abbrechen
				</button>
				<button class="btn btn-error" on:click={deleteSelectedWishes} disabled={isDeleting}>
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
			<h3 class="font-bold text-lg mb-4">Auto-Clean Ähnlichkeits-Bereinigung</h3>
			<p class="mb-4">
				Automatisches Löschen von Wünschen mit hoher Ähnlichkeit. Es wird immer der älteste Wunsch beibehalten.
			</p>
			
			<div class="form-control mb-4">
				<label class="label">
					<span class="label-text">Ähnlichkeits-Schwellenwert:</span>
					<span class="label-text-alt">{autoCleanThreshold}%</span>
				</label>
				<input 
					type="range" 
					class="range range-primary" 
					min="70" 
					max="100" 
					step="5"
					bind:value={autoCleanThreshold}
					aria-label="Ähnlichkeits-Schwellenwert in Prozent"
				/>
				<div class="w-full flex justify-between text-xs px-2 mt-1">
					<span>70%</span>
					<span>85%</span>
					<span>100%</span>
				</div>
			</div>

			<div class="alert alert-info mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h4 class="font-bold">Vorschau</h4>
					<div class="text-sm">
						Etwa <strong>{getAutoCleanCount()}</strong> Wünsche würden bei {autoCleanThreshold}% Ähnlichkeit gelöscht.
					</div>
				</div>
			</div>

			{#if autoCleanThreshold >= 95}
				<div class="alert alert-warning mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span>Hoher Schwellenwert! Es werden nur sehr ähnliche Wünsche gelöscht.</span>
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost" on:click={() => showAutoCleanModal = false} disabled={isDeleting}>
					Abbrechen
				</button>
				<button 
					class="btn btn-error" 
					on:click={autoCleanSimilarWishes} 
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
			<h3 class="font-bold text-lg mb-4">Ähnlichen Wunsch löschen</h3>
			<p class="mb-4">
				Möchten Sie diesen ähnlichen Wunsch wirklich löschen?
			</p>
			<div class="alert alert-warning mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<span>Diese Aktion kann nicht rückgängig gemacht werden!</span>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" on:click={() => showSimilarWishDeleteModal = false} disabled={isDeleting}>
					Abbrechen
				</button>
				<button class="btn btn-error" on:click={confirmDeleteSimilarWish} disabled={isDeleting}>
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