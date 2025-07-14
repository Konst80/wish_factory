<script lang="ts">
	import { setPreset } from '$lib/utils/settings.js';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let isCollapsed = $state(true);
	
	// Reactive variables for slider values
	let temperatureValue = $state(data.settings.ai?.temperature || 0.7);
	let topPValue = $state(data.settings.ai?.topP || 1);
	let frequencyValue = $state(data.settings.ai?.frequencyPenalty || 0);
</script>

<div class="bg-base-50 rounded-lg p-4">
	<button
		type="button"
		class="mb-4 flex w-full items-center justify-between text-lg font-semibold"
		onclick={() => (isCollapsed = !isCollapsed)}
	>
		<div class="flex items-center gap-2">
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
			⚙️ Erweiterte Parameter
		</div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 transition-transform {isCollapsed ? '' : 'rotate-180'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if !isCollapsed}
		<div class="space-y-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="form-control">
					<label class="label" for="temperature">
						<span class="label-text font-medium">🌡️ Temperature</span>
						<span class="badge badge-outline">{temperatureValue}</span>
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
					<div class="flex w-full justify-between px-2 text-xs">
						<span>Präzise</span>
						<span>Ausgewogen</span>
						<span>Kreativ</span>
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="topP">
						<span class="label-text font-medium">🎯 Top-P</span>
						<span class="badge badge-outline">{topPValue}</span>
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
				</div>

				<div class="form-control">
					<label class="label" for="maxTokens">
						<span class="label-text font-medium">📝 Max Tokens</span>
					</label>
					<input
						id="maxTokens"
						name="maxTokens"
						type="number"
						min="50"
						max="4000"
						class="input-bordered input w-full"
						value={data.settings.ai?.maxTokens || 500}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="frequencyPenalty">
						<span class="label-text font-medium">🔄 Frequency Penalty</span>
						<span class="badge badge-outline">{frequencyValue}</span>
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
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				<button type="button" class="btn btn-outline btn-sm" onclick={() => setPreset('precise')}>
					🎯 Präzise
				</button>
				<button type="button" class="btn btn-outline btn-sm" onclick={() => setPreset('balanced')}>
					⚖️ Ausgewogen
				</button>
				<button type="button" class="btn btn-outline btn-sm" onclick={() => setPreset('creative')}>
					🎨 Kreativ
				</button>
				<button type="button" class="btn btn-outline btn-sm" onclick={() => setPreset('default')}>
					🔄 Standard
				</button>
			</div>
		</div>
	{/if}
</div>