<script lang="ts">
	import type { SettingsData } from '$lib/types/Settings.js';

	interface Props {
		data: SettingsData;
	}

	const { data }: Props = $props();
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
				d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
			/>
		</svg>
		Batch-Generierungs-Prompts
	</h3>

	<!-- name of each tab group should be unique -->
	<div class="tabs tabs-lift">
		<label class="tab">
			<input type="radio" name="batch_prompts_tabs" checked />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
				/>
			</svg>
			Batch-Generierung
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptBatch">
					<span class="label-text font-medium">Prompt für Batch-Generierung</span>
					<span class="label-text-alt">Für mehrere Wünsche gleichzeitig</span>
				</label>
				<textarea
					id="promptBatch"
					name="promptBatch"
					class="textarea-bordered textarea w-full"
					rows="10"
					placeholder="Prompt für Batch-Generierung mit Platzhaltern wie batchCount, batchTypes, batchEventTypes..."
					value={data.settings.ai?.promptBatch || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="batch_prompts_tabs" />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				/>
			</svg>
			Verspätete Wünsche
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptBelated">
					<span class="label-text font-medium">Prompt für verspätete Wünsche</span>
					<span class="label-text-alt">Für nachträgliche Glückwünsche</span>
				</label>
				<textarea
					id="promptBelated"
					name="promptBelated"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für verspätete Wünsche..."
					value={data.settings.ai?.promptBelated || ''}
				></textarea>
			</div>
		</div>
	</div>
</div>
