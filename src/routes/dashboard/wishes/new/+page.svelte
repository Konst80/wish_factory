<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, WishStatus, WishLength } from '$lib/types/Wish';
	import type { WishFormState } from '$lib/types/Wish.js';
	import { generateSingleWish } from '$lib/utils/ai-generation';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';
	import WishPreview from '$lib/components/wishes/WishPreview.svelte';
	import WishHelpCard from '$lib/components/wishes/WishHelpCard.svelte';
	import WishFormSection from '$lib/components/wishes/WishFormSection.svelte';
	import WishContentEditor from '$lib/components/wishes/WishContentEditor.svelte';
	import AIBatchCreator from '$lib/components/wishes/AIBatchCreator.svelte';

	type ActionData = {
		message?: string;
		errors?: Record<string, string>;
		values?: {
			type?: string;
			eventType?: string;
			relations?: string[];
			ageGroups?: string[];
			specificValues?: number;
			text?: string;
			belated?: boolean;
			language?: string;
			status?: string;
			length?: string;
		};
	} | null;

	const { form }: { form: ActionData } = $props();

	// Form state
	let formData: WishFormState = $state({
		type: (form?.values?.type as WishType) || WishType.NORMAL,
		eventType: (form?.values?.eventType as EventType) || EventType.BIRTHDAY,
		relations: form?.values?.relations || ['friend'], // Default to friend to satisfy validation
		ageGroups: form?.values?.ageGroups || ['all'], // Default to all ages to satisfy validation
		specificValues: form?.values?.specificValues || '',
		text: form?.values?.text || 'Alles Gute zum Geburtstag, liebe/r [Name]!', // Default text to satisfy min length validation
		isBelated: form?.values?.belated || false,
		language: form?.values?.language || 'de', // Changed to use dynamic language code
		length: (form?.values?.length as WishLength) || WishLength.MEDIUM
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let showAIBatchCreator = $state(false);
	let isGenerating = $state(false);
	let generationError = $state('');
	let showWorkflowHelp = $state(false);

	// Pool state
	let wishPool: Array<WishFormState & { id: string; createdAt: Date }> = $state([]);
	let showPoolManager = $state(false);
	let hasUnsavedChanges = $state(false);
	let editingPoolItemId = $state<string | null>(null);

	// Validation state
	let errors = $state(form?.errors || {});

	// Helper functions
	function handleRelationChange(relation: string, checked: boolean) {
		if (checked) {
			formData.relations = [...formData.relations, relation];
		} else {
			formData.relations = formData.relations.filter((r: string) => r !== relation);
		}
	}

	function handleAgeGroupChange(ageGroup: string, checked: boolean) {
		const specificAgeGroups = ['young', 'middle', 'senior'];

		if (checked) {
			// Add the age group
			const newAgeGroups = [...formData.ageGroups.filter((ag) => ag !== 'all'), ageGroup];

			// Check if all specific age groups are now selected
			if (specificAgeGroups.every((ag) => newAgeGroups.includes(ag))) {
				formData.ageGroups = ['all'];
			} else {
				formData.ageGroups = newAgeGroups;
			}
		} else {
			// If 'all' was selected, we need to keep the other two age groups
			if (formData.ageGroups.includes('all')) {
				formData.ageGroups = specificAgeGroups.filter((ag) => ag !== ageGroup);
			} else {
				// Just remove the specific age group
				formData.ageGroups = formData.ageGroups.filter((ag: string) => ag !== ageGroup);
			}
		}
	}

	async function generateWithAI() {
		if (isGenerating) return;

		try {
			isGenerating = true;
			generationError = '';

			const result = await generateSingleWish(formData);

			if (result.success && result.text) {
				formData.text = result.text;
				errors.text = '';
			} else {
				generationError = result.error || 'Unbekannter Fehler bei der KI-Generierung.';
			}
		} catch (error) {
			console.error('KI-Generierung fehlgeschlagen:', error);
			generationError = 'Ein unerwarteter Fehler ist aufgetreten.';
		} finally {
			isGenerating = false;
		}
	}

	async function handleBatchSave(wishes: any[]) {
		try {
			isSubmitting = true;

			// Create a hidden form and submit it using SvelteKit's form action
			const batchForm = document.createElement('form');
			batchForm.method = 'POST';
			batchForm.action = '?/createBatch';
			batchForm.style.display = 'none';

			const wishesInput = document.createElement('input');
			wishesInput.type = 'hidden';
			wishesInput.name = 'wishes';
			wishesInput.value = JSON.stringify(wishes);
			batchForm.appendChild(wishesInput);

			document.body.appendChild(batchForm);
			batchForm.submit();

			showAIBatchCreator = false;
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			alert('Fehler beim Speichern der Wünsche.');
		} finally {
			isSubmitting = false;
		}
	}

	function clearGenerationError() {
		generationError = '';
	}

	// Pool management functions
	function addToPool() {
		// Don't add if we're editing
		if (editingPoolItemId) {
			updatePoolItem();
			return;
		}

		// Basic validation
		if (!formData.text || formData.text.trim().length < 10) {
			errors.text = 'Wunschtext muss mindestens 10 Zeichen lang sein';
			return;
		}

		const poolWish = {
			...formData,
			id: crypto.randomUUID(),
			createdAt: new Date()
		};

		wishPool = [...wishPool, poolWish];
		hasUnsavedChanges = true;

		// Clear errors after successful addition
		errors = {};

		// Reset form for next wish but keep settings
		formData.text = 'Alles Gute zum Geburtstag, liebe/r [Name]!';
		formData.specificValues = '';
	}

	function removeFromPool(wishId: string) {
		wishPool = wishPool.filter((wish) => wish.id !== wishId);
		hasUnsavedChanges = wishPool.length > 0;

		// If we're editing this item, clear the editing state
		if (editingPoolItemId === wishId) {
			editingPoolItemId = null;
		}
	}

	function editPoolItem(wishId: string) {
		const wishToEdit = wishPool.find((wish) => wish.id === wishId);
		if (!wishToEdit) return;

		// Load the wish data into the form
		formData = {
			type: wishToEdit.type,
			eventType: wishToEdit.eventType,
			relations: [...wishToEdit.relations],
			ageGroups: [...wishToEdit.ageGroups],
			specificValues: wishToEdit.specificValues,
			text: wishToEdit.text,
			isBelated: wishToEdit.isBelated,
			language: wishToEdit.language,
			length: wishToEdit.length
		};

		// Set editing state
		editingPoolItemId = wishId;

		// Clear any errors
		errors = {};

		// Scroll to form
		document.querySelector('.card-body')?.scrollIntoView({ behavior: 'smooth' });
	}

	function updatePoolItem() {
		if (!editingPoolItemId) return;

		// Basic validation
		if (!formData.text || formData.text.trim().length < 10) {
			errors.text = 'Wunschtext muss mindestens 10 Zeichen lang sein';
			return;
		}

		// Update the item in the pool
		wishPool = wishPool.map((wish) =>
			wish.id === editingPoolItemId
				? {
						...formData,
						id: wish.id,
						createdAt: wish.createdAt
					}
				: wish
		);

		// Clear editing state
		editingPoolItemId = null;
		hasUnsavedChanges = true;

		// Clear errors
		errors = {};

		// Reset form for next wish
		formData.text = 'Alles Gute zum Geburtstag, liebe/r [Name]!';
		formData.specificValues = '';
	}

	function cancelEdit() {
		editingPoolItemId = null;

		// Reset form
		formData.text = 'Alles Gute zum Geburtstag, liebe/r [Name]!';
		formData.specificValues = '';

		// Clear errors
		errors = {};
	}

	function clearPool() {
		wishPool = [];
		hasUnsavedChanges = false;
	}

	async function savePoolAsStatus(status: WishStatus) {
		if (wishPool.length === 0) return;

		try {
			isSubmitting = true;

			// Prepare wishes for batch save
			const wishesToSave = wishPool.map((wish) => ({
				...wish,
				status: status
			}));

			// Create form data for batch save
			const batchForm = document.createElement('form');
			batchForm.method = 'POST';
			batchForm.action = '?/createBatch';
			batchForm.style.display = 'none';

			const wishesInput = document.createElement('input');
			wishesInput.type = 'hidden';
			wishesInput.name = 'wishes';
			wishesInput.value = JSON.stringify(wishesToSave);
			batchForm.appendChild(wishesInput);

			document.body.appendChild(batchForm);
			batchForm.submit();

			clearPool();
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			alert('Fehler beim Speichern der Wünsche.');
		} finally {
			isSubmitting = false;
		}
	}

	// Page navigation warning
	function handleBeforeUnload(event: BeforeUnloadEvent) {
		if (hasUnsavedChanges) {
			event.preventDefault();
			// Modern browsers ignore the custom message and show their own
			event.returnValue = '';
		}
	}
</script>

<svelte:head>
	<title>Neuen Wunsch erstellen - Wish Factory</title>
</svelte:head>

<svelte:window on:beforeunload={handleBeforeUnload} />

<!-- Page Header -->
<div class="mb-8">
	<div class="breadcrumbs mb-4 text-sm">
		<ul>
			<li><a href="/dashboard">Dashboard</a></li>
			<li><a href="/dashboard/wishes">Wünsche</a></li>
			<li>Neu erstellen</li>
		</ul>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Neuen Wunsch erstellen</h1>
			<p class="text-base-content/70 mt-2">
				Erstellen Sie personalisierte Wünsche für verschiedene Anlässe mit KI-Unterstützung
			</p>
			{#if wishPool.length > 0}
				<div class="mt-2 flex items-center gap-2">
					<div class="badge badge-primary">
						{wishPool.length} Wünsche im Pool
					</div>
					{#if hasUnsavedChanges}
						<div class="badge badge-warning">Ungespeichert</div>
					{/if}
				</div>
			{/if}
		</div>
		<div class="flex flex-wrap gap-3">
			{#if wishPool.length > 0}
				<button type="button" class="btn btn-info gap-2" onclick={() => (showPoolManager = true)}>
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
							d="M19 11H5m14-7H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6m-6 4h6"
						/>
					</svg>
					Pool verwalten ({wishPool.length})
				</button>
			{/if}

			<button
				type="button"
				class="btn btn-outline gap-2"
				onclick={() => (showPreview = !showPreview)}
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
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				{showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
			</button>

			<button
				type="button"
				class="btn btn-secondary gap-2"
				onclick={() => (showAIBatchCreator = true)}
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
						d="M19 11H5m14-7H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6m-6 4h6"
					/>
				</svg>
				Batch-Erstellung
			</button>

			<button type="button" class="btn btn-ghost gap-2" onclick={() => (showWorkflowHelp = true)}>
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
				Workflow-Hilfe
			</button>
		</div>
	</div>
</div>

<!-- Error Alert -->
{#if form?.message}
	<div class="alert alert-error mb-6">
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
		<span>{form.message}</span>
	</div>
{/if}

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main Form -->
	<div class="lg:col-span-2">
		<div class="card bg-base-100 border-base-200 border shadow-xl">
			<div class="card-body">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="card-title text-xl">
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
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						{#if editingPoolItemId}
							Wunsch bearbeiten
						{:else}
							Wunsch-Details
						{/if}
					</h2>
					<div class="badge badge-outline badge-lg">
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
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{#if editingPoolItemId}
							Bearbeitung
						{:else}
							Entwurf
						{/if}
					</div>
				</div>

				<form
					method="POST"
					action="?/create"
					onsubmit={(e) => {
						if (showAIBatchCreator) {
							e.preventDefault();
							return false;
						}
					}}
					use:enhance={() => {
						if (showAIBatchCreator) {
							return async () => {}; // Block submission
						}

						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<!-- Basic Information & Target Audience Sections -->
					<WishFormSection
						{formData}
						{errors}
						onRelationChange={handleRelationChange}
						onAgeGroupChange={handleAgeGroupChange}
					/>

					<!-- Hidden field for length -->
					<input type="hidden" name="length" value={formData.length} />

					<!-- Content Editor Section -->
					<WishContentEditor {formData} {errors} {isGenerating} onGenerateWithAI={generateWithAI} />

					<!-- Action Buttons -->
					{#if !showAIBatchCreator}
						<div class="flex flex-col gap-4 sm:flex-row sm:justify-between">
							<div class="flex flex-wrap gap-3">
								{#if editingPoolItemId}
									<button
										type="button"
										class="btn btn-success gap-2"
										onclick={updatePoolItem}
										disabled={isSubmitting}
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
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Änderungen speichern
									</button>
									<button
										type="button"
										class="btn btn-ghost gap-2"
										onclick={cancelEdit}
										disabled={isSubmitting}
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
								{:else}
									<button
										type="button"
										class="btn btn-primary gap-2"
										onclick={addToPool}
										disabled={isSubmitting}
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
												d="M12 6v6m0 0v6m0-6h6m-6 0H6"
											/>
										</svg>
										Zu Pool hinzufügen
									</button>
								{/if}

								<button
									type="button"
									class="btn btn-outline gap-2"
									onclick={generateWithAI}
									disabled={isGenerating}
								>
									{#if isGenerating}
										<span class="loading loading-spinner loading-sm"></span>
										Generiere...
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
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
										KI-Generierung
									{/if}
								</button>
							</div>

							{#if generationError}
								<div class="flex items-center gap-2">
									<div class="alert alert-error py-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 stroke-current"
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
										<span class="text-sm">{generationError}</span>
									</div>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={clearGenerationError}
										aria-label="Fehlermeldung schließen"
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
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</form>
			</div>
		</div>
	</div>

	<!-- Sidebar with Preview and Help -->
	<div class="lg:col-span-1">
		<WishPreview {formData} {showPreview} />

		<!-- Pool Summary -->
		{#if wishPool.length > 0}
			<div class="card bg-base-100 border-base-200 mb-6 border shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-lg">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-info h-5 w-5"
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
						Pool-Übersicht
						<div class="badge badge-info badge-sm ml-2">
							{wishPool.length}
						</div>
					</h2>

					<div class="space-y-3">
						{#each wishPool as wish, index (wish.id)}
							<div
								class="border-base-300 hover:bg-base-50 cursor-pointer rounded-lg border p-3 transition-colors {editingPoolItemId ===
								wish.id
									? 'border-primary bg-primary/5'
									: ''}"
								onclick={() => editPoolItem(wish.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										editPoolItem(wish.id);
									}
								}}
								role="button"
								tabindex="0"
								aria-label="Wunsch #{index + 1} bearbeiten"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium">#{index + 1}</span>
										<span class="badge badge-xs badge-outline">
											{wish.type === 'normal' ? 'Normal' : 'Lustig'}
										</span>
										{#if editingPoolItemId === wish.id}
											<span class="badge badge-xs badge-info"> Bearbeitung </span>
										{/if}
									</div>
									<span class="text-base-content/60 text-xs">
										{new Date(wish.createdAt).toLocaleTimeString('de-DE', {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>

								<div class="mb-2 text-sm">
									<div class="text-base-content/80 line-clamp-2">
										{wish.text}
									</div>
								</div>

								<div class="flex flex-wrap gap-1">
									<span class="badge badge-xs badge-ghost">
										{wish.eventType === 'birthday'
											? 'Geburtstag'
											: wish.eventType === 'anniversary'
												? 'Jubiläum'
												: 'Sonstiges'}
									</span>
									{#each wish.relations.slice(0, 2) as relation (relation)}
										<span class="badge badge-xs badge-ghost">
											{relation}
										</span>
									{/each}
									{#if wish.relations.length > 2}
										<span class="badge badge-xs badge-ghost">
											+{wish.relations.length - 2}
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<div class="mt-4 flex flex-col gap-2">
						<button
							type="button"
							class="btn btn-info btn-sm"
							onclick={() => (showPoolManager = true)}
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
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Pool verwalten
						</button>

						<div class="flex gap-2">
							<button
								type="button"
								class="btn btn-primary btn-sm flex-1"
								onclick={() => savePoolAsStatus(WishStatus.ENTWURF)}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									Entwurf
								{/if}
							</button>

							<button
								type="button"
								class="btn btn-secondary btn-sm flex-1"
								onclick={() => savePoolAsStatus(WishStatus.ZUR_FREIGABE)}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									Freigabe
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<WishHelpCard />
	</div>
</div>

<!-- AI Batch Creator Modal -->
<AIBatchCreator
	isOpen={showAIBatchCreator}
	{formData}
	onClose={() => (showAIBatchCreator = false)}
	onSaveBatch={handleBatchSave}
/>

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} />

<!-- Pool Manager Modal -->
{#if showPoolManager}
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">Wunsch-Pool verwalten</h3>
				<button
					class="btn btn-sm btn-circle btn-ghost"
					onclick={() => (showPoolManager = false)}
					aria-label="Pool Manager schließen"
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

			<div class="mb-4">
				<div class="stats stats-horizontal shadow">
					<div class="stat">
						<div class="stat-title">Wünsche im Pool</div>
						<div class="stat-value">{wishPool.length}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Status</div>
						<div class="stat-value text-base">
							{hasUnsavedChanges ? 'Ungespeichert' : 'Gespeichert'}
						</div>
					</div>
				</div>
			</div>

			<!-- Pool Content -->
			<div class="max-h-96 overflow-y-auto">
				{#each wishPool as wish, index (wish.id)}
					<div class="card bg-base-100 mb-4 border shadow-sm">
						<div class="card-body p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h4 class="font-semibold">
										Wunsch {index + 1}
										<span class="badge badge-sm ml-2">
											{wish.type === 'normal' ? 'Normal' : 'Lustig'}
										</span>
										<span class="badge badge-sm badge-outline ml-1">
											{wish.eventType === 'birthday'
												? 'Geburtstag'
												: wish.eventType === 'anniversary'
													? 'Jubiläum'
													: 'Benutzerdefiniert'}
										</span>
										{#if editingPoolItemId === wish.id}
											<span class="badge badge-sm badge-info ml-1"> Bearbeitung </span>
										{/if}
									</h4>
									<p class="text-base-content/70 mt-1 text-sm">
										{new Date(wish.createdAt).toLocaleString('de-DE')}
									</p>
									<div class="mt-2 text-sm">
										<div class="line-clamp-2">{wish.text}</div>
									</div>
									<div class="mt-2 flex flex-wrap gap-1">
										{#each wish.relations as relation (relation)}
											<span class="badge badge-xs badge-outline">{relation}</span>
										{/each}
									</div>
								</div>
								<div class="flex gap-2">
									<button
										class="btn btn-ghost btn-sm"
										onclick={() => {
											editPoolItem(wish.id);
											showPoolManager = false;
										}}
										aria-label="Wunsch bearbeiten"
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
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
									<button
										class="btn btn-ghost btn-sm"
										onclick={() => removeFromPool(wish.id)}
										aria-label="Wunsch aus Pool entfernen"
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
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pool Actions -->
			<div class="modal-action">
				<button class="btn btn-outline" onclick={clearPool}>Pool leeren</button>
				<button
					class="btn btn-primary"
					onclick={() => savePoolAsStatus(WishStatus.ENTWURF)}
					disabled={wishPool.length === 0 || isSubmitting}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
						Speichere...
					{:else}
						Als Entwurf speichern
					{/if}
				</button>
				<button
					class="btn btn-secondary"
					onclick={() => savePoolAsStatus(WishStatus.ZUR_FREIGABE)}
					disabled={wishPool.length === 0 || isSubmitting}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
						Speichere...
					{:else}
						Zur Freigabe speichern
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
