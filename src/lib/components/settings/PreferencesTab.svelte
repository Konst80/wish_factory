<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SettingsData, EnhanceResult } from '$lib/types/Settings.js';

	interface Props {
		data: SettingsData;
		themes: Array<{ value: string; label: string }>;
		languages: Array<{ value: string; label: string }>;
		isSubmitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
	}

	const { data, themes, languages, isSubmitting, onSubmittingChange, onMessage }: Props = $props();
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Benutzer-Einstellungen</h2>
		<form
			method="POST"
			action="?/updatePreferences"
			use:enhance={() => {
				onSubmittingChange(true);
				return async ({ result }: EnhanceResult) => {
					if (result.type === 'success') {
						await invalidateAll();
						onMessage(
							(result.data?.message as string) || 'Einstellungen erfolgreich gespeichert!',
							false
						);

						// Handle theme change
						if (typeof window !== 'undefined') {
							const form = document.querySelector(
								'form[action="?/updatePreferences"]'
							) as HTMLFormElement;
							if (form) {
								const formData = new FormData(form);
								const newTheme = formData.get('theme') as string;
								if (newTheme) {
									window.dispatchEvent(
										new CustomEvent('themeChanged', { detail: { theme: newTheme } })
									);
								}
							}
						}
					} else if (result.type === 'failure') {
						onMessage((result.data?.message as string) || 'Ein Fehler ist aufgetreten', true);
					}
					onSubmittingChange(false);
				};
			}}
		>
			<div class="space-y-4">
				<div class="form-control">
					<label class="label" for="theme">
						<span class="label-text">Theme</span>
					</label>
					<select
						id="theme"
						name="theme"
						class="select-bordered select w-full"
						value={data.settings.preferences?.theme || 'light'}
					>
						{#each themes as theme (theme.value)}
							<option value={theme.value}>{theme.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-control">
					<label class="label" for="defaultLanguage">
						<span class="label-text">Standard-Sprache für Wünsche</span>
					</label>
					<select
						id="defaultLanguage"
						name="defaultLanguage"
						class="select-bordered select w-full"
						value={data.settings.preferences?.defaultLanguage || 'de'}
					>
						{#each languages as lang (lang.value)}
							<option value={lang.value}>{lang.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-control">
					<label class="label" for="wishesPerPage">
						<span class="label-text">Wünsche pro Seite</span>
					</label>
					<select
						id="wishesPerPage"
						name="wishesPerPage"
						class="select-bordered select w-full"
						value={data.settings.preferences?.wishesPerPage || 10}
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">Automatisches Speichern</span>
						<input
							type="checkbox"
							name="autoSave"
							class="toggle toggle-primary"
							checked={data.settings.preferences?.autoSave || false}
						/>
					</label>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">Vor Löschen bestätigen</span>
						<input
							type="checkbox"
							name="confirmBeforeDelete"
							class="toggle toggle-secondary"
							checked={data.settings.preferences?.confirmBeforeDelete || true}
						/>
					</label>
				</div>

				<div class="form-control pt-4">
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
							Speichern...
						{:else}
							Einstellungen speichern
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
