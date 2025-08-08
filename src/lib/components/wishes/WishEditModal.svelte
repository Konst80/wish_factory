<script lang="ts">
	import { WishType, EventType, Language, Relation, AgeGroup, WishLength } from '$lib/types/Wish';
	import type { WishFormState, Wish } from '$lib/types/Wish';
	import WishContentEditor from '$lib/components/wishes/WishContentEditor.svelte';
	import {
		activeWishLanguages,
		loadActiveWishLanguages,
		formatLanguageDisplay
	} from '$lib/stores/wishLanguages';

	interface Props {
		wish: Wish | null;
		isOpen: boolean;
		onClose: () => void;
		onSave?: (wishId: string, formData: WishFormState) => Promise<void>;
	}

	const { wish, isOpen, onClose, onSave }: Props = $props();

	// Form state - initialize with wish data when modal opens
	let formData: WishFormState = $state({
		type: WishType.NORMAL,
		eventType: EventType.BIRTHDAY,
		relations: [],
		ageGroups: [],
		specificValues: '',
		text: '',
		isBelated: false,
		language: Language.DE,
		length: WishLength.MEDIUM
	});

	// UI state
	let isSubmitting = $state(false);
	let showPreview = $state(false);
	let isGenerating = $state(false);
	let hasUnsavedChanges = $state(false);

	// Collapsible sections state
	let isBasicInfoExpanded = $state(false);
	let isTargetGroupExpanded = $state(false);
	let isContentExpanded = $state(true);

	// Validation state
	const errors = $state({} as Record<string, string>);

	// Initialize form data when wish changes
	$effect(() => {
		if (wish && isOpen) {
			formData = {
				type: wish.type || WishType.NORMAL,
				eventType: wish.eventType || EventType.BIRTHDAY,
				relations: wish.relations ? [...wish.relations] : [],
				ageGroups: wish.ageGroups ? [...wish.ageGroups] : [],
				specificValues: wish.specificValues?.join(', ') || '',
				text: wish.text || '',
				isBelated: wish.isBelated ?? false,
				language: wish.language || Language.DE,
				length:
					('length' in wish ? (wish.length as WishLength) : WishLength.MEDIUM) || WishLength.MEDIUM
			};
			hasUnsavedChanges = false;
		}
	});

	// Load wish languages when modal opens
	$effect(() => {
		if (isOpen) {
			loadActiveWishLanguages();
		}
	});

	// Track changes
	$effect(() => {
		if (wish && isOpen && formData) {
			hasUnsavedChanges = hasChanges();
		}
	});

	// German translations for display
	const typeLabels = {
		[WishType.NORMAL]: 'Normal',
		[WishType.HEARTFELT]: 'Herzlich',
		[WishType.FUNNY]: 'Humorvoll'
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

	// Summary helper functions
	function getBasicInfoSummary() {
		const parts = [];
		parts.push(typeLabels[formData.type]);
		parts.push(eventTypeLabels[formData.eventType]);

		// Find language display name
		const selectedLang = $activeWishLanguages.find((lang) => lang.code === formData.language);
		if (selectedLang) {
			parts.push(`${selectedLang.flag} ${selectedLang.name}`);
		}

		parts.push(lengthLabels[formData.length]);

		if (formData.isBelated) {
			parts.push('Nachträglich');
		}

		return parts.join(' • ');
	}

	function getTargetGroupSummary() {
		const parts = [];

		// Relations
		if (formData.relations.length > 0) {
			const relationNames = formData.relations.map(
				(rel) => relationLabels[rel as keyof typeof relationLabels]
			);
			parts.push(`Beziehungen: ${relationNames.join(', ')}`);
		}

		// Age groups
		if (formData.ageGroups.length > 0) {
			const ageGroupNames = formData.ageGroups.map(
				(age) => ageGroupLabels[age as keyof typeof ageGroupLabels]
			);
			parts.push(`Alter: ${ageGroupNames.join(', ')}`);
		}

		// Specific values
		if (typeof formData.specificValues === 'string' && formData.specificValues.trim()) {
			parts.push(`Werte: ${formData.specificValues}`);
		}

		return parts.length > 0 ? parts.join(' • ') : 'Keine Zielgruppe ausgewählt';
	}

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
			const newAgeGroups = [
				...formData.ageGroups.filter((ag) => ag !== 'all'),
				ageGroup as AgeGroup
			];

			if (specificAgeGroups.every((ag) => newAgeGroups.includes(ag as AgeGroup))) {
				formData.ageGroups = ['all' as AgeGroup];
			} else {
				formData.ageGroups = newAgeGroups;
			}
		} else {
			if (formData.ageGroups.includes('all' as AgeGroup)) {
				formData.ageGroups = specificAgeGroups.filter((ag) => ag !== ageGroup) as AgeGroup[];
			} else {
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

	async function generateWithAI() {
		if (isGenerating) return;

		try {
			isGenerating = true;
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

	function hasChanges() {
		if (!wish) return false;

		const arraysEqual = (a: string[], b: string[]) => {
			if (a.length !== b.length) return false;
			const sortedA = [...a].sort();
			const sortedB = [...b].sort();
			return sortedA.every((val, index) => val === sortedB[index]);
		};

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
			formData.type !== (wish.type || WishType.NORMAL) ||
			formData.eventType !== (wish.eventType || EventType.BIRTHDAY) ||
			!arraysEqual(formData.relations, wish.relations || []) ||
			!arraysEqual(formData.ageGroups, wish.ageGroups || []) ||
			!specificValuesEqual(formData.specificValues, wish.specificValues) ||
			formData.text !== (wish.text || '') ||
			formData.isBelated !== (wish.isBelated ?? false) ||
			formData.language !== (wish.language || Language.DE) ||
			formData.length !==
				(('length' in wish ? wish.length : WishLength.MEDIUM) || WishLength.MEDIUM)
		);
	}

	async function handleSave() {
		if (!wish || !onSave) return;

		// Validate form
		const newErrors: Record<string, string> = {};

		if (!formData.text.trim()) {
			newErrors.text = 'Wunschtext ist erforderlich.';
		}

		if (formData.relations.length === 0) {
			newErrors.relations = 'Mindestens eine Beziehung muss ausgewählt werden.';
		}

		if (formData.ageGroups.length === 0) {
			newErrors.ageGroups = 'Mindestens eine Altersgruppe muss ausgewählt werden.';
		}

		if (!validateSpecificValues(formData.specificValues)) {
			newErrors.specificValues =
				'Spezifische Werte müssen positive Zahlen sein, getrennt durch Kommas.';
		}

		// Update errors
		Object.keys(errors).forEach((key) => delete errors[key]);
		Object.assign(errors, newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		try {
			isSubmitting = true;
			await onSave(wish.id, formData);
			hasUnsavedChanges = false;
			onClose();
		} catch (error) {
			console.error('Error saving wish:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function closeModal() {
		if (hasUnsavedChanges) {
			if (confirm('Sie haben ungespeicherte Änderungen. Möchten Sie wirklich schließen?')) {
				onClose();
			}
		} else {
			onClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && wish && formData}
	<div
		class="modal modal-open"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal-box max-h-[90vh] max-w-6xl overflow-y-auto">
			<!-- Modal Header -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold">Wunsch bearbeiten</h2>
					<p class="text-base-content/70 text-sm">ID: {wish.id.slice(0, 8)}...</p>
				</div>
				<div class="flex items-center gap-2">
					{#if hasUnsavedChanges}
						<div class="badge badge-warning badge-sm">Ungespeichert</div>
					{/if}
					<button
						class="btn btn-circle btn-ghost btn-sm"
						onclick={closeModal}
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

			<div class="space-y-6">
				<!-- Main Form -->
				<div class="space-y-6">
					<!-- Basis-Informationen -->
					<div
						class="card from-base-100 to-base-50 border-base-300 border bg-gradient-to-r shadow-lg"
					>
						<div class="card-body p-6">
							<!-- Header with toggle -->
							<button
								class="group hover:bg-base-200/50 -m-3 flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors duration-200"
								onclick={() => (isBasicInfoExpanded = !isBasicInfoExpanded)}
							>
								<div class="flex items-center gap-3">
									<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
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
									</div>
									<div>
										<h3 class="text-base-content text-xl font-bold">Basis-Informationen</h3>
										{#if !isBasicInfoExpanded}
											<p class="text-base-content/60 mt-1 text-sm">{getBasicInfoSummary()}</p>
										{/if}
									</div>
								</div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-base-content/60 h-5 w-5 transition-transform duration-200 {isBasicInfoExpanded
										? 'rotate-180'
										: ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							{#if isBasicInfoExpanded}
								<div class="mt-6 space-y-6">
									<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
										<!-- Type & Event Type Group -->
										<div
											class="from-primary/8 via-primary/5 to-primary/10 border-primary/20 space-y-6 rounded-xl border-2 bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
										>
											<div class="mb-2 flex items-center gap-3">
												<div
													class="bg-primary/15 flex h-9 w-9 items-center justify-center rounded-lg"
												>
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
															d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
														/>
													</svg>
												</div>
												<h4 class="text-primary text-sm font-bold tracking-wider uppercase">
													Wunsch-Kategorie
												</h4>
											</div>

											<div class="space-y-4">
												<div class="form-control">
													<label class="label pb-1" for="wish-type-select">
														<span
															class="label-text text-base-content flex items-center gap-2 text-sm font-semibold"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="text-primary/70 h-4 w-4"
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
															Typ
														</span>
													</label>
													<select
														id="wish-type-select"
														class="select select-bordered bg-base-100/80 border-base-300 focus:bg-base-100 focus:border-primary focus:ring-primary/20 text-base-content shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2"
														bind:value={formData.type}
													>
														{#each Object.entries(typeLabels) as [value, label] (value)}
															<option {value}>{label}</option>
														{/each}
													</select>
												</div>

												<div class="form-control">
													<label class="label pb-1" for="wish-event-type-select">
														<span
															class="label-text text-base-content flex items-center gap-2 text-sm font-semibold"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="text-primary/70 h-4 w-4"
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
															Anlass
														</span>
													</label>
													<select
														id="wish-event-type-select"
														class="select select-bordered bg-base-100/80 border-base-300 focus:bg-base-100 focus:border-primary focus:ring-primary/20 text-base-content shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2"
														bind:value={formData.eventType}
													>
														{#each Object.entries(eventTypeLabels) as [value, label] (value)}
															<option {value}>{label}</option>
														{/each}
													</select>
												</div>
											</div>
										</div>

										<!-- Language & Length Group -->
										<div
											class="from-secondary/8 via-secondary/5 to-secondary/10 border-secondary/20 space-y-6 rounded-xl border-2 bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
										>
											<div class="mb-2 flex items-center gap-3">
												<div
													class="bg-secondary/15 flex h-9 w-9 items-center justify-center rounded-lg"
												>
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
															d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
														/>
													</svg>
												</div>
												<h4 class="text-secondary text-sm font-bold tracking-wider uppercase">
													Format & Sprache
												</h4>
											</div>

											<div class="space-y-4">
												<div class="form-control">
													<label class="label pb-1" for="wish-language-select">
														<span
															class="label-text text-base-content flex items-center gap-2 text-sm font-semibold"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="text-secondary/70 h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m9 9v-9"
																/>
															</svg>
															Sprache
														</span>
													</label>
													<select
														id="wish-language-select"
														class="select select-bordered bg-base-100/80 border-base-300 focus:bg-base-100 focus:border-secondary focus:ring-secondary/20 text-base-content shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2"
														bind:value={formData.language}
													>
														{#each $activeWishLanguages as language (language.id)}
															<option value={language.code}
																>{formatLanguageDisplay(language)}</option
															>
														{/each}
													</select>
												</div>

												<div class="form-control">
													<label class="label pb-1" for="wish-length-select">
														<span
															class="label-text text-base-content flex items-center gap-2 text-sm font-semibold"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="text-secondary/70 h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																/>
															</svg>
															Länge
														</span>
													</label>
													<select
														id="wish-length-select"
														class="select select-bordered bg-base-100/80 border-base-300 focus:bg-base-100 focus:border-secondary focus:ring-secondary/20 text-base-content shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2"
														bind:value={formData.length}
													>
														{#each Object.entries(lengthLabels) as [value, label] (value)}
															<option {value}>{label}</option>
														{/each}
													</select>
												</div>
											</div>
										</div>
									</div>

									<!-- Belated checkbox -->
									<div
										class="from-warning/8 via-warning/5 to-warning/8 border-warning/20 rounded-xl border-2 bg-gradient-to-r p-6 shadow-sm transition-all duration-300 hover:shadow-md"
									>
										<div class="form-control">
											<label class="label group cursor-pointer justify-start gap-4 py-3">
												<input
													type="checkbox"
													class="checkbox checkbox-warning checkbox-lg transition-all duration-200 group-hover:scale-105"
													bind:checked={formData.isBelated}
												/>
												<div class="flex items-center gap-3">
													<div
														class="bg-warning/15 group-hover:bg-warning/25 flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="text-warning h-5 w-5"
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
													</div>
													<div>
														<span class="label-text text-base-content text-base font-bold"
															>Nachträglicher Wunsch</span
														>
														<p class="text-base-content/60 mt-1 text-xs">
															Wunsch wird als verspätet markiert
														</p>
													</div>
												</div>
											</label>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Zielgruppe -->
					<div
						class="card from-base-100 to-base-50 border-base-300 border bg-gradient-to-r shadow-lg"
					>
						<div class="card-body p-6">
							<!-- Header with toggle -->
							<button
								class="group hover:bg-base-200/50 -m-3 flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors duration-200"
								onclick={() => (isTargetGroupExpanded = !isTargetGroupExpanded)}
							>
								<div class="flex items-center gap-3">
									<div
										class="bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-lg"
									>
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
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
											/>
										</svg>
									</div>
									<div>
										<h3 class="text-base-content text-xl font-bold">Zielgruppe</h3>
										{#if !isTargetGroupExpanded}
											<p class="text-base-content/60 mt-1 text-sm">{getTargetGroupSummary()}</p>
										{/if}
									</div>
								</div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-base-content/60 h-5 w-5 transition-transform duration-200 {isTargetGroupExpanded
										? 'rotate-180'
										: ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							{#if isTargetGroupExpanded}
								<div class="mt-6 space-y-6">
									<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<!-- Relations -->
										<div class="bg-base-100/50 border-base-200 space-y-4 rounded-lg border p-4">
											<div class="mb-3 flex items-center gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-secondary h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
													/>
												</svg>
												<h4
													class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
												>
													Beziehungen
												</h4>
											</div>
											{#if errors.relations}
												<div class="alert alert-error py-2 text-sm">
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
															d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													</svg>
													{errors.relations}
												</div>
											{/if}
											<div class="grid grid-cols-1 gap-3">
												{#each Object.entries(relationLabels) as [value, label] (value)}
													<label
														class="bg-base-100 border-base-200 hover:border-secondary/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
													>
														<input
															type="checkbox"
															class="checkbox checkbox-secondary checkbox-sm"
															checked={formData.relations.includes(value as Relation)}
															onchange={(e) => handleRelationChange(value, e.currentTarget.checked)}
														/>
														<span class="label-text flex-1 font-medium">{label}</span>
													</label>
												{/each}
											</div>
										</div>

										<!-- Age Groups -->
										<div class="bg-base-100/50 border-base-200 space-y-4 rounded-lg border p-4">
											<div class="mb-3 flex items-center gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-secondary h-4 w-4"
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
												<h4
													class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
												>
													Altersgruppen
												</h4>
											</div>
											{#if errors.ageGroups}
												<div class="alert alert-error py-2 text-sm">
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
															d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													</svg>
													{errors.ageGroups}
												</div>
											{/if}
											<div class="grid grid-cols-1 gap-3">
												{#each Object.entries(ageGroupLabels) as [value, label] (value)}
													<label
														class="bg-base-100 border-base-200 hover:border-secondary/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
													>
														<input
															type="checkbox"
															class="checkbox checkbox-secondary checkbox-sm"
															checked={formData.ageGroups.includes(value as AgeGroup)}
															onchange={(e) => handleAgeGroupChange(value, e.currentTarget.checked)}
														/>
														<span class="label-text flex-1 font-medium">{label}</span>
													</label>
												{/each}
											</div>
										</div>
									</div>

									<!-- Specific Values -->
									<div class="bg-info/5 border-info/20 rounded-lg border p-4">
										<div class="mb-3 flex items-center gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="text-info h-4 w-4"
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
											<h4
												class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
											>
												Spezifische Werte
											</h4>
										</div>
										<div class="form-control">
											<input
												type="text"
												placeholder="z.B. 25, 30, 50 (durch Kommas getrennt)"
												class="input input-bordered bg-base-100 focus:border-info"
												class:input-error={errors.specificValues}
												bind:value={formData.specificValues}
											/>
											{#if errors.specificValues}
												<div class="text-error mt-2 flex items-center gap-2 text-sm">
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
															d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													</svg>
													{errors.specificValues}
												</div>
											{/if}
											<div class="text-base-content/60 mt-2 flex items-center gap-2 text-xs">
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
												Optionale spezifische Zahlen oder Werte (z.B. Alter, Jubiläumsjahr)
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Content Editor -->
					<div
						class="card from-base-100 to-base-50 border-base-300 border bg-gradient-to-r shadow-lg"
					>
						<div class="card-body p-3">
							<!-- Header with toggle -->
							<button
								class="group hover:bg-base-200/50 -m-2 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors duration-200"
								onclick={() => (isContentExpanded = !isContentExpanded)}
							>
								<div class="flex items-center gap-2">
									<div class="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="text-accent h-4 w-4"
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
									</div>
									<div>
										<h3 class="text-base-content text-lg font-bold">Wunschtext</h3>
										{#if !isContentExpanded}
											<p class="text-base-content/60 mt-0.5 text-xs">
												{formData.text.trim()
													? `${formData.text.length} Zeichen: "${formData.text.substring(0, 60)}${formData.text.length > 60 ? '...' : ''}"`
													: 'Noch kein Text eingegeben'}
											</p>
										{/if}
									</div>
								</div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-base-content/60 h-4 w-4 transition-transform duration-200 {isContentExpanded
										? 'rotate-180'
										: ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							{#if isContentExpanded}
								<div class="mt-2">
									<div class="bg-base-100/50 border-base-200 rounded-lg border p-2">
										<WishContentEditor
											{formData}
											{errors}
											{isGenerating}
											onGenerateWithAI={generateWithAI}
											wishId={wish.id}
										/>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Preview and Info Section (moved below main form) -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Preview -->
					<div class="card bg-base-100 border-base-300 border shadow-sm">
						<div class="card-body">
							<h3 class="card-title text-lg">Vorschau</h3>
							<div class="bg-base-200 min-h-32 rounded-lg p-4">
								{#if formData.text.trim()}
									<p class="text-sm leading-relaxed whitespace-pre-wrap">{formData.text}</p>
								{:else}
									<p class="text-base-content/50 text-sm italic">
										Geben Sie Text ein, um eine Vorschau zu sehen...
									</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- Info -->
					<div class="card bg-base-100 border-base-300 border shadow-sm">
						<div class="card-body">
							<h3 class="card-title text-lg">Information</h3>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-base-content/70">Zeichen:</span>
									<span class="font-mono">{formData.text.length}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-base-content/70">Wörter:</span>
									<span class="font-mono"
										>{formData.text.trim() ? formData.text.trim().split(/\s+/).length : 0}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-base-content/70">Status:</span>
									<div class="badge badge-success badge-sm">{wish.status}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Modal Actions -->
			<div class="modal-action mt-6">
				<button class="btn btn-ghost" onclick={closeModal}>Abbrechen</button>
				<button
					class="btn btn-primary"
					onclick={handleSave}
					disabled={isSubmitting || !hasUnsavedChanges}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
						Speichere...
					{:else}
						Speichern
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
