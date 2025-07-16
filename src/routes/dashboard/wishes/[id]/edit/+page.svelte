<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, Language, Relation, AgeGroup, WishLength } from '$lib/types/Wish';
	import type { WishFormState } from '$lib/types/Wish.js';
	import type { PageData } from './$types';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';
	import WishContentEditor from '$lib/components/wishes/WishContentEditor.svelte';

	const { data }: { data: PageData } = $props();

	// Form state - initialize with existing wish data
	const formData: WishFormState = $state({
		type: data.wish.type,
		eventType: data.wish.eventType,
		relations: [...data.wish.relations],
		ageGroups: [...data.wish.ageGroups],
		specificValues: data.wish.specificValues?.join(', ') || '',
		text: data.wish.text,
		belated: data.wish.belated || false,
		language: data.wish.language,
		status: data.wish.status,
		length:
			('length' in data.wish ? (data.wish.length as WishLength) : WishLength.MEDIUM) ||
			WishLength.MEDIUM
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let isGenerating = $state(false);
	let showDeleteModal = $state(false);
	let showWorkflowHelp = $state(false);

	// Validation state
	const errors = $state({} as Record<string, string>);

	// Form submission
	let formElement: HTMLFormElement;

	// Helper functions
	function handleRelationChange(relation: string, checked: boolean) {
		if (checked) {
			formData.relations = [...formData.relations, relation as Relation];
		} else {
			formData.relations = formData.relations.filter((r: string) => r !== relation);
		}
	}

	function handleAgeGroupChange(ageGroup: string, checked: boolean) {
		const specificAgeGroups = ['young', 'middle', 'senior'];

		if (checked) {
			// Add the age group
			const newAgeGroups = [
				...formData.ageGroups.filter((ag) => ag !== 'all'),
				ageGroup as AgeGroup
			];

			// Check if all specific age groups are now selected
			if (specificAgeGroups.every((ag) => newAgeGroups.includes(ag as AgeGroup))) {
				formData.ageGroups = ['all' as AgeGroup];
			} else {
				formData.ageGroups = newAgeGroups;
			}
		} else {
			// If 'all' was selected, we need to keep the other two age groups
			if (formData.ageGroups.includes('all' as AgeGroup)) {
				formData.ageGroups = specificAgeGroups.filter((ag) => ag !== ageGroup) as AgeGroup[];
			} else {
				// Just remove the specific age group
				formData.ageGroups = formData.ageGroups.filter((ag: string) => ag !== ageGroup);
			}
		}
	}

	function validateSpecificValues(value: string | number): boolean {
		const stringValue = typeof value === 'number' ? value.toString() : value;
		if (!stringValue.trim()) return true;
		const values = stringValue.split(',');
		return values.every((v) => {
			const num = parseInt(v.trim());
			return !isNaN(num) && num > 0;
		});
	}

	// German translations for display
	const typeLabels = {
		[WishType.NORMAL]: 'Normal',
		[WishType.HERZLICH]: 'Herzlich',
		[WishType.HUMORVOLL]: 'Humorvoll'
	};

	const eventTypeLabels = {
		[EventType.BIRTHDAY]: 'Geburtstag',
		[EventType.ANNIVERSARY]: 'Hochzeitstag',
		[EventType.CUSTOM]: 'Individuell'
	};

	const relationLabels = {
		[Relation.FRIEND]: 'Freund/in',
		[Relation.FAMILY]: 'Familie',
		[Relation.PARTNER]: 'Partner/in',
		[Relation.COLLEAGUE]: 'Kollege/in'
	};

	const ageGroupLabels = {
		[AgeGroup.ALL]: 'Alle Altersgruppen',
		[AgeGroup.YOUNG]: 'Jung (bis 30)',
		[AgeGroup.MIDDLE]: 'Mittel (30-60)',
		[AgeGroup.SENIOR]: 'Senior (60+)'
	};

	const lengthLabels = {
		[WishLength.SHORT]: 'Kurz (50-100 Zeichen)',
		[WishLength.MEDIUM]: 'Mittel (100-200 Zeichen)',
		[WishLength.LONG]: 'Lang (200-400 Zeichen)'
	};

	const languageLabels = {
		[Language.DE]: 'Deutsch',
		[Language.EN]: 'English'
	};

	async function generateWithAI() {
		if (isGenerating) return;

		try {
			isGenerating = true;

			// Import the generateSingleWish function
			const { generateSingleWish } = await import('$lib/utils/ai-generation');

			const result = await generateSingleWish(formData);

			if (result.success && result.text) {
				formData.text = result.text;
				errors.text = '';
			} else {
				errors.text = result.error || 'Unbekannter Fehler bei der KI-Generierung.';
			}
		} catch (error) {
			console.error('KI-Generierung fehlgeschlagen:', error);
			errors.text = 'Ein unerwarteter Fehler ist aufgetreten.';
		} finally {
			isGenerating = false;
		}
	}

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Check if form has changes
	function hasChanges() {
		// Helper function to normalize array comparison
		const arraysEqual = (a: string[], b: string[]) => {
			if (a.length !== b.length) return false;
			const sortedA = [...a].sort();
			const sortedB = [...b].sort();
			return sortedA.every((val, index) => val === sortedB[index]);
		};

		// Helper function to normalize specific values comparison
		const specificValuesEqual = (
			formValue: string | number,
			dbArray: number[] | undefined | null
		) => {
			const formString = typeof formValue === 'number' ? formValue.toString() : formValue;
			const formArray = formString
				.split(',')
				.map((v) => v.trim())
				.filter((v) => v !== '')
				.map((v) => parseInt(v))
				.filter((v) => !isNaN(v));

			const dbNormalized = dbArray || [];

			if (formArray.length !== dbNormalized.length) return false;

			const sortedForm = [...formArray].sort((a, b) => a - b);
			const sortedDb = [...dbNormalized].sort((a, b) => a - b);

			return sortedForm.every((val, index) => val === sortedDb[index]);
		};

		return (
			formData.type !== data.wish.type ||
			formData.eventType !== data.wish.eventType ||
			!arraysEqual(formData.relations, data.wish.relations) ||
			!arraysEqual(formData.ageGroups, data.wish.ageGroups) ||
			!specificValuesEqual(formData.specificValues, data.wish.specificValues) ||
			formData.text !== data.wish.text ||
			formData.belated !== (data.wish.belated ?? false) ||
			formData.language !== data.wish.language ||
			formData.length !==
				(('length' in data.wish ? (data.wish.length as WishLength) : WishLength.MEDIUM) ||
					WishLength.MEDIUM)
		);
	}
</script>

<svelte:head>
	<title>Wunsch {data.wish.id} bearbeiten - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="breadcrumbs mb-4 text-sm">
		<ul>
			<li><a href="/dashboard" class="link-hover">Dashboard</a></li>
			<li><a href="/dashboard/wishes" class="link-hover">Wünsche</a></li>
			<li><a href="/dashboard/wishes/{data.wish.id}" class="link-hover">{data.wish.id}</a></li>
			<li>Bearbeiten</li>
		</ul>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Wunsch bearbeiten</h1>
			<p class="text-base-content/70 mt-2">
				Bearbeiten Sie den Wunsch {data.wish.id}
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (showWorkflowHelp = true)}>
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
				Hilfe
			</button>
			<button
				type="button"
				class="btn btn-outline btn-sm"
				onclick={() => (showPreview = !showPreview)}
				disabled={!formData.text}
			>
				{showPreview ? 'Bearbeiten' : 'Vorschau'}
			</button>
		</div>
	</div>
</div>

<!-- Changes Alert -->
{#if hasChanges()}
	<div class="alert alert-warning mb-6">
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
		<div>
			<h3 class="font-bold">Nicht gespeicherte Änderungen</h3>
			<div class="text-xs">
				Sie haben Änderungen vorgenommen, die noch nicht gespeichert wurden.
			</div>
		</div>
	</div>
{/if}

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main Form -->
	<div class="lg:col-span-2">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="card-title">
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
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						Wunsch-Details
					</h2>
					<div class="text-base-content/70 text-sm">
						Erstellt: {formatDate(data.wish.createdAt)}
					</div>
				</div>

				<form
					bind:this={formElement}
					method="POST"
					action="?/update"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<!-- Hidden ID field -->
					<input type="hidden" name="id" value={data.wish.id} />

					<!-- Basis-Informationen -->
					<div class="bg-base-50 mb-6 rounded-lg p-6">
						<h3 class="text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-primary h-5 w-5"
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
							Basis-Informationen
						</h3>
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<!-- Stil -->
							<div class="form-control">
								<label class="label" for="type">
									<span class="label-text flex items-center gap-2 text-base font-medium">
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
												d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
											/>
										</svg>
										Stil *
									</span>
								</label>
								<select
									id="type"
									name="type"
									class="select-bordered select select-lg w-full"
									bind:value={formData.type}
									required
								>
									{#each Object.values(WishType) as wishType (wishType)}
										<option value={wishType}>{typeLabels[wishType]}</option>
									{/each}
								</select>
							</div>

							<!-- Anlass -->
							<div class="form-control">
								<label class="label" for="eventType">
									<span class="label-text flex items-center gap-2 text-base font-medium">
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
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										Anlass *
									</span>
								</label>
								<select
									id="eventType"
									name="eventType"
									class="select-bordered select select-lg w-full"
									bind:value={formData.eventType}
									required
								>
									{#each Object.values(EventType) as eventType (eventType)}
										<option value={eventType}>{eventTypeLabels[eventType]}</option>
									{/each}
								</select>
							</div>

							<!-- Sprache -->
							<div class="form-control">
								<label class="label" for="language">
									<span class="label-text flex items-center gap-2 text-base font-medium">
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
												d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
											/>
										</svg>
										Sprache *
									</span>
								</label>
								<select
									id="language"
									name="language"
									class="select-bordered select select-lg w-full"
									bind:value={formData.language}
									required
								>
									{#each Object.values(Language) as language (language)}
										<option value={language}>{languageLabels[language]}</option>
									{/each}
								</select>
							</div>

							<!-- Length -->
							<div class="form-control">
								<label class="label" for="length">
									<span class="label-text flex items-center gap-2 text-base font-medium">
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
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Länge
									</span>
								</label>
								<select
									id="length"
									name="length"
									class="select-bordered select select-lg w-full"
									bind:value={formData.length}
									required
								>
									{#each Object.values(WishLength) as length (length)}
										<option value={length}>{lengthLabels[length]}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<!-- Zielgruppe -->
					<div class="bg-base-50 mb-6 rounded-lg p-6">
						<h3 class="text-secondary mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-secondary h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							Zielgruppe
						</h3>

						<!-- Beziehungen -->
						<fieldset class="form-control mb-6">
							<legend class="label">
								<span class="label-text flex items-center gap-2 text-base font-medium">
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
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									Beziehung *
								</span>
								<span class="label-text-alt badge badge-neutral badge-sm"
									>Mehrere Auswahl möglich</span
								>
							</legend>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
								{#each Object.values(Relation) as relation (relation)}
									<label
										class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {formData.relations.includes(
											relation
										)
											? 'border-secondary bg-secondary/5'
											: 'border-base-300'}"
									>
										<input
											type="checkbox"
											name="relations"
											value={relation}
											class="checkbox checkbox-secondary"
											checked={formData.relations.includes(relation)}
											onchange={(e) => handleRelationChange(relation, e.currentTarget.checked)}
										/>
										<span class="label-text ml-3 font-medium">{relationLabels[relation]}</span>
									</label>
								{/each}
							</div>
						</fieldset>

						<!-- Altersgruppen -->
						<fieldset class="form-control mb-6">
							<legend class="label">
								<span class="label-text flex items-center gap-2 text-base font-medium">
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
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									Altersgruppe *
								</span>
								<span class="label-text-alt badge badge-neutral badge-sm"
									>Mehrere Auswahl möglich</span
								>
							</legend>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
								{#each Object.values(AgeGroup).filter((ag) => ag !== 'all') as ageGroup (ageGroup)}
									{@const isChecked =
										formData.ageGroups.includes('all' as AgeGroup) ||
										formData.ageGroups.includes(ageGroup)}
									<label
										class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {isChecked
											? 'border-primary bg-primary/5'
											: 'border-base-300'}"
									>
										<input
											type="checkbox"
											name="ageGroups"
											value={ageGroup}
											class="checkbox checkbox-primary"
											checked={isChecked}
											onchange={(e) => handleAgeGroupChange(ageGroup, e.currentTarget.checked)}
										/>
										<span class="label-text ml-3 font-medium">{ageGroupLabels[ageGroup]}</span>
									</label>
								{/each}
							</div>
						</fieldset>
					</div>

					<!-- Spezifische Werte -->
					<div class="form-control">
						<label class="label" for="specificValues">
							<span class="label-text flex items-center gap-2 text-base font-medium">
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
										d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
									/>
								</svg>
								Spezifische Werte
							</span>
							<span class="label-text-alt">z.B. 18, 30, 50 (durch Komma getrennt)</span>
						</label>
						<input
							id="specificValues"
							name="specificValues"
							type="text"
							placeholder="18, 30, 50, 65"
							class="input-bordered input input-lg w-full"
							class:input-error={!validateSpecificValues(formData.specificValues)}
							bind:value={formData.specificValues}
						/>
						{#if formData.specificValues && !validateSpecificValues(formData.specificValues)}
							<div class="label">
								<span class="label-text-alt text-error"
									>Bitte nur positive Zahlen, getrennt durch Kommas</span
								>
							</div>
						{/if}
					</div>

					<!-- Content Editor Section -->
					<WishContentEditor
						{formData}
						{errors}
						{isGenerating}
						onGenerateWithAI={generateWithAI}
						wishId={data.wish.id}
					/>

					<!-- Action Buttons -->
					<div class="card-actions mt-8 justify-between">
						<button
							type="button"
							class="btn btn-error btn-outline"
							onclick={() => (showDeleteModal = true)}
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Löschen
						</button>

						<div class="flex gap-2">
							<a href="/dashboard/wishes/{data.wish.id}" class="btn btn-outline"> Abbrechen </a>
							<button
								type="submit"
								class="btn btn-primary"
								class:loading={isSubmitting}
								disabled={isSubmitting || !hasChanges()}
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-sm"></span>
									Speichern...
								{:else}
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
									Änderungen speichern
								{/if}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>

	<!-- Sidebar with Preview and Info -->
	<div class="lg:col-span-1">
		<!-- Preview Card -->
		{#if showPreview && formData.text}
			<div class="card bg-base-100 mb-6 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">
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
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						Vorschau
					</h3>
					<div class="divider my-2"></div>
					<div class="mockup-window border-base-300 bg-base-200 border">
						<div class="bg-base-200 px-4 py-6">
							<h4 class="text-primary font-medium">Haupttext:</h4>
							<p class="mb-4 text-sm">{formData.text}</p>
							{#if formData.belated}
								<div class="mt-3 flex items-center gap-2">
									<div class="badge badge-warning gap-2">
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
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Nachträglicher Wunsch
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Original Wish Info -->
		<div class="card bg-base-100 mb-6 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">
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
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Original-Info
				</h3>
				<div class="divider my-2"></div>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>ID:</span>
						<span class="font-mono">{data.wish.id}</span>
					</div>
					<div class="flex justify-between">
						<span>Erstellt:</span>
						<span>{formatDate(data.wish.createdAt)}</span>
					</div>
					<div class="flex justify-between">
						<span>Aktualisiert:</span>
						<span>{formatDate(data.wish.updatedAt)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Help Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">
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
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Hilfe & Tipps
				</h3>
				<div class="divider my-2"></div>
				<div class="space-y-4 text-sm">
					<div>
						<h4 class="font-medium">📝 Platzhalter verwenden:</h4>
						<ul class="mt-1 list-inside list-disc space-y-1 text-xs opacity-70">
							<li><code>[Name]</code> - Name der Person</li>
							<li><code>[Anlass]</code> - Grund der Feier</li>
							<li><code>[Alter]</code> - Lebensalter</li>
							<li><code>[Zahl]</code> - Spezifischer Wert</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium">💾 Speichern:</h4>
						<p class="text-xs opacity-70">
							Der Button ist nur aktiv, wenn Änderungen vorgenommen wurden.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Wunsch löschen</h3>
			<p class="mb-4">
				Möchten Sie den Wunsch <strong>{data.wish.id}</strong> wirklich löschen?
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
				<form method="POST" action="?/delete" style="display: inline;">
					<input type="hidden" name="id" value={data.wish.id} />
					<button type="submit" class="btn btn-error">Löschen</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} />
