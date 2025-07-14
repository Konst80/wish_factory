<script lang="ts">
	import { setPreset } from '$lib/utils/settings.js';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();
	
	// Reactive variables for slider values
	let temperatureValue = $state(data.settings.ai?.temperature || 0.7);
	let topPValue = $state(data.settings.ai?.topP || 1);
	let frequencyValue = $state(data.settings.ai?.frequencyPenalty || 0);
	let presencePenaltyValue = $state(data.settings.ai?.presencePenalty || 0);
</script>

<div class="bg-base-50 rounded-lg p-4">
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
				d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
			/>
		</svg>
		Erweiterte Parameter
	</h3>

	<div class="tabs tabs-lift">
		<label class="tab">
			<input type="radio" name="advanced_params_tabs" checked />
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 me-2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
			</svg>
			Parameter
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div class="form-control">
					<label class="label" for="temperature">
						<span class="label-text font-medium">Temperature</span>
						<span class="badge badge-primary badge-outline">{temperatureValue}</span>
					</label>
					<input
						id="temperature"
						name="temperature"
						type="range"
						min="0"
						max="2"
						step="0.1"
						class="range range-primary"
						value={temperatureValue}
						oninput={(e) => temperatureValue = parseFloat(e.currentTarget.value)}
					/>
					<div class="flex w-full justify-between px-2 text-xs opacity-70">
						<span>Präzise</span>
						<span>Ausgewogen</span>
						<span>Kreativ</span>
					</div>
					<div class="mt-2 text-xs opacity-60">
						Steuert die Kreativität der Antworten
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="topP">
						<span class="label-text font-medium">Top-P</span>
						<span class="badge badge-secondary badge-outline">{topPValue}</span>
					</label>
					<input
						id="topP"
						name="topP"
						type="range"
						min="0"
						max="1"
						step="0.05"
						class="range range-secondary"
						value={topPValue}
						oninput={(e) => topPValue = parseFloat(e.currentTarget.value)}
					/>
					<div class="mt-2 text-xs opacity-60">
						Nucleus Sampling - alternative zur Temperature
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="maxTokens">
						<span class="label-text font-medium">Max Tokens</span>
					</label>
					<input
						id="maxTokens"
						name="maxTokens"
						type="number"
						min="50"
						max="4000"
						step="50"
						class="input-bordered input w-full"
						value={data.settings.ai?.maxTokens || 500}
					/>
					<div class="mt-2 text-xs opacity-60">
						Maximale Länge der generierten Antwort
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="frequencyPenalty">
						<span class="label-text font-medium">Frequency Penalty</span>
						<span class="badge badge-accent badge-outline">{frequencyValue}</span>
					</label>
					<input
						id="frequencyPenalty"
						name="frequencyPenalty"
						type="range"
						min="0"
						max="2"
						step="0.1"
						class="range range-accent"
						value={frequencyValue}
						oninput={(e) => frequencyValue = parseFloat(e.currentTarget.value)}
					/>
					<div class="mt-2 text-xs opacity-60">
						Reduziert Wiederholungen häufiger Wörter
					</div>
				</div>

				<div class="form-control lg:col-span-2">
					<label class="label" for="presencePenalty">
						<span class="label-text font-medium">Presence Penalty</span>
						<span class="badge badge-warning badge-outline">{presencePenaltyValue}</span>
					</label>
					<input
						id="presencePenalty"
						name="presencePenalty"
						type="range"
						min="0"
						max="2"
						step="0.1"
						class="range range-warning"
						value={presencePenaltyValue}
						oninput={(e) => presencePenaltyValue = parseFloat(e.currentTarget.value)}
					/>
					<div class="mt-2 text-xs opacity-60">
						Fördert neue Themen und verhindert Repetition
					</div>
				</div>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="advanced_params_tabs" />
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 me-2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571-3-5.571 3" />
			</svg>
			Presets
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="mb-4">
				<h4 class="text-base font-medium mb-3">Schnell-Einstellungen</h4>
				<p class="text-sm opacity-70 mb-4">
					Wählen Sie ein vordefiniertes Profil für verschiedene Anwendungsfälle
				</p>
			</div>
			
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<button type="button" class="btn btn-outline btn-lg justify-start" onclick={() => setPreset('precise')}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
					</svg>
					<div class="text-left">
						<div class="font-medium">Präzise</div>
						<div class="text-xs opacity-70">Exakte, faktische Antworten</div>
					</div>
				</button>
				
				<button type="button" class="btn btn-outline btn-lg justify-start" onclick={() => setPreset('balanced')}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.254 48.254 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.062 9.571a11.429 11.429 0 0 1-2.062-.52M18.75 4.97l2.062 9.57M6 9.97l3.5 1.963 2-3.896" />
					</svg>
					<div class="text-left">
						<div class="font-medium">Ausgewogen</div>
						<div class="text-xs opacity-70">Perfekte Balance</div>
					</div>
				</button>
				
				<button type="button" class="btn btn-outline btn-lg justify-start" onclick={() => setPreset('creative')}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
					</svg>
					<div class="text-left">
						<div class="font-medium">Kreativ</div>
						<div class="text-xs opacity-70">Originelle, vielfältige Texte</div>
					</div>
				</button>
				
				<button type="button" class="btn btn-outline btn-lg justify-start" onclick={() => setPreset('default')}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
					</svg>
					<div class="text-left">
						<div class="font-medium">Standard</div>
						<div class="text-xs opacity-70">Zurück zu Standardwerten</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</div>