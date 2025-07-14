<script lang="ts">
	import { generateSpecificValues } from '$lib/utils/settings.js';

	interface Props {
		data: any;
		onMessage: (message: string, isError?: boolean) => void;
	}

	let { data, onMessage }: Props = $props();

	let isCollapsed = $state(true);
	let activeTab = $state('de');

	// Handle successful message display
	function handleSuccess(message: string) {
		onMessage(message, false);
	}

	// Handle error message display
	function handleError(message: string) {
		onMessage(message, true);
	}
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
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="form-control">
							<label class="label" for="specificValuesBirthdaysDe">
								<span class="label-text font-medium">🎂 Geburtstage (DE)</span>
							</label>
							<textarea
								id="specificValuesBirthdaysDe"
								name="specificValuesBirthdaysDe"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="18, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100"
								value={data.settings.ai?.specificValuesBirthdaysDe || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('birthday', 'de', handleSuccess, handleError)}
							>
								🤖 KI-Vorschläge
							</button>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesAnniversariesDe">
								<span class="label-text font-medium">💍 Jubiläen (DE)</span>
							</label>
							<textarea
								id="specificValuesAnniversariesDe"
								name="specificValuesAnniversariesDe"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="1, 5, 10, 15, 20, 25, 30, 40, 50, 60"
								value={data.settings.ai?.specificValuesAnniversariesDe || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('anniversary', 'de', handleSuccess, handleError)}
							>
								🤖 KI-Vorschläge
							</button>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesCustomDe">
								<span class="label-text font-medium">🎉 Sonstige (DE)</span>
							</label>
							<textarea
								id="specificValuesCustomDe"
								name="specificValuesCustomDe"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="Weitere spezifische Werte..."
								value={data.settings.ai?.specificValuesCustomDe || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('custom', 'de', handleSuccess, handleError)}
							>
								🤖 KI-Vorschläge
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="form-control">
							<label class="label" for="specificValuesBirthdaysEn">
								<span class="label-text font-medium">🎂 Birthdays (EN)</span>
							</label>
							<textarea
								id="specificValuesBirthdaysEn"
								name="specificValuesBirthdaysEn"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="18, 25, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100"
								value={data.settings.ai?.specificValuesBirthdaysEn || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('birthday', 'en', handleSuccess, handleError)}
							>
								🤖 AI Suggestions
							</button>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesAnniversariesEn">
								<span class="label-text font-medium">💍 Anniversaries (EN)</span>
							</label>
							<textarea
								id="specificValuesAnniversariesEn"
								name="specificValuesAnniversariesEn"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="1, 5, 10, 15, 20, 25, 30, 40, 50, 60"
								value={data.settings.ai?.specificValuesAnniversariesEn || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('anniversary', 'en', handleSuccess, handleError)}
							>
								🤖 AI Suggestions
							</button>
						</div>

						<div class="form-control">
							<label class="label" for="specificValuesCustomEn">
								<span class="label-text font-medium">🎉 Other (EN)</span>
							</label>
							<textarea
								id="specificValuesCustomEn"
								name="specificValuesCustomEn"
								class="textarea-bordered textarea w-full"
								rows="3"
								placeholder="Other specific values..."
								value={data.settings.ai?.specificValuesCustomEn || ''}
							></textarea>
							<button
								type="button"
								class="btn btn-ghost btn-xs mt-1"
								onclick={() => generateSpecificValues('custom', 'en', handleSuccess, handleError)}
							>
								🤖 AI Suggestions
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>