<script lang="ts">
	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let isCollapsed = $state(true);
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
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			🔄 Batch-Generierungs-Prompts
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
		<div class="space-y-4">
			<div class="form-control">
				<label class="label" for="promptBatch">
					<span class="label-text font-medium">🔄 Batch-Generierung</span>
					<span class="label-text-alt">Für mehrere Wünsche gleichzeitig</span>
				</label>
				<textarea
					id="promptBatch"
					name="promptBatch"
					class="textarea-bordered textarea w-full"
					rows="4"
					placeholder="Prompt für Batch-Generierung mit Platzhaltern wie &#123;batchCount&#125;, &#123;batchTypes&#125;, &#123;batchEventTypes&#125;..."
					value={data.settings.ai?.promptBatch || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptBelated">
					<span class="label-text font-medium">⏰ Verspätete Wünsche</span>
					<span class="label-text-alt">Für nachträgliche Glückwünsche</span>
				</label>
				<textarea
					id="promptBelated"
					name="promptBelated"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für verspätete Wünsche..."
					value={data.settings.ai?.promptBelated || ''}
				></textarea>
			</div>
		</div>
	{/if}
</div>