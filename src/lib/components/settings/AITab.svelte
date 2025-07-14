<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	// Import all modular AI components
	import ModelBasicSettings from './ai/ModelBasicSettings.svelte';
	import MainPromptConfig from './ai/MainPromptConfig.svelte';
	import AgeSpecificPrompts from './ai/AgeSpecificPrompts.svelte';
	import RelationSpecificPrompts from './ai/RelationSpecificPrompts.svelte';
	import BatchPrompts from './ai/BatchPrompts.svelte';
	import SpecificValuesConfig from './ai/SpecificValuesConfig.svelte';
	import AdvancedParameters from './ai/AdvancedParameters.svelte';

	interface Props {
		data: any;
		isSubmitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
	}

	let { data, isSubmitting, onSubmittingChange, onMessage }: Props = $props();
</script>

{#if data.user.role === 'Administrator'}
	<div class="card bg-base-100 border-base-200 border shadow-xl">
		<div class="card-body">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="card-title flex items-center gap-3 text-xl">
					<div class="bg-accent/10 rounded-lg p-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-accent h-5 w-5"
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
					</div>
					KI-Einstellungen
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
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Nur Administrator
				</div>
			</div>

			<form
				method="POST"
				action="?/updateAI"
				use:enhance={() => {
					onSubmittingChange(true);
					return async ({ result }) => {
						if (result.type === 'success') {
							await invalidateAll();
							onMessage((result.data?.message as string) || 'KI-Einstellungen erfolgreich gespeichert!', false);
						} else if (result.type === 'failure') {
							onMessage((result.data?.message as string) || 'Fehler beim Speichern der KI-Einstellungen', true);
						}
						onSubmittingChange(false);
					};
				}}
			>
				<div class="space-y-6">
					<!-- Model & Basic Settings -->
					<ModelBasicSettings {data} />

					<!-- Main Prompt Configuration -->
					<MainPromptConfig {data} />

					<!-- Age-Specific Prompts -->
					<AgeSpecificPrompts {data} />

					<!-- Relation-Specific Prompts -->
					<RelationSpecificPrompts {data} />

					<!-- Batch Generation Prompts -->
					<BatchPrompts {data} />

					<!-- Specific Values Configuration -->
					<SpecificValuesConfig {data} {onMessage} />

					<!-- Advanced Parameters -->
					<AdvancedParameters {data} />

					<!-- Submit Section -->
					<div class="border-base-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
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
							<span>KI-Einstellungen werden sofort angewendet</span>
						</div>
						<button type="submit" class="btn btn-primary btn-lg gap-2" disabled={isSubmitting}>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Speichern...
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
								KI-Einstellungen speichern
							{/if}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{:else}
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
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
			/>
		</svg>
		<span>KI-Einstellungen sind nur für Administratoren verfügbar.</span>
	</div>
{/if}