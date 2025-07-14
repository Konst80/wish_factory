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
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			👥💕💼👪 Beziehungs-spezifische Prompts
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
				<label class="label" for="promptFriend">
					<span class="label-text font-medium">👥 Freunde</span>
					<span class="label-text-alt">Freundlich, vertraut, persönliche Anrede</span>
				</label>
				<textarea
					id="promptFriend"
					name="promptFriend"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für Freunde..."
					value={data.settings.ai?.promptFriend || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptFamily">
					<span class="label-text font-medium">👪 Familie</span>
					<span class="label-text-alt">Warm, familiär, Verbundenheit</span>
				</label>
				<textarea
					id="promptFamily"
					name="promptFamily"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für Familie..."
					value={data.settings.ai?.promptFamily || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptPartner">
					<span class="label-text font-medium">💕 Partner</span>
					<span class="label-text-alt">Liebevoll, romantisch, intim</span>
				</label>
				<textarea
					id="promptPartner"
					name="promptPartner"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für Partner..."
					value={data.settings.ai?.promptPartner || ''}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="promptColleague">
					<span class="label-text font-medium">💼 Kollegen</span>
					<span class="label-text-alt">Professionell, respektvoll, höflich</span>
				</label>
				<textarea
					id="promptColleague"
					name="promptColleague"
					class="textarea-bordered textarea w-full"
					rows="3"
					placeholder="Prompt für Kollegen..."
					value={data.settings.ai?.promptColleague || ''}
				></textarea>
			</div>
		</div>
	{/if}
</div>