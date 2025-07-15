<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, WishStatus, Language, WishLength } from '$lib/types/Wish';
	import type { WishFormState } from '$lib/types/Wish.js';
	import { generateSingleWish } from '$lib/utils/ai-generation';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';
	import WishPreview from '$lib/components/wishes/WishPreview.svelte';
	import WishHelpCard from '$lib/components/wishes/WishHelpCard.svelte';
	import WishFormSection from '$lib/components/wishes/WishFormSection.svelte';
	import WishContentEditor from '$lib/components/wishes/WishContentEditor.svelte';
	import WishFormActions from '$lib/components/wishes/WishFormActions.svelte';
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

	let { form }: { form: ActionData } = $props();

	// Form state
	let formData: WishFormState = $state({
		type: (form?.values?.type as WishType) || WishType.NORMAL,
		eventType: (form?.values?.eventType as EventType) || EventType.BIRTHDAY,
		relations: form?.values?.relations || ['friend'], // Default to friend to satisfy validation
		ageGroups: form?.values?.ageGroups || ['all'], // Default to all ages to satisfy validation
		specificValues: form?.values?.specificValues || '',
		text: form?.values?.text || 'Alles Gute zum [Anlass], liebe/r [Name]!', // Default text to satisfy min length validation
		belated: form?.values?.belated || false,
		language: (form?.values?.language as Language) || Language.DE,
		status: (form?.values?.status as WishStatus) || WishStatus.ENTWURF,
		length: (form?.values?.length as WishLength) || WishLength.MEDIUM
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let showAIBatchCreator = $state(false);
	let isGenerating = $state(false);
	let generationError = $state('');
	let showWorkflowHelp = $state(false);

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
		if (checked) {
			formData.ageGroups = [...formData.ageGroups, ageGroup];
		} else {
			formData.ageGroups = formData.ageGroups.filter((ag: string) => ag !== ageGroup);
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
</script>

<svelte:head>
	<title>Neuen Wunsch erstellen - Wish Factory</title>
</svelte:head>

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
		</div>
		<div class="flex flex-wrap gap-3">
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
						Wunsch-Details
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
						Entwurf
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

					<!-- Hidden fields for status and length -->
					<input type="hidden" name="status" value={formData.status} />
					<input type="hidden" name="length" value={formData.length} />

					<!-- Content Editor Section -->
					<WishContentEditor {formData} {errors} {isGenerating} onGenerateWithAI={generateWithAI} />

					<!-- Action Buttons -->
					{#if !showAIBatchCreator}
						<WishFormActions {isSubmitting} {generationError} onClearError={clearGenerationError} />
					{/if}
				</form>
			</div>
		</div>
	</div>

	<!-- Sidebar with Preview and Help -->
	<div class="lg:col-span-1">
		<WishPreview {formData} {showPreview} />
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
