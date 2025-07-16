<script lang="ts">
	import type { SettingsData } from '$lib/types/Settings.js';

	interface Props {
		data: SettingsData;
	}

	const { data }: Props = $props();

	let isCollapsed = $state(true);
	let activeTab = $state('de');
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
					d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
				/>
			</svg>
			🎯 Spezifische Werte
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
			<!-- Language Tabs -->
			<div class="tabs tabs-boxed">
				<button
					type="button"
					class="tab {activeTab === 'de' ? 'tab-active' : ''}"
					onclick={() => (activeTab = 'de')}
				>
					🇩🇪 Deutsch
				</button>
				<button
					type="button"
					class="tab {activeTab === 'en' ? 'tab-active' : ''}"
					onclick={() => (activeTab = 'en')}
				>
					🇺🇸 English
				</button>
			</div>

			{#if activeTab === 'de'}
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="form-control">
							<label class="label" for="specificValuesBirthdayDe">
								<span class="label-text font-medium">🎂 Geburtstage (DE)</span>
							</label>
							<textarea
								id="specificValuesBirthdayDe"
								name="specificValuesBirthdayDe"
								class="textarea-bordered textarea w-full"
								rows="20"
								placeholder="18, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100"
								value={data.settings.specificValues?.birthdayDe || ''}
							></textarea>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesAnniversaryDe">
								<span class="label-text font-medium">💍 Jubiläen (DE)</span>
							</label>
							<textarea
								id="specificValuesAnniversaryDe"
								name="specificValuesAnniversaryDe"
								class="textarea-bordered textarea w-full"
								rows="20"
								placeholder="1, 5, 10, 15, 20, 25, 30, 40, 50, 60"
								value={data.settings.specificValues?.anniversaryDe || ''}
							></textarea>
						</div>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="form-control">
							<label class="label" for="specificValuesBirthdayEn">
								<span class="label-text font-medium">🎂 Birthdays (EN)</span>
							</label>
							<textarea
								id="specificValuesBirthdayEn"
								name="specificValuesBirthdayEn"
								class="textarea-bordered textarea w-full"
								rows="20"
								placeholder="18, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100"
								value={data.settings.specificValues?.birthdayEn || ''}
							></textarea>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesAnniversaryEn">
								<span class="label-text font-medium">💍 Anniversaries (EN)</span>
							</label>
							<textarea
								id="specificValuesAnniversaryEn"
								name="specificValuesAnniversaryEn"
								class="textarea-bordered textarea w-full"
								rows="20"
								placeholder="1, 5, 10, 15, 20, 25, 30, 40, 50, 60"
								value={data.settings.specificValues?.anniversaryEn || ''}
							></textarea>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
