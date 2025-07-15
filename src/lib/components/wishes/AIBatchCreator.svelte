<script lang="ts">
	import { type WishFormState } from '$lib/types/Wish';
	import {
		generateBatchWishes,
		type GeneratedWish,
		type BatchSettings
	} from '$lib/utils/ai-generation';
	import { loadActiveWishLanguages } from '$lib/stores/wishLanguages';
	import { onMount } from 'svelte';

	type Props = {
		isOpen: boolean;
		formData: WishFormState;
		onClose: () => void;
		onSaveBatch: (wishes: GeneratedWish[]) => void;
	};

	let { isOpen, formData, onClose, onSaveBatch }: Props = $props();

	// Internal state management
	let isGenerating = $state(false);
	let currentStep = $state(1);
	let generatedWishes = $state<GeneratedWish[]>([]);
	let selectedGeneratedWishes = $state<string[]>([]);

	// Batch settings state - managed internally
	let batchSettings = $state<BatchSettings>({
		count: 5,
		includeAlternatives: true,
		types: [],
		eventTypes: [],
		languages: [],
		relations: [],
		ageGroups: [],
		specificValues: 0,
		generateForAllAgeGroups: false,
		generateForAllRelations: false
	});

	async function handleGenerateBatch() {
		try {
			isGenerating = true;
			currentStep = 2;

			const result = await generateBatchWishes(formData, batchSettings);

			if (result.success && result.wishes) {
				generatedWishes = result.wishes;
				currentStep = 3;
			} else {
				console.error('Generation failed:', result.error || 'Es konnten keine Wünsche generiert werden.');
				currentStep = 1;
			}
		} catch (error) {
			console.error('Batch-Generierung fehlgeschlagen:', error);
			console.error('Batch generation error:', error);
			currentStep = 1;
		} finally {
			isGenerating = false;
		}
	}

	function handleSaveBatch() {
		const wishesToSave = generatedWishes.filter((w) => selectedGeneratedWishes.includes(w.id));
		if (wishesToSave.length === 0) {
			alert('Bitte wählen Sie mindestens einen Wunsch zum Speichern aus.');
			return;
		}
		onSaveBatch(wishesToSave);
		resetBatchCreator();
	}

	function resetBatchCreator() {
		currentStep = 1;
		generatedWishes = [];
		selectedGeneratedWishes = [];
		onClose();
	}

	function resetBatchSettings() {
		batchSettings = {
			count: 5,
			includeAlternatives: true,
			types: [],
			eventTypes: [],
			languages: [],
			relations: [],
			ageGroups: [],
			specificValues: 0,
			generateForAllAgeGroups: false,
			generateForAllRelations: false
		};
	}

	function copyFromMainForm() {
		batchSettings.types = [formData.type];
		batchSettings.eventTypes = [formData.eventType];
		batchSettings.languages = [formData.language];
		batchSettings.relations = [...formData.relations];
		batchSettings.ageGroups = [...formData.ageGroups];
		batchSettings.specificValues =
			typeof formData.specificValues === 'number'
				? formData.specificValues
				: formData.specificValues
					? parseInt(formData.specificValues.toString()) || 0
					: 0;
	}

	function toggleWishSelection(wishId: string) {
		if (selectedGeneratedWishes.includes(wishId)) {
			selectedGeneratedWishes = selectedGeneratedWishes.filter((id) => id !== wishId);
		} else {
			selectedGeneratedWishes = [...selectedGeneratedWishes, wishId];
		}
	}

	function selectAllGenerated() {
		selectedGeneratedWishes = generatedWishes.map((w) => w.id);
	}

	function deselectAllGenerated() {
		selectedGeneratedWishes = [];
	}

	// Labels for display
	const typeLabels = {
		normal: 'Normal',
		herzlich: 'Herzlich',
		humorvoll: 'Humorvoll'
	};

	const eventTypeLabels = {
		birthday: 'Geburtstag',
		anniversary: 'Jubiläum',
		custom: 'Sonstiges'
	};


	// Load active wish languages on mount
	onMount(() => {
		loadActiveWishLanguages();
	});
</script>

