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
				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
			/>
		</svg>
		Altersgruppen-spezifische Prompts
	</h3>

	<!-- name of each tab group should be unique -->
	<div class="tabs tabs-lift">
		<label class="tab">
			<input type="radio" name="age_prompts_tabs" checked />
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
					d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
				/>
			</svg>
			Junge Menschen
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptAgeYoung">
					<span class="label-text font-medium">Prompt für junge Menschen</span>
					<span class="label-text-alt">Modern, casual, aktuelle Trends</span>
				</label>
				<textarea
					id="promptAgeYoung"
					name="promptAgeYoung"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für junge Menschen..."
					value={data.settings.ai?.promptAgeYoung || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="age_prompts_tabs" />
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
					d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.25m0 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75m-6 0V9a2.25 2.25 0 0 1 2.25-2.25H15a2.25 2.25 0 0 1 2.25 2.25v5.25m-6 0h6"
				/>
			</svg>
			Mittleres Alter
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptAgeMiddle">
					<span class="label-text font-medium">Prompt für mittleres Alter</span>
					<span class="label-text-alt">Ausgewogen, respektvoll, Lebenserfahrung</span>
				</label>
				<textarea
					id="promptAgeMiddle"
					name="promptAgeMiddle"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für mittleres Alter..."
					value={data.settings.ai?.promptAgeMiddle || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="age_prompts_tabs" />
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
					d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443a55.381 55.381 0 0 1 5.25 2.882V15"
				/>
			</svg>
			Senioren
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptAgeSenior">
					<span class="label-text font-medium">Prompt für Senioren</span>
					<span class="label-text-alt">Ehrfürchtig, würdevoll, Weisheit</span>
				</label>
				<textarea
					id="promptAgeSenior"
					name="promptAgeSenior"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für Senioren..."
					value={data.settings.ai?.promptAgeSenior || ''}
				></textarea>
			</div>
		</div>
	</div>
</div>
