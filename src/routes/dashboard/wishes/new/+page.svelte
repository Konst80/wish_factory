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
			specificValues?: number;
			text?: string;
			belated?: string;
			language?: string;
			status?: string;
		};
	} | null;

	let { form, data }: { form: ActionData; data: any } = $props();

	// Form state
	let formData = $state({
		type: form?.values?.type || WishType.NORMAL,
		eventType: form?.values?.eventType || EventType.BIRTHDAY,
		relations: form?.values?.relations || [],
		ageGroups: form?.values?.ageGroups || [],
		specificValues: form?.values?.specificValues || '',
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

	// AI Batch Creation State
	type GeneratedWish = {
		id: string;
		type: WishType;
		eventType: EventType;
		relations: Relation[];
		ageGroups: AgeGroup[];
		specificValues: number;
		text: string;
		belated: string;
		language: Language;
		status: WishStatus;
		metadata: {
			style: string;
			generated: boolean;
			timestamp: string;
			aiGenerated?: boolean;
			confidence?: number;
			fallback?: boolean;
		};
	};

	// let batchMode = $state('single'); // 'single' | 'batch' - unused for now
	let batchSettings = $state({
		count: 5,
		includeAlternatives: true,
		// Optionale Filter - wenn leer, werden die Hauptformular-Werte verwendet
		types: [] as string[], // WishType[]
		eventTypes: [] as string[], // EventType[]
		languages: [] as string[], // Language[]
		relations: [] as string[], // Relation[]
		ageGroups: [] as string[], // AgeGroup[]
		specificValues: 0, // Spezifische Alter oder Hochzeitstage
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

	function handleAgeGroupChange(ageGroup: string) {
		formData.ageGroups = [ageGroup];
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

		console.log('🎨 Starte KI-Generierung mit folgenden Parametern:', {
			type: formData.type,
			eventType: formData.eventType,
			language: formData.language,
			relations: formData.relations,
			ageGroups: formData.ageGroups,
			specificValues: formData.specificValues,
			style: formData.type
		});

		try {
			// Validierung vor API-Aufruf
			if (!formData.relations || formData.relations.length === 0) {
				throw new Error('Bitte wählen Sie mindestens eine Beziehung aus');
			}

			if (!formData.ageGroups || formData.ageGroups.length === 0) {
				throw new Error('Bitte wählen Sie mindestens eine Altersgruppe aus');
			}

			console.log('📡 Sende API-Request...');

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
						? [parseInt(formData.specificValues.toString())]
						: [],
					style: formData.type,
					count: 1
				})
			});

			console.log('📥 Response Status:', response.status);

			if (!response.ok) {
				let errorMessage = `API-Fehler: ${response.status}`;

				try {
					const errorData = await response.json();
					console.error('❌ API Error Data:', errorData);
					errorMessage = errorData.message || errorMessage;
				} catch (jsonError) {
					console.error('❌ Fehler beim Parsen der Error-Response:', jsonError);
					const textError = await response.text();
					console.error('❌ Raw Error Response:', textError);
					errorMessage = textError || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ API Response:', data);

			if (data.success && data.wishes && data.wishes.length > 0) {
				const wish = data.wishes[0];
				console.log('🎉 Generierter Wunsch:', wish);
				formData.text = wish.text;
				formData.belated = wish.belated;
				console.log('✅ Formular aktualisiert');
			} else {
				console.error('❌ Keine Wünsche in Response:', data);
				throw new Error(data.message || 'Keine Wünsche generiert');
			}
		} catch (error) {
			console.error('❌ Fehler bei der KI-Generierung:', error);

			// Detaillierte Fehlermeldungen basierend auf dem Error-Typ
			if (error instanceof Error) {
				if (error.message.includes('API-Schlüssel')) {
					generationError =
						'🔑 KI-Service nicht konfiguriert. Bitte kontaktieren Sie den Administrator.';
				} else if (error.message.includes('Nicht authentifiziert')) {
					generationError = '🔐 Sitzung abgelaufen. Bitte melden Sie sich erneut an.';
				} else if (error.message.includes('Keine Berechtigung')) {
					generationError = '🚫 Sie haben keine Berechtigung zur KI-Generierung.';
				} else if (error.message.includes('OpenRouter API error')) {
					generationError =
						'🤖 KI-Service temporär nicht verfügbar. Versuchen Sie es später erneut.';
				} else if (error.message.includes('No content received')) {
					generationError = '📭 KI hat keine Antwort geliefert. Versuchen Sie es erneut.';
				} else if (error.message.includes('Could not parse JSON')) {
					generationError = '📝 Fehlerhafte KI-Antwort. Bitte versuchen Sie es erneut.';
				} else if (error.message.includes('Invalid AI response format')) {
					generationError = '🔧 KI-Antwort in falschem Format. Administrator benachrichtigen.';
				} else {
					generationError = `❌ ${error.message}`;
				}
			} else {
				generationError =
					'❓ Unbekannter Fehler bei der Generierung. Bitte versuchen Sie es später erneut.';
			}
		} finally {
			isGenerating = false;
		}
	}

	async function generateBatchWishes() {
		isGenerating = true;
		generationError = '';
		currentStep = 2;

		console.log('🎨 Starte KI-Batch-Generierung mit:', batchSettings);

		try {
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
			const specificValuesToUse =
				batchSettings.specificValues > 0
					? batchSettings.specificValues
					: formData.specificValues
						? parseInt(formData.specificValues.toString())
						: 0;

			console.log('📋 KI-Batch-Generierung für:', {
				types: typesToGenerate,
				eventTypes: eventTypesToGenerate,
				languages: languagesToGenerate,
				relations: relationsToGenerate,
				ageGroups: ageGroupsToGenerate,
				specificValues: specificValuesToUse,
				count: batchSettings.count
			});

			// Validierung
			if (!relationsToGenerate || relationsToGenerate.length === 0) {
				throw new Error('Bitte wählen Sie mindestens eine Beziehung aus');
			}

			if (!ageGroupsToGenerate || ageGroupsToGenerate.length === 0) {
				throw new Error('Bitte wählen Sie mindestens eine Altersgruppe aus');
			}

			generatedWishes = [];

			// Try AI generation first
			try {
				console.log('📡 Sende KI-Batch-Request...');

				// Use the first combination for the primary request
				const primaryType = typesToGenerate[0];
				const primaryEventType = eventTypesToGenerate[0];
				const primaryLanguage = languagesToGenerate[0];

				const response = await fetch('/api/ai/generate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						type: primaryType,
						eventType: primaryEventType,
						language: primaryLanguage,
						relations: relationsToGenerate as Relation[],
						ageGroups: ageGroupsToGenerate as AgeGroup[],
						specificValues: specificValuesToUse ? [parseInt(specificValuesToUse.toString())] : [],
						style: batchSettings.includeAlternatives ? 'mixed' : 'normal',
						count: batchSettings.count, // Request multiple wishes at once
						isBatch: true // Flag to indicate this is a batch request
					})
				});

				console.log('📥 KI-Batch Response Status:', response.status);

				if (!response.ok) {
					let errorMessage = `KI-API-Fehler: ${response.status}`;
					try {
						const errorData = await response.json();
						errorMessage += ` - ${errorData.message || 'Unbekannter Fehler'}`;
					} catch {
						errorMessage += ` - ${response.statusText}`;
					}
					throw new Error(errorMessage);
				}

				const aiResult = await response.json();
				console.log('✅ KI-Batch-Antwort erhalten:', aiResult);

				if (aiResult.error) {
					throw new Error(`KI-Fehler: ${aiResult.error}`);
				}

				if (!aiResult.wishes || aiResult.wishes.length === 0) {
					throw new Error('Keine Wünsche von der KI erhalten');
				}

				// Convert AI results to our format
				let idCounter = 1;
				for (const wish of aiResult.wishes) {
					if (generatedWishes.length >= batchSettings.count) break;

					generatedWishes.push({
						id: `ai-generated-${idCounter++}`,
						type: primaryType as WishType,
						eventType: primaryEventType as EventType,
						relations: relationsToGenerate as Relation[],
						ageGroups: ageGroupsToGenerate as AgeGroup[],
						specificValues: specificValuesToUse,
						text: wish.text,
						belated: wish.belated,
						language: primaryLanguage as Language,
						status: formData.status as WishStatus,
						metadata: {
							style: wish.metadata?.style || primaryType,
							generated: true,
							timestamp: new Date().toISOString(),
							aiGenerated: true,
							confidence: wish.metadata?.confidence || 0.9
						}
					});
				}

				console.log(`✅ ${generatedWishes.length} Wünsche von KI generiert`);
			} catch (aiError) {
				console.warn('⚠️ KI-Generierung fehlgeschlagen, verwende Template-Fallback:', aiError);

				// Sleep for demo effect
				await new Promise((resolve) => setTimeout(resolve, 1000));

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
							const variations = batchSettings.includeAlternatives ? ['normal', 'herzlich', 'humorvoll', 'formell'] : ['normal'];
							for (const variation of variations) {
								const eventKey = eventType.toLowerCase();
								const eventTemplates = templates[eventKey] || templates.custom;
								const texts = eventTemplates[variation] || eventTemplates.normal;

								if (generatedWishes.length >= batchSettings.count) break;

								const text = texts[idCounter % texts.length];
								const belated = batchSettings.includeAlternatives
									? `Liebe/r [Name], auch wenn ich etwas spät dran bin - ${text.toLowerCase().replace(/^[a-z]/, (match) => match.toUpperCase())}`
									: '';

								generatedWishes.push({
									id: `template-generated-${idCounter++}`,
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
										timestamp: new Date().toISOString(),
										aiGenerated: false,
										fallback: true
									}
								});
							}
							if (generatedWishes.length >= batchSettings.count) break;
						}
						if (generatedWishes.length >= batchSettings.count) break;
					}
					if (generatedWishes.length >= batchSettings.count) break;
				}

				console.log(`📋 ${generatedWishes.length} Wünsche via Template-Fallback generiert`);
			}

			// Limit to requested count if we have any wishes
			if (generatedWishes.length > 0) {
				generatedWishes = generatedWishes.slice(0, batchSettings.count);
				selectedGeneratedWishes = generatedWishes.map((w) => w.id);
				currentStep = 3;
			} else {
				throw new Error('Keine Wünsche generiert. Bitte überprüfen Sie Ihre Einstellungen.');
			}
		} catch (error) {
			console.error('Fehler bei der Batch-Generierung:', error);
			generationError =
				(error as Error).message ||
				'Fehler bei der Batch-Generierung. Bitte versuche es später erneut.';
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
		batchSettings.specificValues = 0;
		batchSettings.count = 5;
		batchSettings.includeAlternatives = true;
	}

	function copyFromMainForm() {
		batchSettings.types = [formData.type];
		batchSettings.eventTypes = [formData.eventType];
		batchSettings.languages = [formData.language];
		batchSettings.relations = [...formData.relations];
		batchSettings.ageGroups = [...formData.ageGroups];
		batchSettings.specificValues =
			typeof formData.specificValues === 'string'
				? parseInt(formData.specificValues) || 0
				: formData.specificValues;
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
			<h1 class="text-base-content text-3xl font-bold">Neuen Wunsch erstellen</h1>
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
					<!-- Basic Settings Section -->
					<div class="bg-base-50 mb-6 rounded-lg p-6">
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
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
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Grundeinstellungen
						</h3>
						<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
							<!-- Wunsch-Typ -->
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
												d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
											/>
										</svg>
										Wunsch-Typ *
									</span>
								</label>
								<select
									id="type"
									name="type"
									class="select-bordered select select-lg w-full"
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
										<span
											class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
											>{errors.type}</span
										>
									</label>
								{/if}
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
										<span
											class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
											>{errors.eventType}</span
										>
									</label>
								{/if}
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
										<span
											class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
											>{errors.language}</span
										>
									</label>
								{/if}
							</div>
						</div>
					</div>

					<!-- Hidden Status Field - Always "Entwurf" for new wishes -->
					<input type="hidden" name="status" value="Entwurf" />

					<!-- Target Audience Section -->
					<div class="bg-base-50 mb-6 rounded-lg p-6">
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
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
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							Zielgruppe
						</h3>

						<!-- Beziehungen -->
						<div class="form-control mb-6">
							<label class="label">
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
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
										/>
									</svg>
									Beziehungen *
								</span>
								<span class="label-text-alt badge badge-neutral badge-sm"
									>Mindestens eine auswählen</span
								>
							</label>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
								{#each Object.values(Relation) as relation (relation)}
									<label
										class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {formData.relations.includes(
											relation
										)
											? 'border-primary bg-primary/5'
											: 'border-base-300'}"
									>
										<input
											type="checkbox"
											name="relations"
											value={relation}
											class="checkbox checkbox-primary"
											class:checkbox-error={errors.relations}
											checked={formData.relations.includes(relation)}
											onchange={(e) => handleRelationChange(relation, e.currentTarget.checked)}
										/>
										<span class="label-text ml-3 font-medium">{relationLabels[relation]}</span>
									</label>
								{/each}
							</div>
							{#if errors.relations}
								<label class="label">
									<span
										class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
										>{errors.relations}</span
									>
								</label>
							{/if}
						</div>

						<!-- Altersgruppen -->
						<div class="form-control mb-6">
							<label class="label">
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
								<span class="label-text-alt badge badge-neutral badge-sm">Eine Auswahl treffen</span
								>
							</label>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
								{#each Object.values(AgeGroup) as ageGroup (ageGroup)}
									<label
										class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {formData.ageGroups.includes(
											ageGroup
										)
											? 'border-primary bg-primary/5'
											: 'border-base-300'}"
									>
										<input
											type="radio"
											name="ageGroups"
											value={ageGroup}
											class="radio radio-primary"
											class:radio-error={errors.ageGroups}
											checked={formData.ageGroups.includes(ageGroup)}
											onchange={() => handleAgeGroupChange(ageGroup)}
										/>
										<span class="label-text ml-3 font-medium">{ageGroupLabels[ageGroup]}</span>
									</label>
								{/each}
							</div>
							{#if errors.ageGroups}
								<label class="label">
									<span
										class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
										>{errors.ageGroups}</span
									>
								</label>
							{/if}
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
								<span class="label-text-alt">Einzelner Wert (z.B. 18)</span>
							</label>
							<input
								id="specificValues"
								name="specificValues"
								type="number"
								min="1"
								max="200"
								placeholder="z.B. 18"
								class="input-bordered input input-lg w-full"
								class:input-error={errors.specificValues}
								bind:value={formData.specificValues}
							/>
							{#if errors.specificValues}
								<label class="label">
									<span
										class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
										>{errors.specificValues}</span
									>
								</label>
							{/if}
						</div>
					</div>

					<!-- Content Creation Section -->
					<div class="bg-base-50 mb-6 rounded-lg p-6">
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
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
									d="M15.232 5.232l3.536 3.536M9 11l3 3-3 3m-1 0H4.5A2.5 2.5 0 012 14.5v-3A2.5 2.5 0 014.5 9H8m0-2v4l-4-4m0 8l4-4m-4 4v-4l4 4"
								/>
							</svg>
							Wunsch-Inhalt
						</h3>

						<!-- AI Generation Status -->
						{#if isGenerating}
							<div class="alert alert-info mb-4">
								<div class="flex items-center gap-2">
									<span class="loading loading-spinner loading-sm"></span>
									<span>KI generiert Ihren Wunsch...</span>
								</div>
							</div>
						{/if}

						<!-- Haupttext -->
						<div class="form-control mb-6">
							<label class="label" for="text">
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
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
									Wunsch-Text *
								</span>
								<div class="flex items-center gap-2">
									<span class="label-text-alt">{formData.text.length}/1000</span>
									<div class="badge badge-primary badge-sm">KI-unterstützt</div>
								</div>
							</label>
							<div class="relative">
								<textarea
									id="text"
									name="text"
									rows="6"
									placeholder="Liebe/r [Name], zu deinem [Anlass] wünsche ich dir..."
									class="textarea-bordered textarea textarea-lg w-full pr-32"
									class:textarea-error={errors.text}
									bind:value={formData.text}
									required
								></textarea>
								<button
									type="button"
									class="btn btn-primary btn-sm absolute top-2 right-2 gap-1"
									onclick={generateWithAI}
									disabled={isGenerating ||
										!formData.eventType ||
										formData.relations.length === 0 ||
										formData.ageGroups.length === 0}
									title="Text mit KI basierend auf aktuellen Einstellungen generieren"
								>
									{#if isGenerating}
										<span class="loading loading-spinner loading-xs"></span>
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
									KI
								</button>
							</div>
							<label class="label">
								<span class="label-text-alt flex items-center gap-2">
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
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Verwenden Sie Platzhalter wie [Name], [Anlass], [Alter] für dynamische Inhalte
								</span>
							</label>
							{#if errors.text}
								<label class="label">
									<span
										class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
										>{errors.text}</span
									>
								</label>
							{/if}
						</div>

						<!-- Nachträglicher Text -->
						<div class="form-control">
							<label class="label" for="belated">
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
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Nachträglicher Text *
								</span>
								<div class="flex items-center gap-2">
									<span class="label-text-alt">{formData.belated.length}/1000</span>
									<div class="badge badge-secondary badge-sm">Verspätet</div>
								</div>
							</label>
							<div class="relative">
								<textarea
									id="belated"
									name="belated"
									rows="4"
									placeholder="Liebe/r [Name], auch wenn ich zu spät dran bin..."
									class="textarea-bordered textarea textarea-lg w-full pr-32"
									class:textarea-error={errors.belated}
									bind:value={formData.belated}
									required
								></textarea>
								<button
									type="button"
									class="btn btn-secondary btn-sm absolute top-2 right-2 gap-1"
									onclick={generateWithAI}
									disabled={isGenerating ||
										!formData.eventType ||
										formData.relations.length === 0 ||
										formData.ageGroups.length === 0}
									title="Nachträglichen Text mit KI generieren"
								>
									{#if isGenerating}
										<span class="loading loading-spinner loading-xs"></span>
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
									KI
								</button>
							</div>
							<label class="label">
								<span class="label-text-alt flex items-center gap-2">
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
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Text für verspätete Glückwünsche mit Platzhaltern
								</span>
							</label>
							{#if errors.belated}
								<label class="label">
									<span
										class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
										>{errors.belated}</span
									>
								</label>
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div
						class="border-base-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="text-base-content/70 flex items-center gap-2 text-sm">
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
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Entwürfe werden automatisch gespeichert</span>
						</div>
						<div class="flex gap-3">
							<a href="/dashboard/wishes" class="btn btn-outline btn-lg gap-2">
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
							</a>
							<button
								type="submit"
								class="btn btn-primary btn-lg gap-2"
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
					</div>
				</form>
			</div>
		</div>

		<!-- Generation Error Alert -->
		{#if generationError}
			<div class="alert alert-error animate-in slide-in-from-top-2 mt-4 duration-300">
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
				<div class="flex-1">
					<h4 class="font-medium">KI-Generierung fehlgeschlagen</h4>
					<p class="text-sm opacity-90">{generationError}</p>
				</div>
				<button type="button" class="btn btn-ghost btn-sm" onclick={() => (generationError = '')}>
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

		<!-- AI Batch Creator Modal -->
		<div class="modal {showAIBatchCreator ? 'modal-open' : ''}">
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

											<!-- Vielfalt-Einstellung -->
											<div class="form-control">
												<label class="label">
													<span class="label-text flex items-center gap-2">
														<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
														</svg>
														Stil-Vielfalt
													</span>
													<span class="label-text-alt">Variationen automatisch generieren</span>
												</label>
												<div class="flex items-center gap-3">
													<input
														type="checkbox"
														class="toggle toggle-primary"
														bind:checked={batchSettings.includeAlternatives}
													/>
													<div class="text-sm">
														<div class="font-medium {batchSettings.includeAlternatives ? 'text-primary' : 'text-base-content/60'}">
															{batchSettings.includeAlternatives ? 'Verschiedene Stile mischen' : 'Einheitlicher Stil'}
														</div>
														<div class="text-xs opacity-70">
															{batchSettings.includeAlternatives 
																? 'Normal, herzlich, humorvoll, formell' 
																: 'Nur der im Hauptformular gewählte Stil'
															}
														</div>
													</div>
												</div>
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
														type="number"
														min="1"
														max="200"
														placeholder="z.B. 18"
														class="input-bordered input input-sm w-full"
														bind:value={batchSettings.specificValues}
													/>
													<label class="label pt-1">
														<span class="label-text-alt text-xs">
															Einzelner Wert (z.B. 18, 25, 50)
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
													<div class="font-medium">{batchSettings.includeAlternatives ? 4 : 1}</div>
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
												<div class="text-primary font-bold">
													{(batchSettings.types.length || 1) *
														(batchSettings.eventTypes.length || 1) *
														(batchSettings.languages.length || 1) *
														(batchSettings.includeAlternatives ? 4 : 1)}
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
							<div class="stats stats-vertical lg:stats-horizontal shadow">
								<div class="stat-sm stat">
									<div class="stat-title">Anzahl</div>
									<div class="stat-value text-primary">{batchSettings.count}</div>
								</div>
								<div class="stat-sm stat">
									<div class="stat-title">Stile</div>
									<div class="stat-value text-secondary">{batchSettings.includeAlternatives ? 4 : 1}</div>
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
							<!-- Header with Statistics -->
							<div class="bg-base-50 rounded-lg border p-4">
								<div class="mb-3 flex items-center justify-between">
									<h4 class="flex items-center gap-2 text-lg font-bold">
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
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Generierte Wünsche überprüfen
									</h4>
									<div class="flex items-center gap-2">
										<div class="stats stats-horizontal stats-sm shadow">
											<div class="stat">
												<div class="stat-title">Generiert</div>
												<div class="stat-value text-primary text-sm">{generatedWishes.length}</div>
											</div>
											<div class="stat">
												<div class="stat-title">Ausgewählt</div>
												<div class="stat-value text-success text-sm">
													{selectedGeneratedWishes.length}
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Selection Controls -->
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium">Auswahl:</span>
									<button class="btn btn-outline btn-xs" onclick={selectAllGenerated}>
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
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Alle auswählen
									</button>
									<button class="btn btn-outline btn-xs" onclick={deselectAllGenerated}>
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
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
										Alle abwählen
									</button>
									{#if generatedWishes.some((w) => w.metadata.aiGenerated)}
										<div class="badge badge-accent badge-sm">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="mr-1 h-3 w-3"
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
											KI-generiert
										</div>
									{/if}
									{#if generatedWishes.some((w) => w.metadata.fallback)}
										<div class="badge badge-info badge-sm">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="mr-1 h-3 w-3"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
												/>
											</svg>
											Template-Fallback
										</div>
									{/if}
								</div>
							</div>

							<!-- Wishes List - Optimized for Reading -->
							<div class="bg-base-100 rounded-lg border shadow-sm">
								<!-- Scrollable Container with explicit height and pointer events -->
								<div class="h-[500px] overflow-y-scroll border-0">
									<div class="divide-base-200 divide-y">
										{#each generatedWishes as wish, index (wish.id)}
											<div
												class="hover:bg-base-50 p-4 transition-colors {selectedGeneratedWishes.includes(
													wish.id
												)
													? 'bg-primary/5 border-l-primary border-l-4'
													: ''}"
											>
												<!-- Wish Header -->
												<div class="mb-3 flex items-start justify-between">
													<div class="flex items-center gap-3">
														<label class="flex cursor-pointer items-center gap-2">
															<input
																type="checkbox"
																class="checkbox checkbox-primary"
																checked={selectedGeneratedWishes.includes(wish.id)}
																onchange={() => toggleWishSelection(wish.id)}
															/>
															<span class="text-sm font-medium">Wunsch #{index + 1}</span>
														</label>

														<!-- Style Badge -->
														<div
															class="badge {wish.metadata.style === 'humorvoll'
																? 'badge-warning'
																: wish.metadata.style === 'herzlich'
																	? 'badge-success'
																	: wish.metadata.style === 'formell'
																		? 'badge-info'
																		: 'badge-neutral'} badge-sm"
														>
															{wish.metadata.style}
														</div>

														<!-- Generation Type -->
														{#if wish.metadata.aiGenerated}
															<div class="badge badge-accent badge-xs">KI</div>
														{:else if wish.metadata.fallback}
															<div class="badge badge-info badge-xs">Vorlage</div>
														{/if}
													</div>

													<!-- Metadata Badges -->
													<div class="flex flex-wrap gap-1">
														<div class="badge badge-outline badge-xs">{typeLabels[wish.type]}</div>
														<div class="badge badge-ghost badge-xs">
															{eventTypeLabels[wish.eventType]}
														</div>
														<div class="badge badge-ghost badge-xs">
															{languageLabels[wish.language]}
														</div>
													</div>
												</div>

												<!-- Target Information -->
												<div class="mb-3 flex flex-wrap gap-1">
													<span class="text-base-content/60 mr-2 text-xs">Für:</span>
													{#each wish.relations as relation}
														<span class="badge badge-neutral badge-xs"
															>{relationLabels[relation]}</span
														>
													{/each}
													{#each wish.ageGroups as ageGroup}
														<span class="badge badge-accent badge-xs"
															>{ageGroupLabels[ageGroup]}</span
														>
													{/each}
													{#if wish.specificValues}
														<span class="badge badge-info badge-xs"
															>Alter: {wish.specificValues}</span
														>
													{/if}
												</div>

												<!-- Wish Content -->
												<div class="space-y-3">
													<!-- Main Text -->
													<div class="bg-base-100 border-l-primary/30 rounded-lg border-l-4 p-3">
														<div class="mb-2 flex items-start gap-2">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="text-primary mt-0.5 h-4 w-4 flex-shrink-0"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
																/>
															</svg>
															<span class="text-base-content/70 text-sm font-medium"
																>Haupttext:</span
															>
														</div>
														<p class="text-sm leading-relaxed">{wish.text}</p>
													</div>

													<!-- Belated Text -->
													{#if wish.belated}
														<div class="bg-base-100 border-l-warning/30 rounded-lg border-l-4 p-3">
															<div class="mb-2 flex items-start gap-2">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="text-warning mt-0.5 h-4 w-4 flex-shrink-0"
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
																<span class="text-base-content/70 text-sm font-medium"
																	>Nachträglich:</span
																>
															</div>
															<p class="text-sm leading-relaxed opacity-80">{wish.belated}</p>
														</div>
													{/if}
												</div>

												<!-- Quality Indicator -->
												{#if wish.metadata.confidence}
													<div class="mt-3 flex items-center gap-2">
														<span class="text-base-content/50 text-xs">Qualität:</span>
														<div class="flex items-center gap-1">
															{#each Array(5) as _, i}
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="h-3 w-3 {i < Math.round(wish.metadata.confidence * 5)
																		? 'text-warning'
																		: 'text-base-300'}"
																	fill="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
																	/>
																</svg>
															{/each}
															<span class="text-base-content/50 ml-1 text-xs">
																({Math.round(wish.metadata.confidence * 100)}%)
															</span>
														</div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>

								<!-- Empty State -->
								{#if generatedWishes.length === 0}
									<div class="flex flex-col items-center justify-center py-12">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="text-base-300 mb-4 h-12 w-12"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											/>
										</svg>
										<h5 class="text-base-content/70 text-lg font-medium">
											Keine Wünsche generiert
										</h5>
										<p class="text-base-content/50 text-sm">
											Starten Sie die Generierung, um Wünsche zu erstellen.
										</p>
									</div>
								{/if}
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
							disabled={false}
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
			<div class="card bg-base-100 border-base-200 mb-6 border shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">
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
							<div class="space-y-4">
								<div>
									<div class="mb-2 flex items-center gap-2">
										<div class="badge badge-primary badge-sm">Haupttext</div>
										<div class="badge badge-outline badge-sm">{formData.text.length} Zeichen</div>
									</div>
									<p class="text-sm leading-relaxed">{formData.text}</p>
								</div>
								{#if formData.belated}
									<div class="divider my-2"></div>
									<div>
										<div class="mb-2 flex items-center gap-2">
											<div class="badge badge-secondary badge-sm">Nachträglich</div>
											<div class="badge badge-outline badge-sm">
												{formData.belated.length} Zeichen
											</div>
										</div>
										<p class="text-sm leading-relaxed">{formData.belated}</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Help Card -->
		<div class="card bg-base-100 border-base-200 border shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">
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
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Hilfe & Tipps
				</h3>
				<div class="divider my-2"></div>
				<div class="space-y-4 text-sm">
					<div class="bg-base-50 rounded-lg p-3">
						<h4 class="mb-2 flex items-center gap-2 font-medium">
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
							Platzhalter verwenden
						</h4>
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div class="flex items-center gap-1">
								<code class="bg-base-200 rounded px-1">[Name]</code>
								<span class="opacity-70">Name der Person</span>
							</div>
							<div class="flex items-center gap-1">
								<code class="bg-base-200 rounded px-1">[Anlass]</code>
								<span class="opacity-70">Grund der Feier</span>
							</div>
							<div class="flex items-center gap-1">
								<code class="bg-base-200 rounded px-1">[Alter]</code>
								<span class="opacity-70">Lebensalter</span>
							</div>
							<div class="flex items-center gap-1">
								<code class="bg-base-200 rounded px-1">[Zahl]</code>
								<span class="opacity-70">Spezifischer Wert</span>
							</div>
						</div>
					</div>

					<div class="bg-primary/5 rounded-lg p-3">
						<h4 class="mb-2 flex items-center gap-2 font-medium">
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
							KI-Unterstützung
						</h4>
						<p class="text-xs opacity-70">
							Nutzen Sie die KI-Buttons für automatische Textgenerierung basierend auf Ihren
							Einstellungen.
						</p>
					</div>

					<div class="bg-secondary/5 rounded-lg p-3">
						<h4 class="mb-2 flex items-center gap-2 font-medium">
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
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							Zielgruppen-Tipp
						</h4>
						<p class="text-xs opacity-70">
							Präzise Zielgruppen-Auswahl erhöht die Relevanz und Wirkung Ihrer Wünsche.
						</p>
					</div>

					<div class="bg-accent/5 rounded-lg p-3">
						<h4 class="mb-2 flex items-center gap-2 font-medium">
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
							Status-Übersicht
						</h4>
						<div class="space-y-1 text-xs">
							<div class="flex items-center gap-2">
								<div class="badge badge-neutral badge-xs">Entwurf</div>
								<span class="opacity-70">Noch in Bearbeitung</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="badge badge-warning badge-xs">Zur Freigabe</div>
								<span class="opacity-70">Bereit zur Prüfung</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="badge badge-success badge-xs">Freigegeben</div>
								<span class="opacity-70">Öffentlich verfügbar</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
