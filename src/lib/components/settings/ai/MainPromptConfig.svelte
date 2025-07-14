<script lang="ts">
	import { insertPlaceholder } from '$lib/utils/settings.js';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let isTemplateVariablesCollapsed = $state(true);
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
				d="M9 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
			/>
		</svg>
		Haupt-Prompt-Konfiguration
	</h3>

	<div class="form-control">
		<label class="label" for="promptTemplate">
			<span class="label-text font-medium">Hauptvorlage für Wunsch-Generierung</span>
		</label>
		<textarea
			id="promptTemplate"
			name="promptTemplate"
			class="textarea-bordered textarea w-full h-96"
			placeholder="Haupt-Prompt-Template mit Platzhaltern wie &#123;count&#125;, &#123;countText&#125;, &#123;languageTexts&#125;, &#123;length&#125;, &#123;specificValues&#125;, &#123;additionalInstructions&#125;"
			value={data.settings.ai?.promptTemplate || ''}
		></textarea>
		
		<!-- Template Variables Helper -->
		<button
			type="button"
			class="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary-focus"
			onclick={() => (isTemplateVariablesCollapsed = !isTemplateVariablesCollapsed)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 transition-transform {isTemplateVariablesCollapsed ? '' : 'rotate-180'}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
			Template-Variablen anzeigen
		</button>

		{#if !isTemplateVariablesCollapsed}
			<div class="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{count}')}
				>
					{'{count}'}
				</button>
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{countText}')}
				>
					{'{countText}'}
				</button>
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{languageTexts}')}
				>
					{'{languageTexts}'}
				</button>
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{length}')}
				>
					{'{length}'}
				</button>
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{specificValues}')}
				>
					{'{specificValues}'}
				</button>
				<button
					type="button"
					class="btn btn-outline btn-xs"
					onclick={() => insertPlaceholder('promptTemplate', '{additionalInstructions}')}
				>
					{'{additionalInstructions}'}
				</button>
			</div>
		{/if}
	</div>
</div>