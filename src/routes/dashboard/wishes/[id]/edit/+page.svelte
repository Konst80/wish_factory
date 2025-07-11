<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, WishStatus, Language, Relation, AgeGroup } from '$lib/types/Wish';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state - initialize with existing wish data
	let formData = $state({
		type: data.wish.type,
		eventType: data.wish.eventType,
		relations: [...data.wish.relations],
		ageGroups: [...data.wish.ageGroups],
		specificValues: data.wish.specificValues?.join(', ') || '',
		text: data.wish.text,
		belated: data.wish.belated || false,
		language: data.wish.language,
		status: data.wish.status
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let showAIGenerator = $state(false);
	let isGenerating = $state(false);
	let generationError = $state('');
	let wishCount = $state(3);
	let additionalInstructions = $state('');
	let showDeleteModal = $state(false);

	// Validation state (currently unused but kept for future validation)
	// let errors = $state({});

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
		if (checked) {
			formData.ageGroups = [...formData.ageGroups, ageGroup as AgeGroup];
		} else {
			formData.ageGroups = formData.ageGroups.filter((a: string) => a !== ageGroup);
		}
	}

	function validateSpecificValues(value: string): boolean {
		if (!value.trim()) return true;
		const values = value.split(',');
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
		[EventType.ANNIVERSARY]: 'Jubiläum',
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

	const statusLabels = {
		[WishStatus.ENTWURF]: 'Entwurf',
		[WishStatus.ZUR_FREIGABE]: 'Zur Freigabe',
		[WishStatus.FREIGEGEBEN]: 'Freigegeben',
		[WishStatus.ARCHIVIERT]: 'Archiviert'
	};

	const languageLabels = {
		[Language.DE]: 'Deutsch',
		[Language.EN]: 'English'
	};

	async function generateWithAI() {
		isGenerating = true;
		generationError = '';

		try {
			// API-Aufruf zur echten KI-Generierung
			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					type: formData.type,
					eventType: formData.eventType,
					language: formData.language,
					relations: formData.relations as Relation[],
					ageGroups: formData.ageGroups as AgeGroup[],
					specificValues: formData.specificValues
						? formData.specificValues
								.split(',')
								.map((v) => parseInt(v.trim()))
								.filter((v) => !isNaN(v))
						: [],
					style: formData.type,
					count: wishCount,
					additionalInstructions
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `API-Fehler: ${response.status}`);
			}

			const data = await response.json();

			if (data.success && data.wishes && data.wishes.length > 0) {
				const wish = data.wishes[0]; // Nehme den ersten generierten Wunsch
				formData.text = wish.text;
				formData.belated = wish.belated;
				showAIGenerator = false;
			} else {
				throw new Error('Keine Wünsche generiert');
			}
		} catch (error) {
			console.error('Fehler bei der KI-Generierung:', error);
			generationError =
				error instanceof Error
					? error.message
					: 'Fehler bei der Generierung. Bitte versuche es später erneut.';
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
		const specificValuesEqual = (formString: string, dbArray: number[] | undefined | null) => {
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
			formData.status !== data.wish.status
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
			<button
				type="button"
				class="btn btn-outline btn-sm"
				onclick={() => (showPreview = !showPreview)}
				disabled={!formData.text}
			>
				{showPreview ? 'Bearbeiten' : 'Vorschau'}
			</button>
			<button type="button" class="btn btn-primary btn-sm" onclick={() => (showAIGenerator = true)}>
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
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
				Mit KI generieren
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

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Wunsch-Typ -->
						<div class="form-control">
							<label class="label" for="type">
								<span class="label-text font-medium">Wunsch-Typ *</span>
							</label>
							<select
								id="type"
								name="type"
								class="select-bordered select w-full"
								bind:value={formData.type}
								required
							>
								{#each Object.values(WishType) as type (type)}
									<option value={type}>{typeLabels[type]}</option>
								{/each}
							</select>
						</div>

						<!-- Anlass -->
						<div class="form-control">
							<label class="label" for="eventType">
								<span class="label-text font-medium">Anlass *</span>
							</label>
							<select
								id="eventType"
								name="eventType"
								class="select-bordered select w-full"
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
								<span class="label-text font-medium">Sprache *</span>
							</label>
							<select
								id="language"
								name="language"
								class="select-bordered select w-full"
								bind:value={formData.language}
								required
							>
								{#each Object.values(Language) as language (language)}
									<option value={language}>{languageLabels[language]}</option>
								{/each}
							</select>
						</div>

						<!-- Status -->
						<div class="form-control">
							<label class="label" for="status">
								<span class="label-text font-medium">Status</span>
							</label>
							<select
								id="status"
								name="status"
								class="select-bordered select w-full"
								bind:value={formData.status}
							>
								{#each Object.values(WishStatus) as status (status)}
									<option value={status}>{statusLabels[status]}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Beziehungen -->
					<div class="form-control mt-6">
						<label class="label">
							<span class="label-text font-medium">Ziel-Beziehungen *</span>
							<span class="label-text-alt">Mindestens eine auswählen</span>
						</label>
						<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
							{#each Object.values(Relation) as relation (relation)}
								<label class="label cursor-pointer justify-start">
									<input
										type="checkbox"
										name="relations"
										value={relation}
										class="checkbox checkbox-primary"
										checked={formData.relations.includes(relation)}
										onchange={(e) => handleRelationChange(relation, e.currentTarget.checked)}
									/>
									<span class="label-text ml-3">{relationLabels[relation]}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Altersgruppen -->
					<div class="form-control mt-6">
						<label class="label">
							<span class="label-text font-medium">Ziel-Altersgruppen *</span>
							<span class="label-text-alt">Mindestens eine auswählen</span>
						</label>
						<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
							{#each Object.values(AgeGroup) as ageGroup (ageGroup)}
								<label class="label cursor-pointer justify-start">
									<input
										type="checkbox"
										name="ageGroups"
										value={ageGroup}
										class="checkbox checkbox-primary"
										checked={formData.ageGroups.includes(ageGroup)}
										onchange={(e) => handleAgeGroupChange(ageGroup, e.currentTarget.checked)}
									/>
									<span class="label-text ml-3">{ageGroupLabels[ageGroup]}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Spezifische Werte -->
					<div class="form-control mt-6">
						<label class="label" for="specificValues">
							<span class="label-text font-medium">Spezifische Werte</span>
							<span class="label-text-alt">z.B. 18, 30, 50 (durch Komma getrennt)</span>
						</label>
						<input
							id="specificValues"
							name="specificValues"
							type="text"
							placeholder="18, 30, 50, 65"
							class="input-bordered input w-full"
							class:input-error={!validateSpecificValues(formData.specificValues)}
							bind:value={formData.specificValues}
						/>
						{#if formData.specificValues && !validateSpecificValues(formData.specificValues)}
							<label class="label">
								<span class="label-text-alt text-error"
									>Bitte nur positive Zahlen, getrennt durch Kommas</span
								>
							</label>
						{/if}
					</div>

					<!-- Haupttext -->
					<div class="form-control mt-6">
						<label class="label" for="text">
							<span class="label-text font-medium">Wunsch-Text *</span>
							<span class="label-text-alt">{formData.text.length}/1000</span>
						</label>
						<textarea
							id="text"
							name="text"
							rows="6"
							placeholder="Liebe/r [Name], zu deinem [Anlass] wünsche ich dir..."
							class="textarea-bordered textarea w-full"
							bind:value={formData.text}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">
								Verwenden Sie Platzhalter wie [Name], [Anlass], [Alter] für dynamische Inhalte
							</span>
						</label>
					</div>

					<!-- Nachträglicher Wunsch Status -->
					<div class="form-control mt-6">
						<div class="flex items-center justify-between">
							<span class="label-text font-medium">Nachträglicher Wunsch</span>
							<div class="flex items-center gap-2">
								{#if formData.belated}
									<div class="badge badge-warning gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Nachträglich
									</div>
								{:else}
									<div class="badge badge-neutral gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Normal
									</div>
								{/if}
							</div>
						</div>
						<input type="hidden" name="belated" value={formData.belated} />
						<div class="mt-2">
							<span class="text-base-content/60 text-sm">
								{formData.belated ? 'Dieser Wunsch ist als nachträglich markiert' : 'Dieser Wunsch ist als regulärer Wunsch markiert'}
							</span>
						</div>
					</div>

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

		<!-- KI Generator Dialog -->
		<div class="modal {showAIGenerator ? 'modal-open' : ''}">
			<div class="modal-box max-w-3xl">
				<h3 class="mb-4 text-lg font-bold">Wunsch mit KI regenerieren</h3>

				<div class="space-y-4">
					<div class="alert alert-info">
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
						<span
							>Dies wird den aktuellen Text ersetzen. Stellen Sie sicher, dass Sie Änderungen
							gespeichert haben.</span
						>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Anzahl der Wünsche</span>
						</label>
						<input
							type="number"
							min="1"
							max="5"
							class="input-bordered input w-20"
							bind:value={wishCount}
						/>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Zusätzliche Anweisungen</span>
						</label>
						<textarea
							class="textarea-bordered textarea h-24"
							placeholder="Zusätzliche Hinweise für die KI (optional)"
							bind:value={additionalInstructions}
						></textarea>
					</div>

					{#if generationError}
						<div class="alert alert-error mt-4">
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
							<span>{generationError}</span>
						</div>
					{/if}

					<div class="modal-action">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => (showAIGenerator = false)}
							disabled={isGenerating}
						>
							Abbrechen
						</button>
						<button
							type="button"
							class="btn btn-primary"
							onclick={generateWithAI}
							disabled={isGenerating}
						>
							{#if isGenerating}
								<span class="loading loading-spinner"></span>
								Generiere...
							{:else}
								Regenerieren
							{/if}
						</button>
					</div>
				</div>
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
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
					<div class="flex justify-between">
						<span>Status:</span>
						<span class="badge badge-sm">{data.wish.status}</span>
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
					<div>
						<h4 class="font-medium">🔄 Status-Änderung:</h4>
						<p class="text-xs opacity-70">Beachten Sie Workflow-Regeln beim Ändern des Status.</p>
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
