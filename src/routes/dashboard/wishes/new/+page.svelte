<script lang="ts">
	import { enhance } from '$app/forms';
	import { WishType, EventType, WishStatus, Language, Relation, AgeGroup } from '$lib/types/Wish';

	// Erweiterte ActionData Type Definition
	type ActionData = {
		message?: string;
		errors?: Record<string, string>;
		values?: {
			type?: string;
			eventType?: string;
			relations?: string[];
			ageGroups?: string[];
			specificValues?: number[];
			text?: string;
			belated?: string;
			language?: string;
			status?: string;
		};
	} | null;

	let { form }: { form: ActionData } = $props();

	// Form state
	let formData = $state({
		type: form?.values?.type || WishType.NORMAL,
		eventType: form?.values?.eventType || EventType.BIRTHDAY,
		relations: form?.values?.relations || [],
		ageGroups: form?.values?.ageGroups || [],
		specificValues: form?.values?.specificValues?.join(', ') || '',
		text: form?.values?.text || '',
		belated: form?.values?.belated || '',
		language: form?.values?.language || Language.DE,
		status: form?.values?.status || WishStatus.ENTWURF
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let showAIGenerator = $state(false);
	let isGenerating = $state(false);
	let generationError = $state('');
	let wishCount = $state(3);
	let wishStyle = $state('normal');
	let additionalInstructions = $state('');

	// Validation state
	let errors = $state(form?.errors || {});

	// Form submission
	let formElement: HTMLFormElement;

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
		[WishType.FUNNY]: 'Lustig'
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
			// Hier wird später die tatsächliche API-Integration eingebaut
			// Dies ist nur ein Mock für die UI
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Beispieltext generieren basierend auf den ausgewählten Optionen
			const exampleTexts = [
				'Alles Liebe zum Geburtstag, [Name]! Mögest du einen wundervollen Tag mit deinen Liebsten verbringen.',
				'Herzlichen Glückwunsch zum Geburtstag, [Name]! 🎉',
				'Zum Geburtstag alles Gute, [Name]! Bleib so wie du bist!'
			];

			// Setze den ersten generierten Text als Vorschlag
			formData.text = exampleTexts[0];

			// Schließe den Dialog nach erfolgreicher Generierung
			showAIGenerator = false;
		} catch (error) {
			console.error('Fehler bei der KI-Generierung:', error);
			generationError = 'Fehler bei der Generierung. Bitte versuche es später erneut.';
		} finally {
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>Neuen Wunsch erstellen - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="breadcrumbs mb-4 text-sm">
		<ul>
			<li><a href="/dashboard" class="link-hover">Dashboard</a></li>
			<li><a href="/dashboard/wishes" class="link-hover">Wünsche</a></li>
			<li>Neuer Wunsch</li>
		</ul>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Neuen Wunsch erstellen</h1>
			<p class="text-base-content/70 mt-2">
				Erstellen Sie einen neuen Wunsch mit allen erforderlichen Informationen
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

<!-- Error Alert -->
{#if form?.message && form.message !== 'Validierungsfehler'}
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
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-6">
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

				<form
					bind:this={formElement}
					method="POST"
					action="?/create"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
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
								class:select-error={errors.type}
								bind:value={formData.type}
								required
							>
								{#each Object.values(WishType) as type (type)}
									<option value={type}>{typeLabels[type]}</option>
								{/each}
							</select>
							{#if errors.type}
								<label class="label">
									<span class="label-text-alt text-error">{errors.type}</span>
								</label>
							{/if}
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
								class:select-error={errors.eventType}
								bind:value={formData.eventType}
								required
							>
								{#each Object.values(EventType) as eventType (eventType)}
									<option value={eventType}>{eventTypeLabels[eventType]}</option>
								{/each}
							</select>
							{#if errors.eventType}
								<label class="label">
									<span class="label-text-alt text-error">{errors.eventType}</span>
								</label>
							{/if}
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
								class:select-error={errors.language}
								bind:value={formData.language}
								required
							>
								{#each Object.values(Language) as language (language)}
									<option value={language}>{languageLabels[language]}</option>
								{/each}
							</select>
							{#if errors.language}
								<label class="label">
									<span class="label-text-alt text-error">{errors.language}</span>
								</label>
							{/if}
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
										class:checkbox-error={errors.relations}
										checked={formData.relations.includes(relation)}
										onchange={(e) => handleRelationChange(relation, e.currentTarget.checked)}
									/>
									<span class="label-text ml-3">{relationLabels[relation]}</span>
								</label>
							{/each}
						</div>
						{#if errors.relations}
							<label class="label">
								<span class="label-text-alt text-error">{errors.relations}</span>
							</label>
						{/if}
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
										class:checkbox-error={errors.ageGroups}
										checked={formData.ageGroups.includes(ageGroup)}
										onchange={(e) => handleAgeGroupChange(ageGroup, e.currentTarget.checked)}
									/>
									<span class="label-text ml-3">{ageGroupLabels[ageGroup]}</span>
								</label>
							{/each}
						</div>
						{#if errors.ageGroups}
							<label class="label">
								<span class="label-text-alt text-error">{errors.ageGroups}</span>
							</label>
						{/if}
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
							class:input-error={errors.specificValues ||
								!validateSpecificValues(formData.specificValues)}
							bind:value={formData.specificValues}
						/>
						{#if errors.specificValues}
							<label class="label">
								<span class="label-text-alt text-error">{errors.specificValues}</span>
							</label>
						{:else if formData.specificValues && !validateSpecificValues(formData.specificValues)}
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
							class:textarea-error={errors.text}
							bind:value={formData.text}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">
								Verwenden Sie Platzhalter wie [Name], [Anlass], [Alter] für dynamische Inhalte
							</span>
						</label>
						{#if errors.text}
							<label class="label">
								<span class="label-text-alt text-error">{errors.text}</span>
							</label>
						{/if}
					</div>

					<!-- Nachträglicher Text -->
					<div class="form-control mt-6">
						<label class="label" for="belated">
							<span class="label-text font-medium">Nachträglicher Text *</span>
							<span class="label-text-alt">{formData.belated.length}/1000</span>
						</label>
						<textarea
							id="belated"
							name="belated"
							rows="4"
							placeholder="Liebe/r [Name], auch wenn ich zu spät dran bin..."
							class="textarea-bordered textarea w-full"
							class:textarea-error={errors.belated}
							bind:value={formData.belated}
							required
						></textarea>
						<label class="label">
							<span class="label-text-alt">
								Text für verspätete Glückwünsche mit Platzhaltern
							</span>
						</label>
						{#if errors.belated}
							<label class="label">
								<span class="label-text-alt text-error">{errors.belated}</span>
							</label>
						{/if}
					</div>

					<!-- Action Buttons -->
					<div class="card-actions mt-8 justify-end">
						<a href="/dashboard/wishes" class="btn btn-outline"> Abbrechen </a>
						<button
							type="submit"
							class="btn btn-primary"
							class:loading={isSubmitting}
							disabled={isSubmitting}
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
								Wunsch erstellen
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- KI Generator Dialog -->
		<div class="modal {showAIGenerator ? 'modal-open' : ''}">
			<div class="modal-box max-w-3xl">
				<h3 class="mb-4 text-lg font-bold">Wunsch mit KI generieren</h3>

				<div class="space-y-4">
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
							<span class="label-text">Stil</span>
						</label>
						<select class="select-bordered select w-full" bind:value={wishStyle}>
							<option value="normal">Normal</option>
							<option value="humorvoll">Humorvoll</option>
							<option value="formell">Formell</option>
							<option value="herzlich">Herzlich</option>
						</select>
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
								Generieren
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Sidebar with Preview and Help -->
	<div class="lg:col-span-1">
		<!-- Preview Card -->
		{#if showPreview && formData.text}
			<div class="card mb-6 bg-base-100 shadow-xl">
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
					<div class="mockup-window border border-base-300 bg-base-200">
						<div class="bg-base-200 px-4 py-6">
							<h4 class="font-medium text-primary">Haupttext:</h4>
							<p class="mb-4 text-sm">{formData.text}</p>
							{#if formData.belated}
								<h4 class="font-medium text-secondary">Nachträglich:</h4>
								<p class="text-sm">{formData.belated}</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

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
						<h4 class="font-medium">🎯 Zielgruppen:</h4>
						<p class="text-xs opacity-70">
							Wählen Sie passende Beziehungen und Altersgruppen für maximale Relevanz.
						</p>
					</div>
					<div>
						<h4 class="font-medium">🔢 Spezifische Werte:</h4>
						<p class="text-xs opacity-70">
							Zahlen für Meilensteine (18, 30, 50, etc.) helfen bei der Personalisierung.
						</p>
					</div>
					<div>
						<h4 class="font-medium">📋 Status-Info:</h4>
						<ul class="mt-1 list-inside list-disc space-y-1 text-xs opacity-70">
							<li><strong>Entwurf:</strong> Noch in Bearbeitung</li>
							<li><strong>Zur Freigabe:</strong> Bereit zur Prüfung</li>
							<li><strong>Freigegeben:</strong> Öffentlich verfügbar</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
