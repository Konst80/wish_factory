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
	let showAIBatchCreator = $state(false);
	let isGenerating = $state(false);
	let generationError = $state('');
	let wishStyle = $state('normal');

	// AI Batch Creation State
	type GeneratedWish = {
		id: string;
		type: WishType;
		eventType: EventType;
		relations: Relation[];
		ageGroups: AgeGroup[];
		specificValues: string;
		text: string;
		belated: string;
		language: Language;
		status: WishStatus;
		metadata: {
			style: string;
			generated: boolean;
			timestamp: string;
		};
	};

	// let batchMode = $state('single'); // 'single' | 'batch' - unused for now
	let batchSettings = $state({
		count: 5,
		variations: ['normal', 'herzlich', 'humorvoll'],
		includeAlternatives: true,
		// Optionale Filter - wenn leer, werden die Hauptformular-Werte verwendet
		types: [] as string[], // WishType[]
		eventTypes: [] as string[], // EventType[]
		languages: [] as string[], // Language[]
		relations: [] as string[], // Relation[]
		ageGroups: [] as string[], // AgeGroup[]
		specificValues: '', // Spezifische Alter oder Hochzeitstage
		// Legacy-Optionen für Kompatibilität
		generateForAllAgeGroups: false,
		generateForAllRelations: false
	});
	let generatedWishes = $state<GeneratedWish[]>([]);
	let selectedGeneratedWishes = $state<string[]>([]);
	let currentStep = $state(1); // 1: Configure, 2: Generate, 3: Review, 4: Save

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

			// Generate text based on current form settings
			const eventTypeText = eventTypeLabels[formData.eventType as EventType] || 'Anlass';
			const isHumorous = wishStyle === 'humorvoll';
			const isFormal = wishStyle === 'formell';
			const isHeartfelt = wishStyle === 'herzlich';

			let generatedText = '';
			let generatedBelated = '';

			if (isFormal) {
				generatedText = `Zum ${eventTypeText} möchte ich Ihnen, [Name], meine herzlichsten Glückwünsche aussprechen. Möge dieser besondere Tag voller Freude und Erfolg für Sie sein.`;
				generatedBelated = `Sehr geehrte/r [Name], auch wenn meine Glückwünsche etwas verspätet sind, möchte ich Ihnen nachträglich alles Gute zum ${eventTypeText} wünschen.`;
			} else if (isHumorous) {
				generatedText = `Happy ${eventTypeText}, [Name]! 🎉 Hoffentlich ist dein Tag genauso toll wie du! Lass es krachen und vergiss nicht: Kalorien zählen heute nicht! 😄`;
				generatedBelated = `[Name], sorry dass ich zu spät dran bin! 😅 Aber hey, gute Wünsche haben kein Verfallsdatum - alles Gute nachträglich zum ${eventTypeText}! 🎂`;
			} else if (isHeartfelt) {
				generatedText = `Von Herzen alles Gute zum ${eventTypeText}, liebe/r [Name]! Du bedeutest mir so viel und ich wünsche dir, dass all deine Träume in Erfüllung gehen. Möge dein Tag voller Liebe und Freude sein.`;
				generatedBelated = `Mein/e liebe/r [Name], auch wenn ich etwas spät dran bin - von ganzem Herzen alles Gute zum ${eventTypeText}! Du verdienst all das Glück der Welt.`;
			} else {
				generatedText = `Alles Liebe zum ${eventTypeText}, [Name]! Mögest du einen wundervollen Tag mit deinen Liebsten verbringen und viele schöne Momente erleben.`;
				generatedBelated = `Liebe/r [Name], auch wenn ich etwas spät dran bin - alles Gute zum ${eventTypeText}! Ich hoffe, du hattest einen fantastischen Tag.`;
			}

			// Set generated texts
			formData.text = generatedText;
			formData.belated = generatedBelated;
		} catch (error) {
			console.error('Fehler bei der KI-Generierung:', error);
			generationError = 'Fehler bei der Generierung. Bitte versuche es später erneut.';
		} finally {
			isGenerating = false;
		}
	}

	async function generateBatchWishes() {
		isGenerating = true;
		generationError = '';
		currentStep = 2;

		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Determine which values to use for generation - batch settings override main form
			const typesToGenerate =
				batchSettings.types.length > 0 ? batchSettings.types : [formData.type];
			const eventTypesToGenerate =
				batchSettings.eventTypes.length > 0 ? batchSettings.eventTypes : [formData.eventType];
			const languagesToGenerate =
				batchSettings.languages.length > 0 ? batchSettings.languages : [formData.language];
			const relationsToGenerate =
				batchSettings.relations.length > 0 ? batchSettings.relations : formData.relations;
			const ageGroupsToGenerate =
				batchSettings.ageGroups.length > 0 ? batchSettings.ageGroups : formData.ageGroups;
			const specificValuesToUse = batchSettings.specificValues || formData.specificValues;

			// Templates organized by event type and style
			const templates: Record<string, Record<string, string[]>> = {
				birthday: {
					normal: [
						'Alles Liebe zum Geburtstag, [Name]! Mögest du einen wundervollen Tag verbringen.',
						'Herzlichen Glückwunsch zum Geburtstag, liebe/r [Name]!',
						'Zum Geburtstag wünsche ich dir alles Gute, [Name]!'
					],
					herzlich: [
						'Von Herzen alles Gute zum Geburtstag, liebe/r [Name]! Du bedeutest mir so viel.',
						'Mein/e liebe/r [Name], zum Geburtstag sende ich dir die herzlichsten Grüße.',
						'Für dich, [Name], zum Geburtstag: Möge dein Tag voller Freude und Liebe sein!'
					],
					humorvoll: [
						'Happy Birthday, [Name]! 🎉 Hoffentlich ist dein Tag genauso toll wie du!',
						'[Name], zum Geburtstag: Bleib so verrückt wie du bist! 😄',
						'Alles Gute, [Name]! Zum Geburtstag wünsche ich dir Kuchen, Geschenke und keine Kalorien! 🎂'
					],
					formell: [
						'Zum Geburtstag möchte ich Ihnen, [Name], meine herzlichsten Glückwünsche aussprechen.',
						'Sehr geehrte/r [Name], ich gratuliere Ihnen herzlich zum Geburtstag.',
						'Im Namen aller Kollegen gratuliere ich Ihnen, [Name], zum Geburtstag.'
					]
				},
				anniversary: {
					normal: [
						'Herzlichen Glückwunsch zum Jubiläum, [Name]! Ein besonderer Meilenstein.',
						'Zum Jubiläum alles Gute, liebe/r [Name]!',
						'[Name], herzliche Glückwünsche zu diesem besonderen Anlass!'
					],
					herzlich: [
						'Von Herzen gratuliere ich dir zum Jubiläum, [Name]! Du hast so viel erreicht.',
						'Liebe/r [Name], zum Jubiläum wünsche ich dir weiterhin viel Erfolg und Freude.',
						'Dein Jubiläum, [Name], ist ein Grund zu feiern - du bist etwas Besonderes!'
					],
					humorvoll: [
						'Jubiläum, [Name]! 🎊 Du wirst ja richtig alt... äh, erfahren! 😉',
						'[Name], zum Jubiläum: Du sammelst Jahre wie andere Briefmarken! 📮',
						'Herzlichen Glückwunsch, [Name]! Das Jubiläum zeigt: Du bist schon lange toll! 🏆'
					],
					formell: [
						'Zum Jubiläum gratuliere ich Ihnen, [Name], zu Ihren herausragenden Leistungen.',
						'Sehr geehrte/r [Name], zu Ihrem Jubiläum übermittle ich die besten Glückwünsche.',
						'[Name], Ihr Jubiläum ist ein Zeichen für Beständigkeit und Erfolg.'
					]
				},
				custom: {
					normal: [
						'Alles Gute zu diesem besonderen Anlass, [Name]!',
						'Herzlichen Glückwunsch, liebe/r [Name]!',
						'[Name], ich wünsche dir alles Gute für diesen wichtigen Tag!'
					],
					herzlich: [
						'Von Herzen alles Gute, [Name]! Dieser Tag gehört dir.',
						'Liebe/r [Name], möge dieser besondere Tag voller Glück sein.',
						'Für dich, [Name], die herzlichsten Glückwünsche zu diesem Anlass!'
					],
					humorvoll: [
						'Hey [Name]! 🎉 Heute ist dein Tag - mach was draus!',
						'[Name], heute darfst du im Mittelpunkt stehen! 🌟',
						'Glückwunsch, [Name]! Heute ist ein guter Tag für gute Laune! 😊'
					],
					formell: [
						'Zu diesem besonderen Anlass gratuliere ich Ihnen, [Name], herzlich.',
						'Sehr geehrte/r [Name], ich wünsche Ihnen alles Gute.',
						'[Name], meine besten Glückwünsche zu diesem wichtigen Ereignis.'
					]
				}
			};

			generatedWishes = [];
			let idCounter = 1;

			// Generate combinations for all selected options
			for (const type of typesToGenerate) {
				for (const eventType of eventTypesToGenerate) {
					for (const language of languagesToGenerate) {
						for (const variation of batchSettings.variations) {
							const eventKey = eventType.toLowerCase();
							const eventTemplates = templates[eventKey] || templates.custom;
							const texts = eventTemplates[variation] || eventTemplates.normal;

							if (generatedWishes.length >= batchSettings.count) break;

							const text = texts[idCounter % texts.length];
							const belated = batchSettings.includeAlternatives
								? `Liebe/r [Name], auch wenn ich etwas spät dran bin - ${text.toLowerCase().replace(/^[a-z]/, (match) => match.toUpperCase())}`
								: '';

							generatedWishes.push({
								id: `generated-${idCounter++}`,
								type: type as WishType,
								eventType: eventType as EventType,
								relations: relationsToGenerate as Relation[],
								ageGroups: ageGroupsToGenerate as AgeGroup[],
								specificValues: specificValuesToUse,
								text,
								belated,
								language: language as Language,
								status: formData.status as WishStatus,
								metadata: {
									style: variation,
									generated: true,
									timestamp: new Date().toISOString()
								}
							});
						}
						if (generatedWishes.length >= batchSettings.count) break;
					}
					if (generatedWishes.length >= batchSettings.count) break;
				}
				if (generatedWishes.length >= batchSettings.count) break;
			}

			// Limit to requested count
			generatedWishes = generatedWishes.slice(0, batchSettings.count);
			selectedGeneratedWishes = generatedWishes.map((w) => w.id);
			currentStep = 3;
		} catch (error) {
			console.error('Fehler bei der Batch-Generierung:', error);
			generationError = 'Fehler bei der Batch-Generierung. Bitte versuche es später erneut.';
			currentStep = 1;
		} finally {
			isGenerating = false;
		}
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

	async function saveBatchWishes() {
		isSubmitting = true;
		try {
			const wishesToSave = generatedWishes.filter((w) => selectedGeneratedWishes.includes(w.id));
			// Here would be the actual API call to save multiple wishes
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Redirect to wishes list or show success message
			window.location.href = '/dashboard/wishes?created=' + wishesToSave.length;
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function resetBatchCreator() {
		currentStep = 1;
		generatedWishes = [];
		selectedGeneratedWishes = [];
		generationError = '';
		showAIBatchCreator = false;
	}

	function resetBatchSettings() {
		batchSettings.types = [];
		batchSettings.eventTypes = [];
		batchSettings.languages = [];
		batchSettings.relations = [];
		batchSettings.ageGroups = [];
		batchSettings.specificValues = '';
		batchSettings.variations = ['normal'];
		batchSettings.count = 5;
		batchSettings.includeAlternatives = true;
	}

	function copyFromMainForm() {
		batchSettings.types = [formData.type];
		batchSettings.eventTypes = [formData.eventType];
		batchSettings.languages = [formData.language];
		batchSettings.relations = [...formData.relations];
		batchSettings.ageGroups = [...formData.ageGroups];
		batchSettings.specificValues = formData.specificValues;
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
			<button
				type="button"
				class="btn btn-primary btn-sm"
				onclick={() => (showAIBatchCreator = true)}
			>
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
						d="M19 11H5m14-7H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6m-6 4h6"
					/>
				</svg>
				Batch-Erstellung
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

					<!-- Stil-Auswahl für KI-Generierung -->
					<div class="form-control mt-6">
						<label class="label">
							<span class="label-text font-medium">KI-Stil für Generierung</span>
							<span class="label-text-alt">Beeinflusst die automatische Textgenerierung</span>
						</label>
						<select class="select-bordered select w-full" bind:value={wishStyle}>
							<option value="normal">Normal - Klassische, freundliche Wünsche</option>
							<option value="herzlich">Herzlich - Warme, emotionale Wünsche</option>
							<option value="humorvoll">Humorvoll - Lustige, lockere Wünsche</option>
							<option value="formell">Formell - Höfliche, professionelle Wünsche</option>
						</select>
					</div>

					<!-- Haupttext -->
					<div class="form-control mt-6">
						<label class="label" for="text">
							<span class="label-text font-medium">Wunsch-Text *</span>
							<span class="label-text-alt">{formData.text.length}/1000</span>
						</label>
						<div class="relative">
							<textarea
								id="text"
								name="text"
								rows="6"
								placeholder="Liebe/r [Name], zu deinem [Anlass] wünsche ich dir..."
								class="textarea-bordered textarea w-full pr-24"
								class:textarea-error={errors.text}
								bind:value={formData.text}
								required
							></textarea>
							<button
								type="button"
								class="btn btn-primary btn-sm absolute right-2 top-2"
								onclick={generateWithAI}
								disabled={isGenerating ||
									!formData.eventType ||
									formData.relations.length === 0 ||
									formData.ageGroups.length === 0}
								title="Text mit KI basierend auf aktuellen Einstellungen generieren"
							>
								{#if isGenerating}
									<span class="loading loading-spinner loading-sm"></span>
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
								{/if}
							</button>
						</div>
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
						<div class="relative">
							<textarea
								id="belated"
								name="belated"
								rows="4"
								placeholder="Liebe/r [Name], auch wenn ich zu spät dran bin..."
								class="textarea-bordered textarea w-full pr-24"
								class:textarea-error={errors.belated}
								bind:value={formData.belated}
								required
							></textarea>
							<button
								type="button"
								class="btn btn-secondary btn-sm absolute right-2 top-2"
								onclick={generateWithAI}
								disabled={isGenerating ||
									!formData.eventType ||
									formData.relations.length === 0 ||
									formData.ageGroups.length === 0}
								title="Nachträglichen Text mit KI generieren"
							>
								{#if isGenerating}
									<span class="loading loading-spinner loading-sm"></span>
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
								{/if}
							</button>
						</div>
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

		<!-- Generation Error Alert -->
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
				<button
					type="button"
					class="btn btn-ghost btn-sm ml-auto"
					onclick={() => (generationError = '')}
				>
					×
				</button>
			</div>
		{/if}

		<!-- AI Batch Creator Modal -->
		<div class="modal {showAIBatchCreator ? 'modal-open' : ''}">
			<div class="modal-box flex h-[90vh] max-w-6xl flex-col">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="flex items-center gap-2 text-xl font-bold">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-primary"
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
							<!-- Quick Actions -->
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

							<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
								<!-- Left Column: Basic Settings -->
								<div class="space-y-4">
									<!-- Generation Settings -->
									<div class="card bg-base-100 shadow-sm">
										<div class="card-body">
											<h4 class="card-title text-base">Generierungs-Einstellungen</h4>

											<div class="form-control">
												<label class="label">
													<span class="label-text"
														>Anzahl Wünsche: <strong>{batchSettings.count}</strong></span
													>
												</label>
												<input
													type="range"
													min="3"
													max="20"
													class="range range-primary range-sm"
													bind:value={batchSettings.count}
												/>
												<div class="flex justify-between px-2 text-xs opacity-60">
													<span>3</span>
													<span>20</span>
												</div>
											</div>

											<div class="form-control">
												<label class="label">
													<span class="label-text">Stil-Variationen</span>
												</label>
												<div class="flex flex-wrap gap-2">
													{#each ['normal', 'herzlich', 'humorvoll', 'formell'] as style}
														<label class="cursor-pointer">
															<input
																type="checkbox"
																class="checkbox checkbox-primary checkbox-sm mr-2"
																bind:group={batchSettings.variations}
																value={style}
															/>
															<span class="text-sm capitalize">{style}</span>
														</label>
													{/each}
												</div>
											</div>

											<div class="form-control">
												<label class="label cursor-pointer">
													<span class="label-text">Nachträgliche Versionen</span>
													<input
														type="checkbox"
														class="toggle toggle-primary"
														bind:checked={batchSettings.includeAlternatives}
													/>
												</label>
											</div>
										</div>
									</div>

									<!-- Content Filters -->
									<div class="card bg-base-100 shadow-sm">
										<div class="card-body">
											<h4 class="card-title text-base">Inhalts-Filter</h4>
											<p class="mb-4 text-xs opacity-70">
												Leer lassen = Werte aus Hauptformular verwenden
											</p>

											<div class="space-y-3">
												<!-- Type Filter -->
												<div class="form-control">
													<label class="label pb-1">
														<span class="label-text text-sm font-medium">Wunsch-Typen</span>
													</label>
													<div class="flex gap-3">
														{#each Object.values(WishType) as type}
															<label class="flex cursor-pointer items-center">
																<input
																	type="checkbox"
																	class="checkbox checkbox-primary checkbox-sm mr-2"
																	bind:group={batchSettings.types}
																	value={type}
																/>
																<span class="text-sm">{typeLabels[type]}</span>
															</label>
														{/each}
													</div>
												</div>

												<!-- Event Type Filter -->
												<div class="form-control">
													<label class="label pb-1">
														<span class="label-text text-sm font-medium">Anlässe</span>
													</label>
													<div class="flex gap-3">
														{#each Object.values(EventType) as eventType}
															<label class="flex cursor-pointer items-center">
																<input
																	type="checkbox"
																	class="checkbox checkbox-primary checkbox-sm mr-2"
																	bind:group={batchSettings.eventTypes}
																	value={eventType}
																/>
																<span class="text-sm">{eventTypeLabels[eventType]}</span>
															</label>
														{/each}
													</div>
												</div>

												<!-- Language Filter -->
												<div class="form-control">
													<label class="label pb-1">
														<span class="label-text text-sm font-medium">Sprachen</span>
													</label>
													<div class="flex gap-3">
														{#each Object.values(Language) as language}
															<label class="flex cursor-pointer items-center">
																<input
																	type="checkbox"
																	class="checkbox checkbox-primary checkbox-sm mr-2"
																	bind:group={batchSettings.languages}
																	value={language}
																/>
																<span class="text-sm">{languageLabels[language]}</span>
															</label>
														{/each}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Right Column: Target Groups -->
								<div class="space-y-4">
									<!-- Target Groups -->
									<div class="card bg-base-100 shadow-sm">
										<div class="card-body">
											<h4 class="card-title text-base">Zielgruppen</h4>

											<div class="space-y-3">
												<!-- Relations -->
												<div class="form-control">
													<label class="label pb-1">
														<span class="label-text text-sm font-medium">Beziehungen</span>
													</label>
													<div class="flex flex-wrap gap-2">
														{#each Object.values(Relation) as relation}
															<label class="flex cursor-pointer items-center">
																<input
																	type="checkbox"
																	class="checkbox checkbox-primary checkbox-sm mr-2"
																	bind:group={batchSettings.relations}
																	value={relation}
																/>
																<span class="text-sm">{relationLabels[relation]}</span>
															</label>
														{/each}
													</div>
												</div>

												<!-- Age Groups -->
												<div class="form-control">
													<label class="label pb-1">
														<span class="label-text text-sm font-medium">Altersgruppen</span>
													</label>
													<div class="flex flex-wrap gap-2">
														{#each Object.values(AgeGroup) as ageGroup}
															<label class="flex cursor-pointer items-center">
																<input
																	type="checkbox"
																	class="checkbox checkbox-primary checkbox-sm mr-2"
																	bind:group={batchSettings.ageGroups}
																	value={ageGroup}
																/>
																<span class="text-sm">{ageGroupLabels[ageGroup]}</span>
															</label>
														{/each}
													</div>
												</div>

												<!-- Specific Values -->
												<div class="form-control">
													<label class="label pb-1" for="batchSpecificValues">
														<span class="label-text text-sm font-medium">Spezifische Werte</span>
													</label>
													<input
														id="batchSpecificValues"
														type="text"
														placeholder="z.B. 18, 25, 30, 50"
														class="input-bordered input input-sm w-full"
														bind:value={batchSettings.specificValues}
													/>
													<label class="label pt-1">
														<span class="label-text-alt text-xs">
															Alter oder Jubiläumsjahre, kommagetrennt
														</span>
													</label>
												</div>
											</div>
										</div>
									</div>

									<!-- Preview Stats -->
									<div class="bg-primary/5 border-primary/20 card border">
										<div class="card-body py-4">
											<h5 class="mb-2 text-sm font-medium">Generierungs-Vorschau</h5>
											<div class="grid grid-cols-2 gap-4 text-sm">
												<div>
													<span class="text-xs opacity-70">Stile:</span>
													<div class="font-medium">{batchSettings.variations.length}</div>
												</div>
												<div>
													<span class="text-xs opacity-70">Typen:</span>
													<div class="font-medium">{batchSettings.types.length || 1}</div>
												</div>
												<div>
													<span class="text-xs opacity-70">Anlässe:</span>
													<div class="font-medium">{batchSettings.eventTypes.length || 1}</div>
												</div>
												<div>
													<span class="text-xs opacity-70">Sprachen:</span>
													<div class="font-medium">{batchSettings.languages.length || 1}</div>
												</div>
											</div>
											<div class="border-primary/20 mt-3 border-t pt-3">
												<span class="text-xs opacity-70">Kombinationen:</span>
												<div class="font-bold text-primary">
													{(batchSettings.types.length || 1) *
														(batchSettings.eventTypes.length || 1) *
														(batchSettings.languages.length || 1) *
														batchSettings.variations.length}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{:else if currentStep === 2}
						<!-- Step 2: Generation in Progress -->
						<div class="flex h-64 flex-col items-center justify-center space-y-6">
							<div class="loading loading-spinner loading-lg text-primary"></div>
							<div class="text-center">
								<h4 class="text-lg font-bold">Wünsche werden generiert...</h4>
								<p class="text-sm opacity-70">
									KI generiert Wünsche basierend auf Ihren Filterkriterien.
								</p>
							</div>
							<div class="stats stats-vertical shadow lg:stats-horizontal">
								<div class="stat-sm stat">
									<div class="stat-title">Anzahl</div>
									<div class="stat-value text-primary">{batchSettings.count}</div>
								</div>
								<div class="stat-sm stat">
									<div class="stat-title">Stile</div>
									<div class="stat-value text-secondary">{batchSettings.variations.length}</div>
								</div>
								<div class="stat-sm stat">
									<div class="stat-title">Typen</div>
									<div class="stat-value text-accent">{batchSettings.types.length || 1}</div>
								</div>
								<div class="stat-sm stat">
									<div class="stat-title">Anlässe</div>
									<div class="stat-value text-info">{batchSettings.eventTypes.length || 1}</div>
								</div>
								<div class="stat-sm stat">
									<div class="stat-title">Sprachen</div>
									<div class="stat-value text-warning">{batchSettings.languages.length || 1}</div>
								</div>
							</div>
						</div>
					{:else if currentStep === 3}
						<!-- Step 3: Review Generated Wishes -->
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h4 class="text-lg font-bold">Generierte Wünsche ({generatedWishes.length})</h4>
								<div class="flex gap-2">
									<div class="badge badge-outline">
										{selectedGeneratedWishes.length} ausgewählt
									</div>
									<button class="btn btn-outline btn-xs" onclick={selectAllGenerated}>
										Alle auswählen
									</button>
									<button class="btn btn-outline btn-xs" onclick={deselectAllGenerated}>
										Alle abwählen
									</button>
								</div>
							</div>

							<div class="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-2">
								{#each generatedWishes as wish (wish.id)}
									<div
										class="card border {selectedGeneratedWishes.includes(wish.id)
											? 'bg-primary/5 border-primary'
											: 'border-base-300'}"
									>
										<div class="card-body p-4">
											<div class="mb-2 flex items-start justify-between">
												<div class="flex items-center gap-2">
													<input
														type="checkbox"
														class="checkbox checkbox-primary checkbox-sm"
														checked={selectedGeneratedWishes.includes(wish.id)}
														onchange={() => toggleWishSelection(wish.id)}
													/>
													<div
														class="badge badge-{wish.metadata.style === 'humorvoll'
															? 'warning'
															: wish.metadata.style === 'herzlich'
																? 'success'
																: wish.metadata.style === 'formell'
																	? 'info'
																	: 'neutral'} badge-sm"
													>
														{wish.metadata.style}
													</div>
												</div>
												<div class="flex gap-1">
													<div class="badge badge-outline badge-xs">
														{wish.type === WishType.FUNNY ? 'Lustig' : 'Normal'}
													</div>
													<div class="badge badge-ghost badge-xs">
														{eventTypeLabels[wish.eventType]}
													</div>
													<div class="badge badge-ghost badge-xs">
														{languageLabels[wish.language]}
													</div>
												</div>
											</div>

											<!-- Target Info -->
											<div class="mb-2 flex flex-wrap gap-1">
												{#each wish.relations as relation}
													<span class="badge badge-neutral badge-xs"
														>{relationLabels[relation]}</span
													>
												{/each}
												{#each wish.ageGroups as ageGroup}
													<span class="badge badge-accent badge-xs">{ageGroupLabels[ageGroup]}</span
													>
												{/each}
												{#if wish.specificValues}
													<span class="badge badge-info badge-xs">{wish.specificValues}</span>
												{/if}
											</div>

											<div class="mt-2">
												<p class="line-clamp-3 text-sm font-medium">{wish.text}</p>
												{#if wish.belated}
													<p class="mt-2 line-clamp-2 text-xs opacity-70">
														<strong>Nachträglich:</strong>
														{wish.belated}
													</p>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
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
						onclick={resetBatchCreator}
						disabled={isGenerating || isSubmitting}
					>
						Abbrechen
					</button>

					{#if currentStep === 1}
						<button
							type="button"
							class="btn btn-primary"
							onclick={generateBatchWishes}
							disabled={batchSettings.variations.length === 0}
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
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							Generierung starten
						</button>
					{:else if currentStep === 3}
						<button
							type="button"
							class="btn btn-success"
							onclick={saveBatchWishes}
							disabled={selectedGeneratedWishes.length === 0 || isSubmitting}
						>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Speichere...
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
										d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
									/>
								</svg>
								{selectedGeneratedWishes.length} Wünsche speichern
							{/if}
						</button>
					{/if}
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
						<h4 class="font-medium">🤖 KI-Generierung:</h4>
						<p class="text-xs opacity-70">
							Klicken Sie auf die KI-Buttons in den Textfeldern für automatische Generierung.
						</p>
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