<!-- AI Batch Creator Modal -->
<div class="modal {isOpen ? 'modal-open' : ''}">
	<div class="modal-box flex h-[90vh] max-w-6xl flex-col">
		<div class="mb-6 flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-xl font-bold">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="text-primary h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11H5m14-7H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6m-6 4h6"
					/>
				</svg>
				Batch-Erstellung mit KI
			</h3>
			<div class="steps steps-horizontal">
				<div class="step {currentStep >= 1 ? 'step-primary' : ''}">Konfiguration</div>
				<div class="step {currentStep >= 2 ? 'step-primary' : ''}">Generierung</div>
				<div class="step {currentStep >= 3 ? 'step-primary' : ''}">Auswahl</div>
				<div class="step {currentStep >= 4 ? 'step-primary' : ''}">Speichern</div>
			</div>
		</div>

		<div class="flex-1 overflow-auto">
			{#if currentStep === 1}
				<!-- Step 1: Configuration -->
				<div class="space-y-6">
					<!-- Header with Quick Actions -->
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h4 class="text-base-content text-lg font-semibold">🔧 Batch-Konfiguration</h4>
							<p class="text-base-content/70 text-sm">
								Konfiguriere die Parameter für die KI-Generierung
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="btn btn-outline btn-sm"
								onclick={copyFromMainForm}
								title="Einstellungen aus Hauptformular übernehmen"
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
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								Hauptformular übernehmen
							</button>
							<button
								type="button"
								class="btn btn-ghost btn-sm"
								onclick={resetBatchSettings}
								title="Alle Filter zurücksetzen"
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Zurücksetzen
							</button>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<!-- Left Column: Basic Settings -->
						<div class="space-y-4">
							<!-- Generation Settings -->
							<div
								class="card from-primary/5 to-secondary/5 border-primary/20 border bg-gradient-to-br shadow-lg"
							>
								<div class="card-body">
									<h4 class="card-title flex items-center gap-2 text-base">
										<div class="badge badge-primary badge-sm">
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
													d="M13 10V3L4 14h7v7l9-11h-7z"
												/>
											</svg>
										</div>
										Basis-Einstellungen
									</h4>

									<!-- Count Setting -->
									<div class="form-control">
										<label class="label" for="batchCount">
											<span class="label-text text-sm font-medium">Anzahl Wünsche</span>
										</label>
										<input
											id="batchCount"
											type="number"
											min="1"
											max="20"
											class="input-bordered input input-sm w-full"
											bind:value={batchSettings.count}
										/>
									</div>

									<!-- Include Alternatives -->
									<div class="form-control">
										<label class="label cursor-pointer">
											<span class="label-text text-sm font-medium">Variationen einbeziehen</span>
											<input
												type="checkbox"
												class="checkbox checkbox-primary checkbox-sm"
												bind:checked={batchSettings.includeAlternatives}
											/>
										</label>
									</div>
								</div>
							</div>
						</div>

						<!-- Right Column: Filter Settings -->
						<div class="space-y-4">
							<div class="text-center">
								<p class="text-base-content/60 text-sm">
									Filter leer lassen = Hauptformular-Werte verwenden
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if currentStep === 2}
				<!-- Step 2: Generation -->
				<div class="flex h-full flex-col items-center justify-center space-y-4">
					{#if isGenerating}
						<div class="flex flex-col items-center space-y-4">
							<span class="loading loading-spinner loading-lg text-primary"></span>
							<h4 class="text-lg font-semibold">KI generiert Wünsche...</h4>
							<p class="text-base-content/70 text-center">
								Dies kann einige Sekunden dauern. Die KI erstellt {batchSettings.count} individuelle
								Wünsche basierend auf Ihren Einstellungen.
							</p>
						</div>
					{:else}
						<div class="space-y-4 text-center">
							<h4 class="text-lg font-semibold">Bereit zur Generierung</h4>
							<p class="text-base-content/70">
								{batchSettings.count} Wünsche werden mit KI generiert
							</p>
							<button
								type="button"
								class="btn btn-primary btn-lg gap-2"
								onclick={handleGenerateBatch}
							>
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
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
								Wünsche generieren
							</button>
						</div>
					{/if}
				</div>
			{:else if currentStep === 3}
				<!-- Step 3: Review and Select -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h4 class="text-lg font-semibold">
							Generierte Wünsche auswählen ({selectedGeneratedWishes.length}/{generatedWishes.length})
						</h4>
						<div class="flex gap-2">
							<button type="button" class="btn btn-outline btn-sm" onclick={selectAllGenerated}>
								Alle auswählen
							</button>
							<button type="button" class="btn btn-ghost btn-sm" onclick={deselectAllGenerated}>
								Alle abwählen
							</button>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{#each generatedWishes as wish (wish.id)}
							<div
								class="card cursor-pointer border-2 transition-all {selectedGeneratedWishes.includes(
									wish.id
								)
									? 'border-primary bg-primary/5'
									: 'border-base-300'}"
								role="button"
								tabindex="0"
								onclick={() => toggleWishSelection(wish.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleWishSelection(wish.id);
									}
								}}
							>
								<div class="card-body p-4">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="mb-2 flex flex-wrap gap-2">
												<div class="badge badge-primary badge-sm">{typeLabels[wish.type]}</div>
												<div class="badge badge-secondary badge-sm">
													{eventTypeLabels[wish.eventType]}
												</div>
												{#if wish.belated}
													<div class="badge badge-warning badge-sm">Nachträglich</div>
												{/if}
											</div>
											<p class="text-sm">{wish.text}</p>
											<div class="mt-2 flex items-center gap-2 text-xs opacity-70">
												<span>{wish.text.length} Zeichen</span>
												<span class="badge badge-outline badge-xs">KI</span>
											</div>
										</div>
										<input
											type="checkbox"
											class="checkbox checkbox-primary"
											checked={selectedGeneratedWishes.includes(wish.id)}
											onchange={() => toggleWishSelection(wish.id)}
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if currentStep === 4}
				<!-- Step 4: Save -->
				<div class="flex h-full flex-col items-center justify-center space-y-4">
					<div class="space-y-4 text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-success mx-auto h-16 w-16"
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
						<h4 class="text-lg font-semibold">Bereit zum Speichern</h4>
						<p class="text-base-content/70">
							{selectedGeneratedWishes.length} Wünsche werden als Entwürfe gespeichert
						</p>
						<button
							type="button"
							class="btn btn-success btn-lg gap-2"
							onclick={handleSaveBatch}
							disabled={selectedGeneratedWishes.length === 0}
						>
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
									d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
								/>
							</svg>
							Wünsche speichern
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Modal Actions -->
		<div class="modal-action mt-6">
			<button type="button" class="btn btn-outline" onclick={resetBatchCreator}>Schließen</button>
			{#if currentStep > 1 && currentStep < 4}
				<button type="button" class="btn btn-ghost" onclick={() => (currentStep = 1)}>Zurück</button
				>
			{/if}
		</div>
	</div>
</div>
