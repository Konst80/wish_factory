<script lang="ts">
	import type { SimilarityMatch } from '$lib/utils/similarity.js';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		similarWishes: SimilarityMatch[];
		suggestions: string[];
		isLoading?: boolean;
		maxDisplay?: number;
		showSuggestions?: boolean;
	}

	let {
		similarWishes,
		suggestions,
		isLoading = false,
		maxDisplay = 5,
		showSuggestions = true
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		selectWish: { wish: SimilarityMatch['wish'] };
		applySuggestion: { suggestion: string };
		viewMore: { wishes: SimilarityMatch[] };
	}>();

	function formatSimilarity(similarity: number): string {
		return `${Math.round(similarity * 100)}%`;
	}

	function getSimilarityBadgeClass(similarity: number): string {
		if (similarity >= 0.9) return 'badge-error';
		if (similarity >= 0.7) return 'badge-warning';
		if (similarity >= 0.5) return 'badge-info';
		return 'badge-success';
	}

	function getEventTypeIcon(eventType: string): string {
		switch (eventType) {
			case 'birthday':
				return '🎂';
			case 'anniversary':
				return '💝';
			case 'custom':
				return '🎉';
			default:
				return '✨';
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'normal':
				return 'Normal';
			case 'funny':
				return 'Lustig';
			default:
				return type;
		}
	}

	function getLanguageFlag(language: string): string {
		switch (language) {
			case 'de':
				return '🇩🇪';
			case 'en':
				return '🇬🇧';
			default:
				return '🌐';
		}
	}

	function truncateText(text: string, maxLength: number = 100): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	let displayedWishes = $derived(similarWishes.slice(0, maxDisplay));
	let hasMore = $derived(similarWishes.length > maxDisplay);
</script>

<div class="similar-wishes-panel">
	{#if isLoading}
		<!-- Loading State -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<div class="mb-4 flex items-center gap-2">
					<span class="loading loading-spinner loading-sm"></span>
					<h3 class="card-title text-lg">Ähnliche Wünsche werden gesucht...</h3>
				</div>
				<div class="space-y-2">
					{#each Array(3) as _}
						<div class="skeleton h-16 w-full"></div>
					{/each}
				</div>
			</div>
		</div>
	{:else if similarWishes.length > 0}
		<!-- Similar Wishes Display -->
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
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						Ähnliche Wünsche ({similarWishes.length})
					</h3>
					{#if hasMore}
						<button
							class="btn btn-outline btn-sm"
							onclick={() => dispatch('viewMore', { wishes: similarWishes })}
						>
							Alle anzeigen
						</button>
					{/if}
				</div>

				<div class="space-y-3">
					{#each displayedWishes as { wish, similarity, algorithm }}
						<div class="border-base-300 hover:bg-base-50 rounded-lg border p-4 transition-colors">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex items-center gap-2">
									<span class="badge {getSimilarityBadgeClass(similarity)} badge-sm">
										{formatSimilarity(similarity)}
									</span>
									<span class="badge badge-ghost badge-sm">
										{algorithm}
									</span>
									{#if wish.language}
										<span class="text-sm" title="Sprache">
											{getLanguageFlag(wish.language)}
										</span>
									{/if}
								</div>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => dispatch('selectWish', { wish })}
									title="Wunsch auswählen"
									aria-label="Wunsch auswählen"
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
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</button>
							</div>

							<div class="mb-2">
								<p class="text-base-content/80 text-sm leading-relaxed">
									{truncateText(wish.text)}
								</p>
							</div>

							<div class="text-base-content/60 flex items-center gap-2 text-xs">
								{#if wish.eventType}
									<span class="flex items-center gap-1">
										<span>{getEventTypeIcon(wish.eventType)}</span>
										<span>{wish.eventType}</span>
									</span>
								{/if}
								{#if wish.type}
									<span class="flex items-center gap-1">
										<span>•</span>
										<span>{getTypeLabel(wish.type)}</span>
									</span>
								{/if}
								<span class="flex items-center gap-1">
									<span>•</span>
									<span>ID: {wish.id.substring(0, 8)}</span>
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if showSuggestions && suggestions.length > 0}
		<!-- Suggestions Panel -->
		<div class="card bg-base-100 mt-4 shadow-md">
			<div class="card-body">
				<h3 class="card-title mb-4 text-lg">
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
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
					Variationsvorschläge ({suggestions.length})
				</h3>

				<div class="space-y-2">
					{#each suggestions as suggestion}
						<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
							<div class="flex-1">
								<p class="text-base-content/80 text-sm leading-relaxed">
									{truncateText(suggestion, 120)}
								</p>
							</div>
							<button
								class="btn btn-outline btn-sm ml-3"
								onclick={() => dispatch('applySuggestion', { suggestion })}
							>
								Übernehmen
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if !isLoading && similarWishes.length === 0}
		<!-- No Similar Wishes -->
		<div class="card bg-base-100 shadow-md">
			<div class="card-body text-center">
				<div class="text-success mb-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-12 w-12"
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
				</div>
				<h3 class="card-title mb-2 justify-center text-lg">Einzigartiger Wunsch!</h3>
				<p class="text-base-content/70">
					Keine ähnlichen Wünsche in der Datenbank gefunden. Dieser Wunsch ist einzigartig.
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.similar-wishes-panel {
		width: 100%;
	}
</style>
