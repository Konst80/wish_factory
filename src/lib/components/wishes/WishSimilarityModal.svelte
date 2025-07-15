<script lang="ts">
	import type { Wish } from '$lib/types/Wish.js';
	import type { SimilarityMatch } from '$lib/utils/similarity.js';
	import { onMount } from 'svelte';

	interface Props {
		wish: Wish | any; // Allow flexibility for table view
		isOpen: boolean;
		onClose: () => void;
	}

	let { wish, isOpen, onClose }: Props = $props();

	interface SimilarityData {
		similarWishes: SimilarityMatch[];
		isDuplicate: boolean;
		similarity: number;
		algorithm: string;
		processingTime: number;
		suggestions: string[];
	}

	let similarityData = $state<SimilarityData | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let lastLoadedWishId = $state<string | null>(null);
	let loadTimeout: ReturnType<typeof setTimeout> | null = null;
	let currentRequestId = $state<string | null>(null);

	// Deletion functionality
	let isDeleting = $state(false);
	let showDeleteModal = $state(false);
	let wishToDelete = $state<string | null>(null);
	let showAutoCleanModal = $state(false);
	let autoCleanThreshold = $state(80);
	let isAutoCleanProcessing = $state(false);
	let autoCleanCandidates = $state<string[]>([]);

	async function loadDetailedSimilarityData() {
		if (!wish.id || isLoading || lastLoadedWishId === wish.id) return;

		console.log(`Loading similarity data for wish ${wish.id}`);
		isLoading = true;
		error = null;
		lastLoadedWishId = wish.id;

		// Generate unique request ID to prevent race conditions
		const requestId = `${wish.id}-${Date.now()}`;
		currentRequestId = requestId;

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

			// Check if this is still the current request (prevent race conditions)
			if (currentRequestId !== requestId) {
				console.log('Request outdated, ignoring response');
				return;
			}

			if (data.success) {
				similarityData = {
					similarWishes: data.similarWishes || [],
					isDuplicate: data.isDuplicate || false,
					similarity: data.similarWishes?.[0]?.similarity || 0,
					algorithm: data.similarWishes?.[0]?.algorithm || '',
					processingTime: data.processingTime || 0,
					suggestions: data.suggestions || []
				};
			} else {
				throw new Error(data.error || 'Unbekannter Fehler');
			}
		} catch (err) {
			// Check if this is still the current request before setting error
			if (currentRequestId !== requestId) {
				console.log('Request outdated, ignoring error');
				return;
			}

			console.error('Fehler beim Laden der Ähnlichkeitsdaten:', err);
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
			lastLoadedWishId = null; // Reset on error so user can retry
		} finally {
			// Only set loading to false if this is still the current request
			if (currentRequestId === requestId) {
				isLoading = false;
			}
		}
	}

	function formatSimilarity(similarity: number): string {
		return `${Math.round(similarity * 100)}%`;
	}

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 0.9) return 'text-error';
		if (similarity >= 0.7) return 'text-warning';
		if (similarity >= 0.5) return 'text-info';
		return 'text-success';
	}

	function getSimilarityBadgeColor(similarity: number): string {
		if (similarity >= 0.9) return 'badge-error';
		if (similarity >= 0.7) return 'badge-warning';
		if (similarity >= 0.5) return 'badge-info';
		return 'badge-success';
	}

	function getAlgorithmName(algorithm: string): string {
		switch (algorithm) {
			case 'cosine':
				return 'Cosine Similarity';
			case 'jaccard':
				return 'Jaccard Index';
			case 'levenshtein':
				return 'Levenshtein Distance';
			case 'tfidf':
				return 'TF-IDF';
			default:
				return algorithm;
		}
	}

	function truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	function debouncedLoadData() {
		if (loadTimeout) {
			clearTimeout(loadTimeout);
		}

		loadTimeout = setTimeout(() => {
			loadDetailedSimilarityData();
		}, 100); // 100ms debounce
	}

	$effect(() => {
		if (isOpen && wish.id && !isLoading && lastLoadedWishId !== wish.id) {
			console.log(`Effect triggered for wish ${wish.id}, isOpen: ${isOpen}`);
			debouncedLoadData();
		}
	});

	// Reset data when modal closes
	$effect(() => {
		if (!isOpen) {
			// Clear any pending timeout
			if (loadTimeout) {
				clearTimeout(loadTimeout);
				loadTimeout = null;
			}

			similarityData = null;
			error = null;
			lastLoadedWishId = null;
		}
	});

	// Cleanup on component unmount
	$effect(() => {
		return () => {
			if (loadTimeout) {
				clearTimeout(loadTimeout);
			}
		};
	});

	// Delete individual wish
	async function deleteWish(wishId: string) {
		try {
			isDeleting = true;
			const response = await fetch(`/api/wishes/${wishId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Fehler beim Löschen des Wunsches');
			}

			// Remove from similarity data
			if (similarityData) {
				similarityData.similarWishes = similarityData.similarWishes.filter(
					(sw) => sw.wish.id !== wishId
				);
			}

			// Close delete modal
			showDeleteModal = false;
			wishToDelete = null;

			// Reload similarity data to refresh the view
			lastLoadedWishId = null;
			loadDetailedSimilarityData();
		} catch (error) {
			console.error('Fehler beim Löschen:', error);
			alert('Fehler beim Löschen des Wunsches');
		} finally {
			isDeleting = false;
		}
	}

	// Auto-clean functionality
	function prepareAutoClean() {
		if (!similarityData) return;

		const threshold = autoCleanThreshold / 100;
		autoCleanCandidates = similarityData.similarWishes
			.filter((sw) => sw.similarity >= threshold)
			.map((sw) => sw.wish.id);

		showAutoCleanModal = true;
	}

	async function executeAutoClean() {
		if (!similarityData) return;

		// Recalculate candidates based on current threshold
		const threshold = autoCleanThreshold / 100;
		const currentCandidates = similarityData.similarWishes
			.filter((sw) => sw.similarity >= threshold)
			.map((sw) => sw.wish.id);

		if (currentCandidates.length === 0) return;

		try {
			isAutoCleanProcessing = true;

			// Delete all candidates
			const deletePromises = currentCandidates.map((wishId) =>
				fetch(`/api/wishes/${wishId}`, { method: 'DELETE' })
			);

			const results = await Promise.all(deletePromises);

			// Check if all deletions were successful
			const failedDeletions = results.filter((r) => !r.ok);
			if (failedDeletions.length > 0) {
				throw new Error(`${failedDeletions.length} Wünsche konnten nicht gelöscht werden`);
			}

			// Update similarity data by removing deleted wishes
			if (similarityData) {
				similarityData.similarWishes = similarityData.similarWishes.filter(
					(sw) => !currentCandidates.includes(sw.wish.id)
				);
			}

			// Close modal and reset
			showAutoCleanModal = false;
			autoCleanCandidates = [];

			// Reload similarity data
			lastLoadedWishId = null;
			loadDetailedSimilarityData();
		} catch (error) {
			console.error('Fehler beim Auto-Clean:', error);
			alert('Fehler beim automatischen Löschen');
		} finally {
			isAutoCleanProcessing = false;
		}
	}

	function openDeleteModal(wishId: string) {
		wishToDelete = wishId;
		showDeleteModal = true;
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h3 class="text-lg font-bold">Ähnlichkeitsanalyse</h3>
					{#if wish.language === 'de'}
						<span class="badge badge-info badge-sm">🇩🇪 Deutsch</span>
					{:else if wish.language === 'en'}
						<span class="badge badge-info badge-sm">🇬🇧 English</span>
					{:else}
						<span class="badge badge-warning badge-sm">⚠️ Unbekannte Sprache</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if similarityData && similarityData.similarWishes.length > 0}
						<!-- Auto-Clean Button -->
						<button
							class="btn btn-warning btn-sm"
							onclick={prepareAutoClean}
							title="Auto-Clean: Wünsche über {autoCleanThreshold}% Ähnlichkeit löschen"
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Auto-Clean
						</button>
					{/if}
					<button
						class="btn btn-sm btn-circle btn-ghost"
						onclick={onClose}
						aria-label="Modal schließen"
					>
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Current Wish -->
			<div class="mb-6">
				<div class="mb-2 flex items-center justify-between">
					<h4 class="font-semibold">Aktueller Wunsch:</h4>
					<div class="text-base-content/60 text-xs">
						Nur Wünsche in {wish.language === 'de'
							? 'Deutsch'
							: wish.language === 'en'
								? 'English'
								: wish.language} werden verglichen
					</div>
				</div>
				<div class="bg-base-200 rounded-lg p-4">
					<div class="mb-2 flex items-center gap-2">
						<div class="badge badge-outline badge-sm">{wish.type}</div>
						<div class="badge badge-outline badge-sm">{wish.eventType}</div>
						<div class="badge badge-outline badge-sm">{wish.language}</div>
						<div class="badge badge-outline badge-sm">{wish.status}</div>
					</div>
					<p class="text-sm">{wish.text}</p>
				</div>
			</div>

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
					<span>Fehler beim Laden der Ähnlichkeitsdaten: {error}</span>
				</div>
			{:else if isLoading}
				<div class="flex items-center justify-center py-8">
					<span class="loading loading-spinner loading-lg"></span>
					<span class="ml-2">Analysiere Ähnlichkeiten...</span>
				</div>
			{:else if similarityData}
				<!-- Analysis Results -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Summary Stats -->
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h4 class="card-title text-base">Zusammenfassung</h4>
							<div class="stats stats-vertical shadow-sm">
								<div class="stat">
									<div class="stat-title">Ähnlichste Übereinstimmung</div>
									<div class="stat-value {getSimilarityColor(similarityData.similarity)} text-2xl">
										{formatSimilarity(similarityData.similarity)}
									</div>
									<div class="stat-desc">{getAlgorithmName(similarityData.algorithm)}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Gefundene Ähnlichkeiten</div>
									<div class="stat-value text-primary text-2xl">
										{similarityData.similarWishes.length}
									</div>
									<div class="stat-desc">Ähnliche Wünsche</div>
								</div>
								<div class="stat">
									<div class="stat-title">Analysezeit</div>
									<div class="stat-value text-info text-2xl">{similarityData.processingTime}ms</div>
									<div class="stat-desc">Verarbeitungszeit</div>
								</div>
							</div>

							{#if similarityData.isDuplicate}
								<div class="alert alert-warning mt-4">
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
									<span
										><strong>Duplikat erkannt!</strong> Dieser Wunsch ist sehr ähnlich zu einem bereits
										existierenden Wunsch.</span
									>
								</div>
							{/if}
						</div>
					</div>

					<!-- Similar Wishes -->
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body">
							<h4 class="card-title text-base">Ähnliche Wünsche</h4>
							{#if similarityData.similarWishes.length > 0}
								<div class="max-h-96 space-y-3 overflow-y-auto">
									{#each similarityData.similarWishes as { wish: similarWish, similarity, algorithm }}
										<div class="border-base-300 rounded-lg border p-3">
											<div class="mb-2 flex items-center justify-between">
												<div class="flex items-center gap-2">
													<div class="badge {getSimilarityBadgeColor(similarity)} badge-sm">
														{formatSimilarity(similarity)}
													</div>
													<div class="badge badge-ghost badge-sm">
														{getAlgorithmName(algorithm)}
													</div>
												</div>
												<div class="flex items-center gap-2">
													<div class="text-base-content/60 text-xs">
														ID: {similarWish.id.substring(0, 8)}...
													</div>
													<button
														class="btn btn-error btn-xs"
														onclick={() => openDeleteModal(similarWish.id)}
														title="Wunsch löschen"
														aria-label="Wunsch löschen"
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
											<p class="text-base-content/80 text-sm">
												{truncateText(similarWish.text, 200)}
											</p>
											<div class="mt-2 flex items-center gap-2">
												{#if similarWish.type}
													<div class="badge badge-outline badge-xs">{similarWish.type}</div>
												{/if}
												{#if similarWish.eventType}
													<div class="badge badge-outline badge-xs">{similarWish.eventType}</div>
												{/if}
												{#if similarWish.language}
													<div class="badge badge-outline badge-xs">{similarWish.language}</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="py-8 text-center">
									<div class="mb-2 text-4xl">✨</div>
									<p class="text-base-content/70">Keine ähnlichen Wünsche gefunden</p>
									<p class="text-base-content/50 text-sm">Dieser Wunsch ist einzigartig!</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Suggestions -->
				{#if similarityData.suggestions.length > 0}
					<div class="card bg-base-100 mt-6 shadow-sm">
						<div class="card-body">
							<h4 class="card-title text-base">Variationsvorschläge</h4>
							<div class="space-y-2">
								{#each similarityData.suggestions as suggestion}
									<div class="bg-base-50 rounded-lg p-3">
										<p class="text-sm">{suggestion}</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<div class="modal-action">
				<button class="btn btn-primary" onclick={onClose}>Schließen</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wunsch löschen</h3>
			<p class="mb-4">
				Möchten Sie diesen Wunsch wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
				werden.
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
				<button
					class="btn btn-error"
					onclick={() => wishToDelete && deleteWish(wishToDelete)}
					disabled={isDeleting}
				>
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

<!-- Auto-Clean Configuration Modal -->
{#if showAutoCleanModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Auto-Clean konfigurieren</h3>
			<div class="mb-4">
				<label class="label" for="threshold-slider">
					<span class="label-text">Ähnlichkeitsschwelle (%):</span>
				</label>
				<input
					id="threshold-slider"
					type="range"
					min="50"
					max="100"
					bind:value={autoCleanThreshold}
					class="range range-warning"
					step="10"
				/>
				<div class="-mt-2 flex w-full justify-between px-2 text-xs">
					<span class="text-center {autoCleanThreshold === 50 ? 'text-warning font-bold' : ''}"
						>50%</span
					>
					<span class="text-center {autoCleanThreshold === 60 ? 'text-warning font-bold' : ''}"
						>60%</span
					>
					<span class="text-center {autoCleanThreshold === 70 ? 'text-warning font-bold' : ''}"
						>70%</span
					>
					<span class="text-center {autoCleanThreshold === 80 ? 'text-warning font-bold' : ''}"
						>80%</span
					>
					<span class="text-center {autoCleanThreshold === 90 ? 'text-warning font-bold' : ''}"
						>90%</span
					>
					<span class="text-center {autoCleanThreshold === 100 ? 'text-warning font-bold' : ''}"
						>100%</span
					>
				</div>
				<div class="mt-2 text-center">
					<span class="text-lg font-bold">{autoCleanThreshold}%</span>
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
					<strong>Zu löschende Wünsche:</strong>
					{similarityData
						? similarityData.similarWishes.filter((sw) => sw.similarity >= autoCleanThreshold / 100)
								.length
						: 0}
					<div class="text-sm">
						Alle Wünsche mit einer Ähnlichkeit von {autoCleanThreshold}% oder höher werden gelöscht.
					</div>
				</div>
			</div>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showAutoCleanModal = false)}>Abbrechen</button
				>
				<button
					class="btn btn-warning"
					onclick={executeAutoClean}
					disabled={isAutoCleanProcessing ||
						(similarityData
							? similarityData.similarWishes.filter(
									(sw) => sw.similarity >= autoCleanThreshold / 100
								).length === 0
							: true)}
				>
					{#if isAutoCleanProcessing}
						<span class="loading loading-spinner loading-sm"></span>
						Lösche {similarityData
							? similarityData.similarWishes.filter(
									(sw) => sw.similarity >= autoCleanThreshold / 100
								).length
							: 0} Wünsche...
					{:else}
						{similarityData
							? similarityData.similarWishes.filter(
									(sw) => sw.similarity >= autoCleanThreshold / 100
								).length
							: 0} Wünsche löschen
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
