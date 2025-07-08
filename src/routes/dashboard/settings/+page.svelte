<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let activeTab = $state('profile');
	let showSuccessMessage = $state(false);
	let showErrorMessage = $state(false);
	let currentMessage = $state('');
	let showPasswordModal = $state(false);
	let isSubmitting = $state(false);

	// Show form result messages
	$effect(() => {
		if (form?.success) {
			currentMessage = form.message || 'Einstellungen erfolgreich gespeichert!';
			showSuccessMessage = true;
			showErrorMessage = false;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
		} else if (form?.message) {
			currentMessage = form.message;
			showErrorMessage = true;
			showSuccessMessage = false;
			setTimeout(() => {
				showErrorMessage = false;
			}, 5000);
		}
	});

	const tabs = [
		{
			id: 'profile',
			label: 'Profil',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		},
		{
			id: 'notifications',
			label: 'Benachrichtigungen',
			icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
		},
		{
			id: 'preferences',
			label: 'Einstellungen',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
		},
		...(data.user.role === 'Administrator'
			? [
					{
						id: 'ai',
						label: 'KI-Einstellungen',
						icon: 'M13 10V3L4 14h7v7l9-11h-7z'
					}
				]
			: []),
		{
			id: 'system',
			label: 'System',
			icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
		}
	];

	const languages = [
		{ value: 'de', label: 'Deutsch' },
		{ value: 'en', label: 'English' }
	];

	const timezones = [
		{ value: 'Europe/Berlin', label: 'Europa/Berlin (GMT+1)' },
		{ value: 'Europe/London', label: 'Europa/London (GMT+0)' },
		{ value: 'America/New_York', label: 'Amerika/New York (GMT-5)' },
		{ value: 'Asia/Tokyo', label: 'Asien/Tokio (GMT+9)' }
	];

	const themes = [
		{ value: 'light', label: 'Hell' },
		{ value: 'dark', label: 'Dunkel' },
		{ value: 'corporate', label: 'Corporate' },
		{ value: 'business', label: 'Business' }
	];

	const exportFormats = [
		{ value: 'json', label: 'JSON' },
		{ value: 'csv', label: 'CSV' },
		{ value: 'xml', label: 'XML' }
	];

	const backupFrequencies = [
		{ value: 'daily', label: 'Täglich' },
		{ value: 'weekly', label: 'Wöchentlich' },
		{ value: 'monthly', label: 'Monatlich' }
	];

	function resetSettings() {
		if (confirm('Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?')) {
			location.reload();
		}
	}

	function exportSettings() {
		const dataStr = JSON.stringify(data.settings, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'wish_factory_settings.json';
		link.click();
		URL.revokeObjectURL(url);
	}

	function saveSettings() {
		// This function handles the general save action
		// Individual form submissions handle their own saving
		alert('Bitte verwenden Sie die Speichern-Buttons in den jeweiligen Abschnitten.');
	}

	function setPreset(preset: string) {
		const temperatureSlider = document.getElementById('temperature') as HTMLInputElement;
		const topPSlider = document.getElementById('topP') as HTMLInputElement;
		const maxTokensSlider = document.getElementById('maxTokens') as HTMLInputElement;
		const frequencyPenaltySlider = document.getElementById('frequencyPenalty') as HTMLInputElement;

		if (!temperatureSlider || !topPSlider || !maxTokensSlider || !frequencyPenaltySlider) return;

		switch (preset) {
			case 'precise':
				temperatureSlider.value = '0.3';
				topPSlider.value = '0.7';
				maxTokensSlider.value = '1500';
				frequencyPenaltySlider.value = '0.2';
				break;
			case 'balanced':
				temperatureSlider.value = '0.8';
				topPSlider.value = '0.9';
				maxTokensSlider.value = '2000';
				frequencyPenaltySlider.value = '0.1';
				break;
			case 'creative':
				temperatureSlider.value = '1.2';
				topPSlider.value = '0.95';
				maxTokensSlider.value = '2500';
				frequencyPenaltySlider.value = '0.0';
				break;
			case 'default':
				temperatureSlider.value = '0.8';
				topPSlider.value = '0.9';
				maxTokensSlider.value = '2000';
				frequencyPenaltySlider.value = '0.1';
				break;
		}

		// Update the displayed values (badges)
		temperatureSlider.dispatchEvent(new Event('input'));
		topPSlider.dispatchEvent(new Event('input'));
		maxTokensSlider.dispatchEvent(new Event('input'));
		frequencyPenaltySlider.dispatchEvent(new Event('input'));
	}

	function insertPlaceholder(textareaId: string, placeholder: string) {
		const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const value = textarea.value;

		// Insert the placeholder at cursor position
		const newValue = value.substring(0, start) + placeholder + value.substring(end);
		textarea.value = newValue;

		// Move cursor to end of inserted text
		const newCursorPos = start + placeholder.length;
		textarea.setSelectionRange(newCursorPos, newCursorPos);

		// Focus the textarea
		textarea.focus();
	}
</script>

<svelte:head>
	<title>Einstellungen - Wish Factory</title>
</svelte:head>

<!-- Success Message -->
{#if showSuccessMessage}
	<div class="toast toast-end toast-top">
		<div class="alert alert-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{currentMessage}</span>
		</div>
	</div>
{/if}

<!-- Error Message -->
{#if showErrorMessage}
	<div class="toast toast-end toast-top">
		<div class="alert alert-error">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{currentMessage}</span>
		</div>
	</div>
{/if}

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Einstellungen</h1>
			<p class="text-base-content/70 mt-2">
				Verwalten Sie Ihre Konto-Einstellungen und Präferenzen
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={exportSettings}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				Exportieren
			</button>
			<button class="btn btn-primary btn-sm" onclick={saveSettings}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
					/>
				</svg>
				Speichern
			</button>
		</div>
	</div>
</div>

<!-- Settings Navigation -->
<div class="tabs-boxed tabs mb-6">
	{#each tabs as tab}
		<button
			class="tab {activeTab === tab.id ? 'tab-active' : ''}"
			onclick={() => (activeTab = tab.id)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mr-2 h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
			</svg>
			{tab.label}
		</button>
	{/each}
</div>

<!-- Settings Content -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main Settings Panel -->
	<div class="lg:col-span-2">
		{#if activeTab === 'profile'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Profil-Einstellungen</h2>
					<form
						method="POST"
						action="?/updateProfile"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
									currentMessage =
										(result.data?.message as string) || 'Einstellungen erfolgreich gespeichert!';
									showSuccessMessage = true;
									showErrorMessage = false;
									setTimeout(() => {
										showSuccessMessage = false;
									}, 3000);
								} else if (result.type === 'failure') {
									currentMessage = (result.data?.message as string) || 'Ein Fehler ist aufgetreten';
									showErrorMessage = true;
									showSuccessMessage = false;
									setTimeout(() => {
										showErrorMessage = false;
									}, 5000);
								}
								isSubmitting = false;
							};
						}}
					>
						<div class="space-y-4">
							<div class="form-control">
								<label class="label" for="fullName">
									<span class="label-text">Vollständiger Name</span>
								</label>
								<input
									id="fullName"
									name="fullName"
									type="text"
									placeholder="Ihr vollständiger Name"
									class="input-bordered input w-full"
									value={data.settings.profile.fullName}
									required
								/>
							</div>

							<div class="form-control">
								<label class="label" for="email">
									<span class="label-text">E-Mail-Adresse</span>
								</label>
								<input
									id="email"
									type="email"
									placeholder="ihre@email.com"
									class="input-bordered input w-full"
									value={data.settings.profile.email}
									disabled
								/>
								<label class="label">
									<span class="label-text-alt">E-Mail kann nicht geändert werden</span>
								</label>
							</div>

							<div class="form-control">
								<label class="label" for="language">
									<span class="label-text">Sprache</span>
								</label>
								<select
									id="language"
									name="language"
									class="select-bordered select w-full"
									value={data.settings.profile.language}
								>
									{#each languages as lang}
										<option value={lang.value}>{lang.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="timezone">
									<span class="label-text">Zeitzone</span>
								</label>
								<select
									id="timezone"
									name="timezone"
									class="select-bordered select w-full"
									value={data.settings.profile.timezone}
								>
									{#each timezones as tz}
										<option value={tz.value}>{tz.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label">
									<span class="label-text">Passwort</span>
								</label>
								<button
									type="button"
									class="btn btn-outline"
									onclick={() => (showPasswordModal = true)}
								>
									Passwort ändern
								</button>
							</div>

							<div class="card-actions justify-end">
								<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
										Profil speichern
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		{:else if activeTab === 'notifications'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Benachrichtigungen</h2>
					<form
						method="POST"
						action="?/updateNotifications"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
									currentMessage =
										(result.data?.message as string) || 'Einstellungen erfolgreich gespeichert!';
									showSuccessMessage = true;
									showErrorMessage = false;
									setTimeout(() => {
										showSuccessMessage = false;
									}, 3000);
								} else if (result.type === 'failure') {
									currentMessage = (result.data?.message as string) || 'Ein Fehler ist aufgetreten';
									showErrorMessage = true;
									showSuccessMessage = false;
									setTimeout(() => {
										showErrorMessage = false;
									}, 5000);
								}
								isSubmitting = false;
							};
						}}
					>
						<div class="space-y-4">
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">E-Mail-Benachrichtigungen</span>
									<input
										type="checkbox"
										name="emailNotifications"
										class="toggle toggle-primary"
										checked={data.settings.notifications.emailNotifications}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Push-Benachrichtigungen</span>
									<input
										type="checkbox"
										name="pushNotifications"
										class="toggle toggle-primary"
										checked={data.settings.notifications.pushNotifications}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Neue Wunsch-Benachrichtigungen</span>
									<input
										type="checkbox"
										name="newWishAlerts"
										class="toggle toggle-primary"
										checked={data.settings.notifications.newWishAlerts}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Freigabe-Anfragen</span>
									<input
										type="checkbox"
										name="approvalRequests"
										class="toggle toggle-primary"
										checked={data.settings.notifications.approvalRequests}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">System-Updates</span>
									<input
										type="checkbox"
										name="systemUpdates"
										class="toggle toggle-primary"
										checked={data.settings.notifications.systemUpdates}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Wöchentlicher Bericht</span>
									<input
										type="checkbox"
										name="weeklyReport"
										class="toggle toggle-primary"
										checked={data.settings.notifications.weeklyReport}
									/>
								</label>
							</div>

							<div class="card-actions justify-end">
								<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
										Benachrichtigungen speichern
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		{:else if activeTab === 'preferences'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Benutzer-Einstellungen</h2>
					<form
						method="POST"
						action="?/updatePreferences"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
									currentMessage =
										(result.data?.message as string) || 'Einstellungen erfolgreich gespeichert!';
									showSuccessMessage = true;
									showErrorMessage = false;

									// Dispatch theme change event if theme was updated
									if (typeof window !== 'undefined') {
										const form = document.querySelector(
											'form[action="?/updatePreferences"]'
										) as HTMLFormElement;
										if (form) {
											const formData = new FormData(form);
											const newTheme = formData.get('theme') as string;
											if (newTheme) {
												window.dispatchEvent(
													new CustomEvent('themeChanged', {
														detail: { theme: newTheme }
													})
												);
											}
										}
									}

									setTimeout(() => {
										showSuccessMessage = false;
									}, 3000);
								} else if (result.type === 'failure') {
									currentMessage = (result.data?.message as string) || 'Ein Fehler ist aufgetreten';
									showErrorMessage = true;
									showSuccessMessage = false;
									setTimeout(() => {
										showErrorMessage = false;
									}, 5000);
								}
								isSubmitting = false;
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
									value={data.settings.preferences.theme}
								>
									{#each themes as theme}
										<option value={theme.value}>{theme.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="defaultLang">
									<span class="label-text">Standard-Sprache für Wünsche</span>
								</label>
								<select
									id="defaultLang"
									name="defaultLanguage"
									class="select-bordered select w-full"
									value={data.settings.preferences.defaultLanguage}
								>
									{#each languages as lang}
										<option value={lang.value}>{lang.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="wishesPerPage">
									<span class="label-text">Wünsche pro Seite</span>
								</label>
								<input
									id="wishesPerPage"
									name="wishesPerPage"
									type="number"
									min="10"
									max="100"
									class="input-bordered input w-full"
									value={data.settings.preferences.wishesPerPage}
								/>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Automatisches Speichern</span>
									<input
										type="checkbox"
										name="autoSave"
										class="toggle toggle-primary"
										checked={data.settings.preferences.autoSave}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Vor Löschen bestätigen</span>
									<input
										type="checkbox"
										name="confirmBeforeDelete"
										class="toggle toggle-primary"
										checked={data.settings.preferences.confirmBeforeDelete}
									/>
								</label>
							</div>

							<div class="card-actions justify-end">
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
		{:else if activeTab === 'ai' && data.user.role === 'Administrator'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-xl">
					<form
						method="POST"
						action="?/updateAI"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									await invalidateAll();
								}
								update();
							};
						}}
					>
						<div class="card-body">
							<h3 class="card-title mb-6 text-xl">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-primary h-7 w-7"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
								KI-Konfiguration
							</h3>

							<!-- Model & Basic Settings Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-4">
								<h4 class="mb-4 flex items-center gap-2 text-lg font-semibold">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									Grundeinstellungen
								</h4>

								<div class="form-control">
									<label class="label" for="model">
										<span class="label-text font-medium">AI-Modell</span>
										<span class="label-text-alt">Wählen Sie das gewünschte Sprachmodell</span>
									</label>
									<select
										id="model"
										name="model"
										class="select select-bordered w-full"
										value={(data.settings as any)?.ai?.model || 'anthropic/claude-3.5-sonnet'}
									>
										<option value="anthropic/claude-3.5-sonnet"
											>🏆 Claude 3.5 Sonnet (Empfohlen)</option
										>
										<option value="anthropic/claude-3-haiku"
											>⚡ Claude 3 Haiku (Schnell & Günstig)</option
										>
										<option value="openai/gpt-4o">🧠 GPT-4o (OpenAI)</option>
										<option value="openai/gpt-4o-mini">💡 GPT-4o Mini (Kompakt)</option>
									</select>
								</div>
							</div>

							<!-- Prompt Configuration Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-4">
								<h4 class="mb-4 flex items-center gap-2 text-lg font-semibold">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
									Prompt-Konfiguration
								</h4>

								<div class="space-y-4">
									<div class="form-control">
										<label class="label" for="promptSystem">
											<span class="label-text font-medium">System-Prompt</span>
											<span class="label-text-alt">Grundlegende Verhaltensregeln für die KI</span>
										</label>
										<textarea
											id="promptSystem"
											name="promptSystem"
											class="textarea textarea-bordered h-20 w-full font-mono text-sm"
											placeholder="Du bist ein Experte für das Schreiben von Glückwünschen..."
											value={(data.settings as any)?.ai?.promptSystem ||
												'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.'}
										></textarea>
									</div>

									<div class="form-control">
										<label class="label" for="promptTemplate">
											<span class="label-text font-medium">Haupt-Prompt-Vorlage</span>
											<span class="label-text-alt"
												>Template für die Wunschgenerierung (alle Sprachen)</span
											>
										</label>
										<textarea
											id="promptTemplate"
											name="promptTemplate"
											class="textarea textarea-bordered h-40 w-full font-mono text-sm"
											placeholder="Du bist ein Experte für das Schreiben von Glückwünschen. Generiere &#123;count&#125; &#123;countText&#125; in der Sprache &#123;language&#125;..."
											value={(data.settings as any)?.ai?.promptTemplate || ''}
										></textarea>
										<div class="bg-info/10 mt-2 rounded p-3">
											<p class="mb-3 text-sm font-medium">
												📝 Verfügbare Platzhalter (klicken zum Einfügen):
											</p>
											<div class="space-y-3">
												<div>
													<p class="text-info mb-1 text-xs font-semibold">Grundlagen:</p>
													<div class="grid grid-cols-2 gap-1 text-xs md:grid-cols-4">
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{count}')}
															>{`{count}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{countText}')}
															>{`{countText}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{language}')}
															>{`{language}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{style}')}
															>{`{style}`}</button
														>
													</div>
												</div>
												<div>
													<p class="text-info mb-1 text-xs font-semibold">Ereignis & Kontext:</p>
													<div class="grid grid-cols-2 gap-1 text-xs md:grid-cols-3">
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{eventText}')}
															>{`{eventText}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{eventType}')}
															>{`{eventType}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{relationTexts}')}
															>{`{relationTexts}`}</button
														>
													</div>
												</div>
												<div>
													<p class="text-info mb-1 text-xs font-semibold">Zielgruppe & Extras:</p>
													<div class="grid grid-cols-2 gap-1 text-xs md:grid-cols-3">
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() => insertPlaceholder('promptTemplate', '{ageGroupTexts}')}
															>{`{ageGroupTexts}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() =>
																insertPlaceholder('promptTemplate', '{specificValues}')}
															>{`{specificValues}`}</button
														>
														<button
															type="button"
															class="btn btn-ghost btn-xs hover:bg-primary hover:text-primary-content text-left font-mono"
															onclick={() =>
																insertPlaceholder('promptTemplate', '{additionalInstructions}')}
															>{`{additionalInstructions}`}</button
														>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Advanced Parameters Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-6">
								<div class="mb-6 flex items-center justify-between">
									<h4 class="flex items-center gap-3 text-xl font-bold">
										<div class="badge badge-primary badge-lg">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
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
										</div>
										Erweiterte Parameter
									</h4>
									<div
										class="tooltip tooltip-left"
										data-tip="Optimale Werte für die meisten Anwendungen"
									>
										<button class="btn btn-ghost btn-sm">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</button>
									</div>
								</div>

								<div class="space-y-8">
									<!-- Creativity Controls -->
									<div class="card bg-base-100 shadow-sm">
										<div class="card-body p-6">
											<h5 class="card-title mb-6 flex items-center gap-3 text-xl">
												🎨 Kreativitäts-Kontrolle
											</h5>

											<div class="space-y-8">
												<div class="form-control">
													<div class="mb-4 flex items-center justify-between">
														<label for="temperature" class="label-text text-lg font-semibold"
															>🌡️ Temperature</label
														>
														<div class="badge badge-outline badge-lg">
															{(data.settings as any)?.ai?.temperature || 0.8}
														</div>
													</div>
													<input
														id="temperature"
														name="temperature"
														type="range"
														min="0"
														max="2"
														step="0.1"
														class="range range-primary w-full"
														value={(data.settings as any)?.ai?.temperature || 0.8}
													/>
													<div class="text-base-content/60 mt-3 flex justify-between text-sm">
														<span>Deterministisch</span>
														<span class="font-medium">Empfohlen: 0.7-1.0</span>
														<span>Sehr kreativ</span>
													</div>
													<p class="text-base-content/70 mt-4 text-base leading-relaxed">
														Steuert die Zufälligkeit der Antworten. Niedrige Werte = konsistenter,
														hohe Werte = kreativer.
													</p>
												</div>

												<div class="form-control">
													<div class="mb-4 flex items-center justify-between">
														<label for="topP" class="label-text text-lg font-semibold"
															>🎯 Top P</label
														>
														<div class="badge badge-outline badge-lg">
															{(data.settings as any)?.ai?.topP || 0.9}
														</div>
													</div>
													<input
														id="topP"
														name="topP"
														type="range"
														min="0"
														max="1"
														step="0.1"
														class="range range-secondary w-full"
														value={(data.settings as any)?.ai?.topP || 0.9}
													/>
													<div class="text-base-content/60 mt-3 flex justify-between text-sm">
														<span>Fokussiert</span>
														<span class="font-medium">Empfohlen: 0.8-0.95</span>
														<span>Vielfältig</span>
													</div>
													<p class="text-base-content/70 mt-4 text-base leading-relaxed">
														Nucleus Sampling - begrenzt die Wortauswahl auf die wahrscheinlichsten
														Optionen.
													</p>
												</div>
											</div>
										</div>
									</div>

									<!-- Output Controls -->
									<div class="card bg-base-100 shadow-sm">
										<div class="card-body p-6">
											<h5 class="card-title mb-6 flex items-center gap-3 text-xl">
												⚙️ Ausgabe-Kontrolle
											</h5>

											<div class="space-y-8">
												<div class="form-control">
													<label class="label mb-4" for="maxTokens">
														<span class="label-text text-lg font-semibold">📏 Max Tokens</span>
														<span class="badge badge-ghost badge-lg">
															{(data.settings as any)?.ai?.maxTokens || 2000}
														</span>
													</label>
													<input
														id="maxTokens"
														name="maxTokens"
														type="range"
														min="500"
														max="4000"
														step="100"
														class="range range-accent w-full"
														value={(data.settings as any)?.ai?.maxTokens || 2000}
													/>
													<div class="text-base-content/60 mt-3 flex justify-between text-sm">
														<span>500</span>
														<span class="font-medium">Empfohlen: 1500-2500</span>
														<span>4000</span>
													</div>
													<p class="text-base-content/70 mt-4 text-base leading-relaxed">
														Maximale Länge der generierten Antwort. ~4 Zeichen = 1 Token.
													</p>
												</div>

												<div class="form-control">
													<label class="label mb-4" for="frequencyPenalty">
														<span class="label-text text-lg font-semibold"
															>🔄 Frequency Penalty</span
														>
														<span class="badge badge-ghost badge-lg">
															{(data.settings as any)?.ai?.frequencyPenalty || 0.1}
														</span>
													</label>
													<input
														id="frequencyPenalty"
														name="frequencyPenalty"
														type="range"
														min="-1"
														max="1"
														step="0.1"
														class="range range-warning w-full"
														value={(data.settings as any)?.ai?.frequencyPenalty || 0.1}
													/>
													<div class="text-base-content/60 mt-3 flex justify-between text-sm">
														<span>Wiederholungen</span>
														<span class="font-medium">Empfohlen: 0.0-0.3</span>
														<span>Abwechslung</span>
													</div>
													<p class="text-base-content/70 mt-4 text-base leading-relaxed">
														Bestraft häufige Wiederholungen. Positive Werte fördern Vielfalt.
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Quick Presets -->
								<div class="card bg-base-100 mt-6 shadow-sm">
									<div class="card-body p-4">
										<h5 class="card-title mb-3 text-sm">⚡ Schnell-Einstellungen</h5>
										<div class="flex flex-wrap gap-2">
											<button
												type="button"
												class="btn btn-outline btn-sm"
												onclick={() => setPreset('precise')}
											>
												🎯 Präzise (Temp: 0.3, TopP: 0.7)
											</button>
											<button
												type="button"
												class="btn btn-outline btn-sm"
												onclick={() => setPreset('balanced')}
											>
												⚖️ Ausgewogen (Temp: 0.8, TopP: 0.9)
											</button>
											<button
												type="button"
												class="btn btn-outline btn-sm"
												onclick={() => setPreset('creative')}
											>
												🎨 Kreativ (Temp: 1.2, TopP: 0.95)
											</button>
											<button
												type="button"
												class="btn btn-outline btn-sm"
												onclick={() => setPreset('default')}
											>
												🔄 Reset Defaults
											</button>
										</div>
									</div>
								</div>
							</div>

							<!-- Important Notice -->
							<div class="alert alert-warning">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 shrink-0 stroke-current"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<div>
									<h3 class="font-bold">⚠️ Wichtiger Hinweis</h3>
									<div class="text-sm">
										Änderungen wirken sich sofort auf alle neuen KI-Generierungen aus. Testen Sie
										Ihre Einstellungen zunächst mit wenigen Wünschen.
									</div>
								</div>
							</div>

							<div class="card-actions mt-6 justify-end">
								<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
										KI-Einstellungen speichern
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		{:else if activeTab === 'system'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">System-Einstellungen</h2>
					<form
						method="POST"
						action="?/updateSystem"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
									currentMessage =
										(result.data?.message as string) || 'Einstellungen erfolgreich gespeichert!';
									showSuccessMessage = true;
									showErrorMessage = false;
									setTimeout(() => {
										showSuccessMessage = false;
									}, 3000);
								} else if (result.type === 'failure') {
									currentMessage = (result.data?.message as string) || 'Ein Fehler ist aufgetreten';
									showErrorMessage = true;
									showSuccessMessage = false;
									setTimeout(() => {
										showErrorMessage = false;
									}, 5000);
								}
								isSubmitting = false;
							};
						}}
					>
						<div class="space-y-4">
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">API-Zugriff aktivieren</span>
									<input
										type="checkbox"
										name="apiAccess"
										class="toggle toggle-primary"
										checked={data.settings.system.apiAccess}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label" for="exportFormat">
									<span class="label-text">Standard-Exportformat</span>
								</label>
								<select
									id="exportFormat"
									name="exportFormat"
									class="select-bordered select w-full"
									value={data.settings.system.exportFormat}
								>
									{#each exportFormats as format}
										<option value={format.value}>{format.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="backupFreq">
									<span class="label-text">Backup-Häufigkeit</span>
								</label>
								<select
									id="backupFreq"
									name="backupFrequency"
									class="select-bordered select w-full"
									value={data.settings.system.backupFrequency}
								>
									{#each backupFrequencies as freq}
										<option value={freq.value}>{freq.label}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="dataRetention">
									<span class="label-text">Daten-Aufbewahrung (Tage)</span>
								</label>
								<input
									id="dataRetention"
									name="dataRetention"
									type="number"
									min="30"
									max="3650"
									class="input-bordered input w-full"
									value={data.settings.system.dataRetention}
								/>
							</div>

							<div class="card-actions justify-end">
								<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
										System-Einstellungen speichern
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>

	<!-- Settings Summary -->
	<div class="space-y-6">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Aktuelle Einstellungen</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>Sprache:</span>
						<span class="font-medium">{data.settings.profile.language.toUpperCase()}</span>
					</div>
					<div class="flex justify-between">
						<span>Theme:</span>
						<span class="font-medium capitalize">{data.settings.preferences.theme}</span>
					</div>
					<div class="flex justify-between">
						<span>E-Mail:</span>
						<span class="font-medium"
							>{data.settings.notifications.emailNotifications ? 'An' : 'Aus'}</span
						>
					</div>
					<div class="flex justify-between">
						<span>API:</span>
						<span class="font-medium">{data.settings.system.apiAccess ? 'Aktiv' : 'Inaktiv'}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Aktionen</h3>
				<div class="space-y-2">
					<button class="btn btn-outline btn-sm w-full" onclick={resetSettings}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Zurücksetzen
					</button>
					<button class="btn btn-primary btn-sm w-full" onclick={saveSettings}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
							/>
						</svg>
						Speichern
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Password Change Modal -->
{#if showPasswordModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Passwort ändern</h3>
			<form class="space-y-4">
				<div class="form-control">
					<label class="label" for="currentPassword">
						<span class="label-text">Aktuelles Passwort</span>
					</label>
					<input
						id="currentPassword"
						type="password"
						placeholder="Aktuelles Passwort"
						class="input-bordered input w-full"
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="newPassword">
						<span class="label-text">Neues Passwort</span>
					</label>
					<input
						id="newPassword"
						type="password"
						placeholder="Neues Passwort"
						class="input-bordered input w-full"
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text">Passwort bestätigen</span>
					</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="Passwort bestätigen"
						class="input-bordered input w-full"
						required
					/>
				</div>
			</form>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showPasswordModal = false)}>
					Abbrechen
				</button>
				<button class="btn btn-primary" onclick={() => (showPasswordModal = false)}>
					Passwort ändern
				</button>
			</div>
		</div>
	</div>
{/if}
