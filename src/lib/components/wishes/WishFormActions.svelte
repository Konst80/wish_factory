<script lang="ts">
	type Props = {
		isSubmitting: boolean;
		generationError: string;
		onClearError?: () => void;
	};

	let { isSubmitting, generationError, onClearError }: Props = $props();
</script>

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
		<button
			type="button"
			class="btn btn-ghost btn-sm"
			aria-label="Fehlermeldung schließen"
			onclick={() => onClearError?.()}
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
