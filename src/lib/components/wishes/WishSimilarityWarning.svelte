<script lang="ts">
	import { onMount } from 'svelte';
	import type { Wish } from '$lib/types/Wish.js';
	import type { SimilarityMatch } from '$lib/utils/similarity.js';
	import WishSimilarityModal from './WishSimilarityModal.svelte';

	interface Props {
		wish: Wish | any; // Allow flexibility for table view
		showDetails?: boolean;
		maxSimilarWishes?: number;
		onSimilarityData?: (data: SimilarityData) => void;
	}

	let { wish, showDetails = false, maxSimilarWishes = 3, onSimilarityData }: Props = $props();

	interface SimilarityData {
		similarWishes: SimilarityMatch[];
		isDuplicate: boolean;
		similarity: number;
		algorithm: string;
		processingTime: number;
	}

	let similarityData = $state<SimilarityData | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let showModal = $state(false);

	async function loadSimilarityData() {
		if (!wish.id || isLoading) return;

		isLoading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				wishId: wish.id,
				language: wish.language || 'de',
				type: wish.type || 'normal',
				eventType: wish.eventType || 'birthday'
			});

			const response = await fetch(`/api/wishes/similarity?${params}`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.success) {
				similarityData = {
					similarWishes: data.similarWishes || [],
					isDuplicate: data.isDuplicate || false,
					similarity: data.similarWishes?.[0]?.similarity || 0,
					algorithm: data.similarWishes?.[0]?.algorithm || '',
					processingTime: data.processingTime || 0
				};
				
				// Call the callback if provided
				if (onSimilarityData) {
					onSimilarityData(similarityData);
				}
			} else {
				throw new Error(data.error || 'Unbekannter Fehler');
			}
		} catch (err) {
			console.error('Fehler beim Laden der Ähnlichkeitsdaten:', err);
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			isLoading = false;
		}
	}

	function formatSimilarity(similarity: number): string {
		return `${Math.round(similarity * 100)}%`;
	}

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.9) return 'badge-error';
		if (similarity >= 0.7) return 'badge-warning';
		if (similarity >= 0.5) return 'badge-info';
		return 'badge-success';
	}

	function getSimilarityIcon(similarity: number): string {
		if (similarity >= 0.9) return '🚨';
		if (similarity >= 0.7) return '⚠️';
		if (similarity >= 0.5) return '📊';
		return '✅';
	}

	onMount(() => {
		loadSimilarityData();
	});
</script>

<div class="text-xs">
	{#if error}
		<div class="tooltip" data-tip="Fehler beim Laden der Ähnlichkeitsdaten">
			<div class="badge badge-error badge-xs">❌ Fehler</div>
		</div>
	{:else if isLoading}
		<div class="badge badge-ghost badge-xs">
			<span class="loading loading-spinner loading-xs"></span>
			Prüfe...
		</div>
	{:else if similarityData}
		<div class="flex flex-wrap gap-1">
			{#if similarityData.isDuplicate}
				<!-- Duplicate Warning -->
				<div
					class="tooltip"
					data-tip="Klicken für Details - Sehr ähnlicher Wunsch bereits vorhanden"
				>
					<button
						class="badge badge-error badge-xs hover:badge-error/80 cursor-pointer"
						onclick={() => (showModal = true)}
						aria-label="Duplikat-Details anzeigen"
					>
						🚨 Duplikat
					</button>
				</div>
			{:else if similarityData.similarWishes.length > 0}
				<!-- Similarity Score -->
				<div
					class="tooltip"
					data-tip="Klicken für Details - Ähnlichkeit: {formatSimilarity(
						similarityData.similarity
					)} ({similarityData.algorithm})"
				>
					<button
						class="badge {getSimilarityColor(
							similarityData.similarity
						)} badge-xs cursor-pointer hover:opacity-80"
						onclick={() => (showModal = true)}
						aria-label="Ähnlichkeits-Details anzeigen"
					>
						{getSimilarityIcon(similarityData.similarity)}
						{formatSimilarity(similarityData.similarity)}
					</button>
				</div>
			{:else}
				<!-- Unique Wish -->
				<div class="tooltip" data-tip="Einzigartiger Wunsch">
					<div class="badge badge-success badge-xs">✨ Einzigartig</div>
				</div>
			{/if}

			{#if similarityData.similarWishes.length > 0}
				<!-- Similar Wishes Count -->
				<div
					class="tooltip"
					data-tip="Klicken für Details - {similarityData.similarWishes
						.length} ähnliche Wünsche gefunden"
				>
					<button
						class="badge badge-info badge-xs hover:badge-info/80 cursor-pointer"
						onclick={() => (showModal = true)}
						aria-label="Ähnliche Wünsche Details anzeigen"
					>
						📋 {similarityData.similarWishes.length}
					</button>
				</div>
			{/if}
		</div>

		{#if showDetails && similarityData.similarWishes.length > 0}
			<!-- Detailed Similar Wishes -->
			<div class="mt-2 space-y-1">
				<div class="text-base-content/70 text-xs font-medium">Ähnliche Wünsche:</div>
				{#each similarityData.similarWishes.slice(0, maxSimilarWishes) as { wish: similarWish, similarity, algorithm }}
					<div class="flex items-center gap-2 text-xs">
						<div class="badge {getSimilarityColor(similarity)} badge-xs">
							{formatSimilarity(similarity)}
						</div>
						<div class="text-base-content/60 flex-1 truncate">
							{similarWish.text.substring(0, 60)}...
						</div>
						<div class="badge badge-ghost badge-xs">
							{algorithm}
						</div>
					</div>
				{/each}
				{#if similarityData.similarWishes.length > maxSimilarWishes}
					<div class="text-base-content/50 text-xs">
						+{similarityData.similarWishes.length - maxSimilarWishes} weitere
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Detailed Similarity Modal -->
<WishSimilarityModal {wish} isOpen={showModal} onClose={() => (showModal = false)} />
