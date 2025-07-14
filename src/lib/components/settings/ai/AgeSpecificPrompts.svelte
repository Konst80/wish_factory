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
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
			👦👨👴 Altersgruppen-spezifische Prompts
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
				<label class="label" for="promptAgeYoung">
					<span class="label-text font-medium">👦 Junge Menschen</span>
					<span class="label-text-alt">Modern, casual, aktuelle Trends</span>
				</label>
				<textarea
					id="promptAgeYoung"
					name="promptAgeYoung"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für junge Menschen..."
					value={data.settings.ai?.promptAgeYoung || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptAgeMiddle">
					<span class="label-text font-medium">👨 Mittleres Alter</span>
					<span class="label-text-alt">Ausgewogen, respektvoll, Lebenserfahrung</span>
				</label>
				<textarea
					id="promptAgeMiddle"
					name="promptAgeMiddle"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für mittleres Alter..."
					value={data.settings.ai?.promptAgeMiddle || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptAgeSenior">
					<span class="label-text font-medium">👴 Senioren</span>
					<span class="label-text-alt">Ehrfürchtig, würdevoll, Weisheit</span>
				</label>
				<textarea
					id="promptAgeSenior"
					name="promptAgeSenior"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für Senioren..."
					value={data.settings.ai?.promptAgeSenior || ''}
				></textarea>
			</div>
		</div>
	{/if}
</div>