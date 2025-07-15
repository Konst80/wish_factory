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

		<!-- Wishes List -->
		<div class="space-y-4">
			{#each filteredWishes as wish}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h2 class="card-title text-lg">{wish.text.substring(0, 80)}...</h2>
								<p class="text-base-content/70 text-sm">
									{wish.type} • {wish.eventType} • {wish.language} • {wish.status}
								</p>
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
						
						{#if wish.similarWishes.length > 0}
							<div class="mt-4">
								<h4 class="font-medium mb-3">Ähnliche Wünsche ({wish.similarWishes.length})</h4>
								<div class="space-y-2">
									{#each wish.similarWishes.slice(0, 5) as similar}
										<div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
											<span class="text-sm flex-1">{similar.text.substring(0, 60)}...</span>
											<div class="flex items-center gap-2">
												<div class="badge badge-outline badge-sm">
													{similar.type} • {similar.eventType}
												</div>
												<span class="text-sm font-mono {getSimilarityColor(similar.similarity)}">
													{Math.round(similar.similarity * 100)}%
												</span>
											</div>
										</div>
									{/each}
									{#if wish.similarWishes.length > 5}
										<p class="text-sm text-base-content/70">
											...und {wish.similarWishes.length - 5} weitere
										</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>