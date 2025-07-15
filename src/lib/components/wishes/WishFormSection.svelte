<script lang="ts">
	import { WishType, EventType, Relation, AgeGroup, type WishFormState } from '$lib/types/Wish';
	import WishLanguageSelector from './WishLanguageSelector.svelte';
	import { loadActiveWishLanguages } from '$lib/stores/wishLanguages';
	import { onMount } from 'svelte';

	type Props = {
		formData: WishFormState;
		errors: Record<string, string>;
		onRelationChange: (relation: string, checked: boolean) => void;
		onAgeGroupChange: (ageGroup: string, checked: boolean) => void;
	};

	let { formData, errors, onRelationChange, onAgeGroupChange }: Props = $props();

	function handleLanguageChange(language: string) {
		formData.language = language;
	}

	// German translations for display
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

	const relationLabels = {
		friend: 'Freund/in',
		family: 'Familie',
		partner: 'Partner/in',
		colleague: 'Kollege/in'
	};

	const ageGroupLabels = {
		all: 'Alle',
		young: 'Jung (18-35)',
		middle: 'Mittleres Alter (36-55)',
		senior: 'Senior (55+)'
	};

	// Load active wish languages on mount
	onMount(() => {
		loadActiveWishLanguages();
	});
</script>

<!-- Basic Information Section -->
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
				class:select-error={errors.type}
				bind:value={formData.type}
				required
			>
				{#each Object.values(WishType) as wishType (wishType)}
					<option value={wishType}>{typeLabels[wishType]}</option>
				{/each}
			</select>
			{#if errors.type}
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.type}</span
					>
				</div>
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
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.eventType}</span
					>
				</div>
			{/if}
		</div>

		<!-- Sprache -->
		<WishLanguageSelector
			selectedLanguage={formData.language}
			onLanguageChange={handleLanguageChange}
			name="language"
			error={errors.language}
		/>

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
				<span class="label-text-alt">Optional: Alter, Jahre, etc.</span>
			</label>
			<input
				id="specificValues"
				name="specificValues"
				type="number"
				class="input-bordered input input-lg w-full"
				class:input-error={errors.specificValues}
				bind:value={formData.specificValues}
				placeholder="z.B. 30 für 30. Geburtstag"
			/>
			{#if errors.specificValues}
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.specificValues}</span
					>
				</div>
			{/if}
		</div>
	</div>
</div>

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
		<fieldset>
			<legend class="label-text flex items-center gap-2 text-base font-medium">
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
				<span class="label-text-alt badge badge-neutral badge-sm ml-2"
					>Mindestens eine auswählen</span
				>
			</legend>
			<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
				{#each Object.values(Relation) as relation (relation)}
					<label
						class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {formData.relations.includes(
							relation
						)
							? 'border-primary bg-primary/10'
							: 'border-base-300'}"
					>
						<input
							type="checkbox"
							name="relations"
							value={relation}
							class="checkbox-primary checkbox checkbox-sm mr-3"
							checked={formData.relations.includes(relation)}
							onchange={(e) => onRelationChange(relation, e.currentTarget.checked)}
						/>
						<span class="label-text text-sm font-medium">{relationLabels[relation]}</span>
					</label>
				{/each}
			</div>
			{#if errors.relations}
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.relations}</span
					>
				</div>
			{/if}
		</fieldset>
	</div>

	<!-- Altersgruppen -->
	<div class="form-control">
		<fieldset>
			<legend class="label-text flex items-center gap-2 text-base font-medium">
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
				Altersgruppen *
				<span class="label-text-alt badge badge-neutral badge-sm ml-2"
					>Mindestens eine auswählen</span
				>
			</legend>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each Object.values(AgeGroup).filter((ag) => ag !== 'all') as ageGroup (ageGroup)}
					{@const isChecked =
						formData.ageGroups.includes('all') || formData.ageGroups.includes(ageGroup)}
					<label
						class="label bg-base-100 hover:bg-base-200 cursor-pointer justify-start rounded-lg border-2 p-3 transition-colors {isChecked
							? 'border-primary bg-primary/10'
							: 'border-base-300'}"
					>
						<input
							type="checkbox"
							name="ageGroups"
							value={ageGroup}
							class="checkbox-primary checkbox checkbox-sm mr-3"
							checked={isChecked}
							onchange={(e) => onAgeGroupChange(ageGroup, e.currentTarget.checked)}
						/>
						<span class="label-text text-sm font-medium">{ageGroupLabels[ageGroup]}</span>
					</label>
				{/each}
			</div>
			{#if errors.ageGroups}
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.ageGroups}</span
					>
				</div>
			{/if}
		</fieldset>
	</div>
</div>
