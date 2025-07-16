<script lang="ts">
	import type { SimilarityMatch } from '$lib/utils/similarity.js';

	interface Props {
		similarity: number;
		algorithm: string;
		isDuplicate: boolean;
		similarWishes: SimilarityMatch[];
		isLoading?: boolean;
		showDetails?: boolean;
	}

	const {
		similarity,
		algorithm,
		isDuplicate,
		similarWishes,
		isLoading = false,
		showDetails: initialShowDetails = false
	}: Props = $props();

	let showDetails = $state(initialShowDetails);

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.9) return 'error';
		if (similarity >= 0.7) return 'warning';
		if (similarity >= 0.5) return 'info';
		return 'success';
	}

	function getSimilarityText(similarity: number): string {
		if (similarity >= 0.9) return 'Sehr ähnlich';
		if (similarity >= 0.7) return 'Ähnlich';
		if (similarity >= 0.5) return 'Etwas ähnlich';
		return 'Nicht ähnlich';
	}

	function formatSimilarity(similarity: number): string {
		return `${Math.round(similarity * 100)}%`;
	}

	function getAlgorithmDisplayName(algorithm: string): string {
		switch (algorithm) {
			case 'cosine':
				return 'Cosine';
			case 'jaccard':
				return 'Jaccard';
			case 'levenshtein':
				return 'Levenshtein';
			case 'tfidf':
				return 'TF-IDF';
			default:
				return algorithm;
		}
	}
</script>

<div class="similarity-indicator">
	{#if isLoading}
		<!-- Loading State -->
		<div class="alert alert-info">
			<div class="flex items-center gap-2">
				<span class="loading loading-spinner loading-sm"></span>
				<span>Ähnlichkeit wird geprüft...</span>
			</div>
		</div>
	{:else if similarWishes.length > 0}
		<!-- Similarity Results -->
		<div class="alert alert-{getSimilarityColor(similarity)}">
			<div class="flex w-full items-center justify-between">
				<div class="flex items-center gap-2">
					{#if isDuplicate}
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
						<span class="font-medium">Duplikat erkannt!</span>
					{:else}
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
						<span class="font-medium">{getSimilarityText(similarity)}</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<span class="text-sm opacity-70">
						{formatSimilarity(similarity)}
					</span>
					<button class="btn btn-ghost btn-xs" onclick={() => (showDetails = !showDetails)}>
						{showDetails ? 'Weniger' : 'Details'}
					</button>
				</div>
			</div>

			{#if isDuplicate}
				<div class="mt-2 text-sm">
					Ein sehr ähnlicher Wunsch existiert bereits. Bitte überarbeiten Sie den Text.
				</div>
			{/if}
		</div>

		{#if showDetails}
			<!-- Detailed Information -->
			<div class="bg-base-200 mt-2 rounded-lg p-4">
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="font-medium">Algorithmus:</span>
						<span>{getAlgorithmDisplayName(algorithm)}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Ähnlichkeit:</span>
						<span>{formatSimilarity(similarity)}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Gefundene Wünsche:</span>
						<span>{similarWishes.length}</span>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<!-- No Similar Wishes -->
		<div class="alert alert-success">
			<div class="flex items-center gap-2">
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
				<span>Keine ähnlichen Wünsche gefunden</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.similarity-indicator {
		width: 100%;
	}
</style>
