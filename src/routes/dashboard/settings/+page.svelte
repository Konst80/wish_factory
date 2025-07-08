<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let activeTab = $state('profile');
	let showSuccessMessage = $state(false);
	let showPasswordModal = $state(false);
	let isSubmitting = $state(false);

	// Show success message when form succeeds
	$effect(() => {
		if (form?.success) {
			showSuccessMessage = true;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
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
			<span>{form?.message || 'Einstellungen erfolgreich gespeichert!'}</span>
		</div>
	</div>
{/if}

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Einstellungen</h1>
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
							return async ({ update, result }) => {
								await update();
								if (result.type === 'success') {
									await invalidateAll();
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
								<button type="button" class="btn btn-outline" onclick={() => (showPasswordModal = true)}>
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
							return async ({ update, result }) => {
								await update();
								if (result.type === 'success') {
									await invalidateAll();
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
							return async ({ update, result }) => {
								await update();
								if (result.type === 'success') {
									await invalidateAll();
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
		{:else if activeTab === 'system'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">System-Einstellungen</h2>
					<form 
						method="POST" 
						action="?/updateSystem"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ update, result }) => {
								await update();
								if (result.type === 'success') {
									await invalidateAll();
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
