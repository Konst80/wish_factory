<script lang="ts">
	import { onMount } from 'svelte';

	interface SimilarityStats {
		totalWishes: number;
		duplicateGroups: number;
		averageSimilarity: number;
		processingTime: number;
	}

	interface CacheStats {
		size: number;
		hitRate: number;
		oldestEntry: number;
	}

	interface Props {
		language?: 'de' | 'en';
		showCacheStats?: boolean;
		autoRefresh?: boolean;
		refreshInterval?: number;
	}

	let {
		language = 'de',
		showCacheStats = true,
		autoRefresh = false,
		refreshInterval = 30000
	}: Props = $props();

	let similarityStats = $state<SimilarityStats>({
		totalWishes: 0,
		duplicateGroups: 0,
		averageSimilarity: 0,
		processingTime: 0
	});

	let cacheStats = $state<CacheStats>({
		size: 0,
		hitRate: 0,
		oldestEntry: 0
	});

	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let lastUpdated = $state<Date | null>(null);
	let showStats = $state(false);

	async function loadSimilarityStats() {
		isLoading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				action: 'stats'
			});

			// Always require language parameter for language-specific evaluation
			if (!language) {
				throw new Error('Sprache ist erforderlich für die Ähnlichkeitsanalyse');
			}

			params.append('language', language);

			const response = await fetch(`/api/wishes/similarity?${params}`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.success) {
				similarityStats = data.stats;
				cacheStats = data.cache;
				lastUpdated = new Date();
			} else {
				throw new Error(data.error || 'Unbekannter Fehler');
			}
		} catch (err) {
			console.error('Fehler beim Laden der Ähnlichkeitsstatistiken:', err);
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			isLoading = false;
		}
	}

	function formatDuration(milliseconds: number): string {
		if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
		if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
		return `${Math.round(milliseconds / 60000)}min`;
	}

	function formatPercentage(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	function getDuplicateRatio(): number {
		if (similarityStats.totalWishes === 0) return 0;
		return similarityStats.duplicateGroups / similarityStats.totalWishes;
	}

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.8) return 'text-error';
		if (similarity >= 0.6) return 'text-warning';
		if (similarity >= 0.4) return 'text-info';
		return 'text-success';
	}

	function getDuplicateColor(ratio: number): string {
		if (ratio >= 0.2) return 'text-error';
		if (ratio >= 0.1) return 'text-warning';
		if (ratio >= 0.05) return 'text-info';
		return 'text-success';
	}

	// React to language changes
	$effect(() => {
		if (language) {
			loadSimilarityStats();
		}
	});

	onMount(() => {
		let interval: ReturnType<typeof setInterval> | null = null;
		if (autoRefresh) {
			interval = setInterval(loadSimilarityStats, refreshInterval);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	});
</script>

<div class="similarity-metrics-overview">
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
				<h3 class="font-bold">Fehler beim Laden der Ähnlichkeitsmetriken</h3>
				<div class="text-xs">{error}</div>
			</div>
			<button class="btn btn-sm" onclick={loadSimilarityStats}> Erneut versuchen </button>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="card-title text-lg">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
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
						Ähnlichkeitsmetriken
						{#if language === 'de'}
							<span class="badge badge-sm badge-info">🇩🇪 Deutsch</span>
						{:else if language === 'en'}
							<span class="badge badge-sm badge-info">🇬🇧 English</span>
						{:else}
							<span class="badge badge-sm badge-warning">Keine Sprache</span>
						{/if}
					</h3>
					<div class="flex items-center gap-2">
						{#if lastUpdated}
							<span class="text-base-content/60 text-xs">
								{lastUpdated.toLocaleTimeString()}
							</span>
						{/if}
						<button class="btn btn-ghost btn-sm" onclick={loadSimilarityStats} disabled={isLoading}>
							{#if isLoading}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
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
							{/if}
						</button>
						<button class="btn btn-outline btn-sm" onclick={() => (showStats = !showStats)}>
							{showStats ? 'Details ausblenden' : 'Details einblenden'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 transition-transform {showStats ? 'rotate-180' : ''}"
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

				{#if isLoading}
					<div class="space-y-4">
						<div class="skeleton h-16 w-full"></div>
						<div class="skeleton h-16 w-full"></div>
						<div class="skeleton h-16 w-full"></div>
					</div>
				{:else}
					<!-- Main Statistics -->
					<div class="mb-6 grid grid-cols-2 gap-4">
						<div class="stat bg-base-200 rounded-lg p-4">
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
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<div class="stat-title">Wünsche gesamt</div>
							<div class="stat-value text-primary text-2xl">{similarityStats.totalWishes}</div>
						</div>

						<div class="stat bg-base-200 rounded-lg p-4">
							<div class="stat-figure {getDuplicateColor(getDuplicateRatio())}">
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
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div class="stat-title">Ähnliche Wünsche</div>
							<div class="stat-value {getDuplicateColor(getDuplicateRatio())} text-2xl">
								{similarityStats.duplicateGroups}
							</div>
							<div class="stat-desc">
								{formatPercentage(getDuplicateRatio())} der Wünsche
							</div>
						</div>
					</div>

					{#if showStats}
						<!-- Detailed Metrics -->
						<div class="space-y-4">
							<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
								<div class="flex items-center gap-3">
									<div
										class="h-3 w-3 rounded-full {getSimilarityColor(
											similarityStats.averageSimilarity
										)} bg-current"
									></div>
									<span class="font-medium">Durchschnittliche Ähnlichkeit</span>
								</div>
								<div class="flex items-center gap-2">
									<span
										class="text-lg font-semibold {getSimilarityColor(
											similarityStats.averageSimilarity
										)}"
									>
										{formatPercentage(similarityStats.averageSimilarity)}
									</span>
									<div class="tooltip" data-tip="Ähnlichkeit zwischen verwandten Wünschen">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="text-base-content/60 h-4 w-4"
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
									</div>
								</div>
							</div>

							<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
								<div class="flex items-center gap-3">
									<div class="bg-info h-3 w-3 rounded-full"></div>
									<span class="font-medium">Analysezeit</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-lg font-semibold">
										{formatDuration(similarityStats.processingTime)}
									</span>
									<div class="tooltip" data-tip="Zeit für die Ähnlichkeitsanalyse">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="text-base-content/60 h-4 w-4"
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
									</div>
								</div>
							</div>

							{#if showCacheStats}
								<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
									<div class="flex items-center gap-3">
										<div class="bg-secondary h-3 w-3 rounded-full"></div>
										<span class="font-medium">Cache</span>
									</div>
									<div class="flex items-center gap-4">
										<div class="text-sm">
											<span class="font-semibold">{cacheStats.size}</span>
											<span class="text-base-content/60">Einträge</span>
										</div>
										<div class="text-sm">
											<span class="font-semibold">{formatPercentage(cacheStats.hitRate)}</span>
											<span class="text-base-content/60">Trefferquote</span>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Quality Indicators -->
						<div class="bg-base-50 mt-6 rounded-lg p-4">
							<h4 class="mb-3 flex items-center gap-2 font-medium">
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Qualitätsindikatoren
							</h4>
							<div class="grid grid-cols-3 gap-3 text-sm">
								<div class="text-center">
									<div
										class="text-lg font-semibold {getDuplicateRatio() < 0.05
											? 'text-success'
											: getDuplicateRatio() < 0.1
												? 'text-warning'
												: 'text-error'}"
									>
										{getDuplicateRatio() < 0.05 ? '✓' : getDuplicateRatio() < 0.1 ? '⚠' : '✗'}
									</div>
									<div class="text-base-content/60 text-xs">Duplikate</div>
								</div>
								<div class="text-center">
									<div
										class="text-lg font-semibold {similarityStats.averageSimilarity < 0.6
											? 'text-success'
											: similarityStats.averageSimilarity < 0.8
												? 'text-warning'
												: 'text-error'}"
									>
										{similarityStats.averageSimilarity < 0.6
											? '✓'
											: similarityStats.averageSimilarity < 0.8
												? '⚠'
												: '✗'}
									</div>
									<div class="text-base-content/60 text-xs">Diversität</div>
								</div>
								<div class="text-center">
									<div
										class="text-lg font-semibold {similarityStats.processingTime < 1000
											? 'text-success'
											: similarityStats.processingTime < 5000
												? 'text-warning'
												: 'text-error'}"
									>
										{similarityStats.processingTime < 1000
											? '✓'
											: similarityStats.processingTime < 5000
												? '⚠'
												: '✗'}
									</div>
									<div class="text-base-content/60 text-xs">Performance</div>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.similarity-metrics-overview {
		@apply w-full;
	}
</style>
