<script lang="ts">
	import { WishLength, type WishFormState } from '$lib/types/Wish';

	type Props = {
		formData: WishFormState;
		errors: Record<string, string>;
		isGenerating: boolean;
		onGenerateWithAI: () => void;
	};

	let { formData, errors, isGenerating, onGenerateWithAI }: Props = $props();

	const lengthLabels = {
		short: 'Kurz',
		medium: 'Mittel',
		long: 'Lang'
	};
</script>

<!-- Wish Type Section -->
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
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
		Wunsch-Art
	</h3>
	<div class="form-control">
		<fieldset>
			<legend class="label-text flex items-center gap-2 text-base font-medium">Wunsch-Art *</legend>
			<div class="grid grid-cols-2 gap-4">
				<label
					class="flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all {formData.belated ===
					false
						? 'border-primary bg-primary/5'
						: 'border-base-300'}"
				>
					<input
						type="radio"
						name="belated"
						value={false}
						bind:group={formData.belated}
						class="radio radio-primary"
						required
					/>
					<div class="flex flex-col">
						<span class="font-medium">Normal</span>
						<span class="text-base-content/60 text-sm">Regulärer Wunsch</span>
					</div>
				</label>
				<label
					class="flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all {formData.belated ===
					true
						? 'border-primary bg-primary/5'
						: 'border-base-300'}"
				>
					<input
						type="radio"
						name="belated"
						value={true}
						bind:group={formData.belated}
						class="radio radio-primary"
						required
					/>
					<div class="flex flex-col">
						<span class="font-medium">Nachträglich</span>
						<span class="text-base-content/60 text-sm">Verspäteter Wunsch</span>
					</div>
				</label>
			</div>
			{#if errors.belated}
				<div class="label">
					<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
						>{errors.belated}</span
					>
				</div>
			{/if}
		</fieldset>
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
				onclick={onGenerateWithAI}
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
		<div class="label">
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
				Verwenden Sie Platzhalter wie [Name], [Age], [Age - X], [Age + X] für dynamische Inhalte
			</span>
		</div>
		{#if errors.text}
			<div class="label">
				<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
					>{errors.text}</span
				>
			</div>
		{/if}
	</div>

	<!-- Length Selection -->
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
						d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
					/>
				</svg>
				Gewünschte Länge
			</span>
		</label>
		<select
			id="length"
			name="length"
			class="select-bordered select select-lg w-full"
			class:select-error={errors.length}
			bind:value={formData.length}
		>
			{#each Object.values(WishLength) as lengthOption (lengthOption)}
				<option value={lengthOption}>{lengthLabels[lengthOption]}</option>
			{/each}
		</select>
		{#if errors.length}
			<div class="label">
				<span class="label-text-alt text-error animate-in slide-in-from-left-2 duration-200"
					>{errors.length}</span
				>
			</div>
		{/if}
	</div>
</div>
