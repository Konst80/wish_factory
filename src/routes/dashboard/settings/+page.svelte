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
	let isAgeSpecificPromptsCollapsed = $state(true);
	let isSpecificValuesCollapsed = $state(true);
	let isAdvancedParametersCollapsed = $state(true);
	let isTemplateVariablesCollapsed = $state(true);

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
		{ value: 'winter', label: 'Winter' },
		{ value: 'corporate', label: 'Corporate' },
		{ value: 'cyberpunk', label: 'Cyberpunk' },
		{ value: 'business', label: 'Business' },
		{ value: 'emerald', label: 'Emerald' },
		{ value: 'luxury', label: 'Luxury' },
		{ value: 'dracula', label: 'Dracula' },
		{ value: 'nord', label: 'Nord' },
		{ value: 'sunset', label: 'Sunset' },
		{ value: 'autumn', label: 'Autumn' },
		{ value: 'valentine', label: 'Valentine' },
		{ value: 'aqua', label: 'Aqua' }
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

	// Generate specific values using AI
	async function generateSpecificValues(eventType: string, language: string) {
		try {
			console.log(`🤖 Generating specific values for ${eventType} (${language})`);

			const response = await fetch('/api/ai/suggest-values', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					eventType,
					language
				})
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const result = await response.json();

			if (result.success && result.description) {
				// Get the appropriate form field
				const fieldName = `specificValues${eventType.charAt(0).toUpperCase() + eventType.slice(1)}${language.charAt(0).toUpperCase() + language.slice(1)}`;
				const field = document.querySelector(
					`textarea[name="${fieldName}"]`
				) as HTMLTextAreaElement;

				if (field) {
					field.value = result.description;
					console.log(`✅ Generated description for ${eventType} (${language})`);
				} else {
					console.error('❌ Could not find form field:', fieldName);
				}
			} else {
				console.error('❌ No description in response:', result);
			}
		} catch (error) {
			console.error('❌ Error generating specific values:', error);

			// Show error message to user
			currentMessage = 'Fehler beim Generieren der KI-Vorschläge. Versuchen Sie es später erneut.';
			showErrorMessage = true;
			showSuccessMessage = false;
			setTimeout(() => {
				showErrorMessage = false;
			}, 5000);
		}
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
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex-1">
			<h1 class="text-base-content mb-2 flex items-center gap-3 text-3xl font-bold">
				<div class="bg-primary/10 rounded-lg p-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				Einstellungen
			</h1>
			<p class="text-base-content/70 text-lg">
				Verwalten Sie Ihre Konto-Einstellungen und Präferenzen
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-outline btn-sm gap-2" onclick={exportSettings}>
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
			<button class="btn btn-primary btn-sm gap-2" onclick={saveSettings}>
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
<div class="bg-base-100 border-base-200 mb-6 rounded-lg border p-2 shadow-sm">
	<div class="flex flex-wrap gap-1">
		{#each tabs as tab}
			<button
				class="btn btn-sm gap-2 {activeTab === tab.id
					? 'btn-primary'
					: 'btn-ghost'} transition-all duration-200"
				onclick={() => (activeTab = tab.id)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
				</svg>
				<span class="hidden sm:inline">{tab.label}</span>
			</button>
		{/each}
	</div>
</div>

<!-- Settings Content -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main Settings Panel -->
	<div class="lg:col-span-2">
		{#if activeTab === 'profile'}
			<div class="card bg-base-100 border-base-200 border shadow-xl">
				<div class="card-body">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="card-title flex items-center gap-3 text-xl">
							<div class="bg-primary/10 rounded-lg p-2">
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
							</div>
							Profil-Einstellungen
						</h2>
						<div class="badge badge-outline badge-lg">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Persönlich
						</div>
					</div>

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
						<div class="space-y-6">
							<!-- Personal Information Section -->
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
											d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Persönliche Informationen
								</h3>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="fullName">
											<span class="label-text flex items-center gap-2 font-medium">
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
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
												Vollständiger Name
											</span>
										</label>
										<input
											id="fullName"
											name="fullName"
											type="text"
											placeholder="Ihr vollständiger Name"
											class="input-bordered input input-lg w-full"
											value={data.settings.profile.fullName}
											required
										/>
									</div>

									<div class="form-control">
										<label class="label" for="email">
											<span class="label-text flex items-center gap-2 font-medium">
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
														d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
													/>
												</svg>
												E-Mail-Adresse
											</span>
										</label>
										<input
											id="email"
											type="email"
											placeholder="ihre@email.com"
											class="input-bordered input input-lg w-full"
											value={data.settings.profile.email}
											disabled
										/>
										<label class="label">
											<span class="label-text-alt text-warning flex items-center gap-1">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-3 w-3"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
													/>
												</svg>
												E-Mail kann nicht geändert werden
											</span>
										</label>
									</div>
								</div>
							</div>

							<!-- Preferences Section -->
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
											d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
										/>
									</svg>
									Sprache & Region
								</h3>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="language">
											<span class="label-text flex items-center gap-2 font-medium">
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
														d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
													/>
												</svg>
												Sprache
											</span>
										</label>
										<select
											id="language"
											name="language"
											class="select-bordered select select-lg w-full"
											value={data.settings.profile.language}
										>
											{#each languages as lang}
												<option value={lang.value}>{lang.label}</option>
											{/each}
										</select>
									</div>

									<div class="form-control">
										<label class="label" for="timezone">
											<span class="label-text flex items-center gap-2 font-medium">
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
														d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												Zeitzone
											</span>
										</label>
										<select
											id="timezone"
											name="timezone"
											class="select-bordered select select-lg w-full"
											value={data.settings.profile.timezone}
										>
											{#each timezones as tz}
												<option value={tz.value}>{tz.label}</option>
											{/each}
										</select>
									</div>
								</div>
							</div>

							<!-- Security Section -->
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
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/>
									</svg>
									Sicherheit
								</h3>

								<div class="form-control">
									<label class="label">
										<span class="label-text flex items-center gap-2 font-medium">
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
													d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
												/>
											</svg>
											Passwort
										</span>
									</label>
									<button
										type="button"
										class="btn btn-outline btn-lg gap-2"
										onclick={() => (showPasswordModal = true)}
									>
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
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Passwort ändern
									</button>
								</div>
							</div>

							<div
								class="border-base-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="text-base-content/70 flex items-center gap-2 text-sm">
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
									<span>Änderungen werden sofort übernommen</span>
								</div>
								<button type="submit" class="btn btn-primary btn-lg gap-2" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
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
										Profil speichern
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		{:else if activeTab === 'notifications'}
			<div class="card bg-base-100 border-base-200 border shadow-xl">
				<div class="card-body">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="card-title flex items-center gap-3 text-xl">
							<div class="bg-secondary/10 rounded-lg p-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-secondary h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									/>
								</svg>
							</div>
							Benachrichtigungen
						</h2>
						<div class="badge badge-outline badge-lg">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
								/>
							</svg>
							Mitteilungen
						</div>
					</div>

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
						<div class="space-y-6">
							<!-- Communication Settings -->
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
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									Kommunikation
								</h3>

								<div class="space-y-4">
									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
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
														d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">E-Mail-Benachrichtigungen</span>
													<p class="text-base-content/70 text-sm">
														Erhalten Sie wichtige Updates per E-Mail
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="emailNotifications"
												class="toggle toggle-primary"
												checked={data.settings.notifications.emailNotifications}
											/>
										</label>
									</div>

									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-secondary h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">Push-Benachrichtigungen</span>
													<p class="text-base-content/70 text-sm">
														Sofortige Benachrichtigungen auf Ihrem Gerät
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="pushNotifications"
												class="toggle toggle-secondary"
												checked={data.settings.notifications.pushNotifications}
											/>
										</label>
									</div>
								</div>
							</div>

							<!-- Content Updates -->
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
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
									Wunsch-Updates
								</h3>

								<div class="space-y-4">
									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-accent h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 6v6m0 0v6m0-6h6m-6 0H6"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">Neue Wunsch-Benachrichtigungen</span>
													<p class="text-base-content/70 text-sm">
														Benachrichtigung bei neuen Wünschen im System
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="newWishAlerts"
												class="toggle toggle-accent"
												checked={data.settings.notifications.newWishAlerts}
											/>
										</label>
									</div>

									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-warning h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">Freigabe-Anfragen</span>
													<p class="text-base-content/70 text-sm">
														Benachrichtigung bei Freigabe-Anfragen
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="approvalRequests"
												class="toggle toggle-warning"
												checked={data.settings.notifications.approvalRequests}
											/>
										</label>
									</div>
								</div>
							</div>

							<!-- System Updates -->
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
											d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
										/>
									</svg>
									System & Berichte
								</h3>

								<div class="space-y-4">
									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-info h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">System-Updates</span>
													<p class="text-base-content/70 text-sm">
														Wichtige System-Updates und Wartungsarbeiten
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="systemUpdates"
												class="toggle toggle-info"
												checked={data.settings.notifications.systemUpdates}
											/>
										</label>
									</div>

									<div class="form-control">
										<label
											class="label bg-base-100 hover:bg-base-200 cursor-pointer rounded-lg p-3 transition-colors"
										>
											<div class="flex items-center gap-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-success h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
													/>
												</svg>
												<div>
													<span class="label-text font-medium">Wöchentlicher Bericht</span>
													<p class="text-base-content/70 text-sm">
														Wöchentliche Zusammenfassung Ihrer Aktivitäten
													</p>
												</div>
											</div>
											<input
												type="checkbox"
												name="weeklyReport"
												class="toggle toggle-success"
												checked={data.settings.notifications.weeklyReport}
											/>
										</label>
									</div>
								</div>
							</div>

							<div
								class="border-base-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="text-base-content/70 flex items-center gap-2 text-sm">
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
									<span>Benachrichtigungen können jederzeit geändert werden</span>
								</div>
								<button type="submit" class="btn btn-primary btn-lg gap-2" disabled={isSubmitting}>
									{#if isSubmitting}
										<span class="loading loading-spinner loading-sm"></span>
										Speichern...
									{:else}
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
							return async ({ result }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									await invalidateAll();
									currentMessage = 'KI-Einstellungen erfolgreich gespeichert!';
									showSuccessMessage = true;
									showErrorMessage = false;
									setTimeout(() => {
										showSuccessMessage = false;
									}, 3000);
								} else if (result.type === 'failure') {
									currentMessage =
										(result.data?.message as string) ||
										'Fehler beim Speichern der KI-Einstellungen';
									showErrorMessage = true;
									showSuccessMessage = false;
									setTimeout(() => {
										showErrorMessage = false;
									}, 5000);
								}
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
										value={(data.settings as any)?.ai?.model || 'anthropic/claude-sonnet-4'}
									>
										<option value="anthropic/claude-sonnet-4"
											>🚀 Claude Sonnet 4 (Neueste Version)</option
										>
										<option value="anthropic/claude-3.5-sonnet"
											>🏆 Claude 3.5 Sonnet (Bewährt)</option
										>
										<option value="anthropic/claude-3-haiku"
											>⚡ Claude 3 Haiku (Schnell & Günstig)</option
										>
										<option value="openai/gpt-4.1">⭐ GPT-4.1 (Premium, Code-optimiert)</option>
										<option value="openai/gpt-4o">🧠 GPT-4o (OpenAI)</option>
										<option value="openai/gpt-4o-mini">💡 GPT-4o Mini (Kompakt)</option>
										<option value="google/gemini-pro-1.5">💎 Gemini Pro 1.5 (Google)</option>
										<option value="google/gemini-2.5-pro">✨ Gemini 2.5 Pro (Google)</option>
										<option value="deepseek/deepseek-chat-v3-0324:free"
											>🆓 DeepSeek V3 (Kostenlos)</option
										>
										<option value="deepseek/deepseek-chat">🔥 DeepSeek Chat</option>
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
											class="textarea textarea-bordered h-32 w-full font-mono text-sm"
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
											class="textarea textarea-bordered h-96 w-full font-mono text-sm"
											placeholder="Du bist ein Experte für das Schreiben von Glückwünschen. Generiere &#123;count&#125; &#123;countText&#125; in der Sprache &#123;language&#125;..."
											value={(data.settings as any)?.ai?.promptTemplate || ''}
										></textarea>
										<div
											class="from-info/5 to-primary/5 border-info/20 mt-4 rounded-lg border bg-gradient-to-br p-4"
										>
											<div class="mb-4 flex items-center justify-between">
												<button
													type="button"
													class="hover:text-primary flex cursor-pointer items-center gap-2 text-base font-semibold transition-colors"
													onclick={() =>
														(isTemplateVariablesCollapsed = !isTemplateVariablesCollapsed)}
												>
													<div class="badge badge-info badge-lg">
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
																d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
															/>
														</svg>
													</div>
													Verfügbare Template-Variablen
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4 transition-transform {isTemplateVariablesCollapsed
															? 'rotate-0'
															: 'rotate-180'}"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 9l-7 7-7-7"
														/>
													</svg>
												</button>
											</div>
											{#if !isTemplateVariablesCollapsed}
												<div class="transition-all duration-300">
													<p class="text-base-content/70 mb-4 text-sm">
														Klicken Sie auf eine Variable, um sie an der Cursor-Position einzufügen.
													</p>

													<div class="space-y-6">
														<!-- Grundlagen -->
														<div class="card bg-base-100/50 shadow-sm">
															<div class="card-body p-4">
																<h5 class="card-title mb-3 flex items-center gap-2 text-sm">
																	<span class="badge badge-outline badge-sm">📊</span>
																	Grundlagen
																</h5>
																<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Anzahl der zu generierenden Wünsche (z.B. 1, 3, 5)"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-primary hover:text-primary-content w-full justify-start font-mono"
																			onclick={() => insertPlaceholder('promptTemplate', '{count}')}
																		>
																			<code class="text-primary font-bold">{`{count}`}</code>
																			<span class="ml-2 text-xs opacity-70">Anzahl</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Textform der Anzahl (z.B. 'Glückwunsch', 'Glückwünsche')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-primary hover:text-primary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{countText}')}
																		>
																			<code class="text-primary font-bold">{`{countText}`}</code>
																			<span class="ml-2 text-xs opacity-70">Anzahl-Text</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Zielsprache (z.B. 'de', 'en')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-primary hover:text-primary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{language}')}
																		>
																			<code class="text-primary font-bold">{`{language}`}</code>
																			<span class="ml-2 text-xs opacity-70">Sprache</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Gewünschter Stil (z.B. 'normal', 'herzlich', 'humorvoll')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-primary hover:text-primary-content w-full justify-start font-mono"
																			onclick={() => insertPlaceholder('promptTemplate', '{style}')}
																		>
																			<code class="text-primary font-bold">{`{style}`}</code>
																			<span class="ml-2 text-xs opacity-70">Stil</span>
																		</button>
																	</div>
																</div>
															</div>
														</div>

														<!-- Ereignis & Kontext -->
														<div class="card bg-base-100/50 shadow-sm">
															<div class="card-body p-4">
																<h5 class="card-title mb-3 flex items-center gap-2 text-sm">
																	<span class="badge badge-outline badge-sm">🎉</span>
																	Ereignis & Kontext
																</h5>
																<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Übersetzter Anlass (z.B. 'Geburtstag', 'Jubiläum')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-secondary hover:text-secondary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{eventText}')}
																		>
																			<code class="text-secondary font-bold">{`{eventText}`}</code>
																			<span class="ml-2 text-xs opacity-70">Anlass (DE)</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Roher Event-Typ (z.B. 'birthday', 'anniversary')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-secondary hover:text-secondary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{eventType}')}
																		>
																			<code class="text-secondary font-bold">{`{eventType}`}</code>
																			<span class="ml-2 text-xs opacity-70">Event-Typ</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Übersetzte Beziehungen (z.B. 'Freund/in, Familie')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-secondary hover:text-secondary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{relationTexts}')}
																		>
																			<code class="text-secondary font-bold"
																				>{`{relationTexts}`}</code
																			>
																			<span class="ml-2 text-xs opacity-70">Beziehungen</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Rohe Beziehungen (z.B. 'friend, family')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-secondary hover:text-secondary-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{relations}')}
																		>
																			<code class="text-secondary font-bold">{`{relations}`}</code>
																			<span class="ml-2 text-xs opacity-70">Relations</span>
																		</button>
																	</div>
																</div>
															</div>
														</div>

														<!-- Zielgruppe & Extras -->
														<div class="card bg-base-100/50 shadow-sm">
															<div class="card-body p-4">
																<h5 class="card-title mb-3 flex items-center gap-2 text-sm">
																	<span class="badge badge-outline badge-sm">👥</span>
																	Zielgruppe & Extras
																</h5>
																<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Übersetzte Altersgruppen (z.B. 'junge Menschen, Senioren')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-accent hover:text-accent-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{ageGroupTexts}')}
																		>
																			<code class="text-accent font-bold">{`{ageGroupTexts}`}</code>
																			<span class="ml-2 text-xs opacity-70">Altersgruppen</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Rohe Altersgruppen (z.B. 'young, senior')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-accent hover:text-accent-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{ageGroups}')}
																		>
																			<code class="text-accent font-bold">{`{ageGroups}`}</code>
																			<span class="ml-2 text-xs opacity-70">Age Groups</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Spezifische Werte (z.B. '18, 30, 50')"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-accent hover:text-accent-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder('promptTemplate', '{specificValues}')}
																		>
																			<code class="text-accent font-bold">{`{specificValues}`}</code
																			>
																			<span class="ml-2 text-xs opacity-70">Spez. Werte</span>
																		</button>
																	</div>
																	<div
																		class="tooltip tooltip-bottom"
																		data-tip="Zusätzliche Benutzer-Anweisungen"
																	>
																		<button
																			type="button"
																			class="btn btn-ghost btn-sm hover:bg-accent hover:text-accent-content w-full justify-start font-mono"
																			onclick={() =>
																				insertPlaceholder(
																					'promptTemplate',
																					'{additionalInstructions}'
																				)}
																		>
																			<code class="text-accent font-bold"
																				>{`{additionalInstructions}`}</code
																			>
																			<span class="ml-2 text-xs opacity-70">Zusatz-Info</span>
																		</button>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- Age-Specific Prompts Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-6">
								<div class="mb-6 flex items-center justify-between">
									<button
										type="button"
										class="hover:text-primary flex cursor-pointer items-center gap-3 text-xl font-bold transition-colors"
										onclick={() => (isAgeSpecificPromptsCollapsed = !isAgeSpecificPromptsCollapsed)}
									>
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
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										</div>
										Altersgruppen-spezifische Prompts
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 transition-transform {isAgeSpecificPromptsCollapsed
												? 'rotate-0'
												: 'rotate-180'}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
									<div class="badge badge-info badge-sm">Optional</div>
								</div>

								{#if !isAgeSpecificPromptsCollapsed}
									<div class="space-y-6 transition-all duration-300">
										<div class="alert alert-info">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												class="h-6 w-6 shrink-0 stroke-current"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<div>
												<p>
													<strong>Zusätzliche Anweisungen für spezifische Altersgruppen:</strong>
													Diese Prompts werden zusätzlich zum Hauptprompt verwendet, wenn eine bestimmte
													Altersgruppe ausgewählt wird. Bei "Alle" werden alle drei Prompts kombiniert.
												</p>
											</div>
										</div>

										<div class="form-control">
											<label class="label" for="promptAgeYoung">
												<span class="label-text font-medium">👦 Prompt für junge Menschen</span>
												<span class="label-text-alt"
													>Zusätzliche Anweisungen für junge Zielgruppe</span
												>
											</label>
											<textarea
												id="promptAgeYoung"
												name="promptAgeYoung"
												class="textarea textarea-bordered h-20 w-full font-mono text-sm"
												placeholder="z.B. Verwende modernen, lockeren Ton. Nutze aktuelle Trends und Ausdrücke..."
												value={(data.settings as any)?.ai?.promptAgeYoung || ''}
											></textarea>
										</div>

										<div class="form-control">
											<label class="label" for="promptAgeMiddle">
												<span class="label-text font-medium">👨 Prompt für mittleres Alter</span>
												<span class="label-text-alt"
													>Zusätzliche Anweisungen für mittlere Altersgruppe</span
												>
											</label>
											<textarea
												id="promptAgeMiddle"
												name="promptAgeMiddle"
												class="textarea textarea-bordered h-20 w-full font-mono text-sm"
												placeholder="z.B. Verwende ausgewogenen, respektvollen Ton. Berücksichtige Lebenserfahrung..."
												value={(data.settings as any)?.ai?.promptAgeMiddle || ''}
											></textarea>
										</div>

										<div class="form-control">
											<label class="label" for="promptAgeSenior">
												<span class="label-text font-medium">👴 Prompt für ältere Menschen</span>
												<span class="label-text-alt"
													>Zusätzliche Anweisungen für ältere Zielgruppe</span
												>
											</label>
											<textarea
												id="promptAgeSenior"
												name="promptAgeSenior"
												class="textarea textarea-bordered h-20 w-full font-mono text-sm"
												placeholder="z.B. Verwende ehrfürchtigen, würdevollen Ton. Betone Weisheit und Erfahrung..."
												value={(data.settings as any)?.ai?.promptAgeSenior || ''}
											></textarea>
										</div>

										<!-- Relation-specific Prompts -->
										<div class="mt-6 space-y-4">
											<h4 class="text-lg font-semibold text-base-content">
												🤝 Beziehungsspezifische Prompts
											</h4>
											<p class="text-sm text-base-content/70">
												Definiere spezifische Prompts für verschiedene Beziehungsarten
											</p>

											<div class="form-control">
												<label class="label" for="promptRelationFriend">
													<span class="label-text font-medium">👥 Prompt für Freunde</span>
													<span class="label-text-alt">Zusätzliche Anweisungen für Freundschaften</span>
												</label>
												<textarea
													id="promptRelationFriend"
													name="promptRelationFriend"
													class="textarea textarea-bordered h-20 w-full font-mono text-sm"
													placeholder="z.B. Verwende freundlichen, vertrauten Ton. Nutze persönliche Ansprache..."
													value={(data.settings as any)?.ai?.promptRelationFriend || ''}
												></textarea>
											</div>

											<div class="form-control">
												<label class="label" for="promptRelationFamily">
													<span class="label-text font-medium">👪 Prompt für Familie</span>
													<span class="label-text-alt">Zusätzliche Anweisungen für Familienmitglieder</span>
												</label>
												<textarea
													id="promptRelationFamily"
													name="promptRelationFamily"
													class="textarea textarea-bordered h-20 w-full font-mono text-sm"
													placeholder="z.B. Verwende herzlichen, familiären Ton. Betone Verbundenheit..."
													value={(data.settings as any)?.ai?.promptRelationFamily || ''}
												></textarea>
											</div>

											<div class="form-control">
												<label class="label" for="promptRelationPartner">
													<span class="label-text font-medium">💕 Prompt für Partner</span>
													<span class="label-text-alt">Zusätzliche Anweisungen für romantische Partner</span>
												</label>
												<textarea
													id="promptRelationPartner"
													name="promptRelationPartner"
													class="textarea textarea-bordered h-20 w-full font-mono text-sm"
													placeholder="z.B. Verwende liebevollen, romantischen Ton. Nutze intime Sprache..."
													value={(data.settings as any)?.ai?.promptRelationPartner || ''}
												></textarea>
											</div>

											<div class="form-control">
												<label class="label" for="promptRelationColleague">
													<span class="label-text font-medium">💼 Prompt für Kollegen</span>
													<span class="label-text-alt">Zusätzliche Anweisungen für Arbeitskolleg*innen</span>
												</label>
												<textarea
													id="promptRelationColleague"
													name="promptRelationColleague"
													class="textarea textarea-bordered h-20 w-full font-mono text-sm"
													placeholder="z.B. Verwende professionellen, respektvollen Ton. Achte auf Förmlichkeit..."
													value={(data.settings as any)?.ai?.promptRelationColleague || ''}
												></textarea>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- Specific Values Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-6">
								<div class="mb-6 flex items-center justify-between">
									<button
										type="button"
										class="hover:text-primary flex cursor-pointer items-center gap-3 text-xl font-bold transition-colors"
										onclick={() => (isSpecificValuesCollapsed = !isSpecificValuesCollapsed)}
									>
										<div class="badge badge-accent badge-lg">
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
													d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
												/>
											</svg>
										</div>
										Spezifische Event-Werte
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 transition-transform {isSpecificValuesCollapsed
												? 'rotate-0'
												: 'rotate-180'}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
									<div class="badge badge-info badge-sm">Optional</div>
								</div>

								{#if !isSpecificValuesCollapsed}
									<div class="space-y-6 transition-all duration-300">
										<div class="alert alert-info">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												class="h-6 w-6 shrink-0 stroke-current"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<div>
												<p>
													<strong>Spezifische Event-Werte:</strong>
													Definieren Sie bedeutsame Zahlen für verschiedene Anlässe und Sprachen. Diese
													werden für die KI-Prompt-Generierung verwendet.
												</p>
											</div>
										</div>

										<div class="tabs tabs-lifted">
											<input
												type="radio"
												name="values_tab"
												class="tab"
												aria-label="Deutsch"
												checked
											/>
											<div class="tab-content bg-base-100 border-base-300 rounded-box p-6">
												<div class="space-y-6">
													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																🎂 Geburtstage (Deutsch)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('birthday', 'de')}
															>
																🤖 KI-Vorschlag
															</button>
														</label>
														<textarea
															name="specificValuesBirthdayDe"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Beschreiben Sie wichtige Geburtstage und ihre Bedeutung, z.B.: 16 Jahre (Sweet Sixteen), 18 Jahre (Volljährigkeit), 21 Jahre (Erwachsenwerden), 30 Jahre (Lebensmitte), 50 Jahre (Goldenes Jubiläum)..."
														>{data.settings.specificValues.birthdayDe || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>Beschreibung wichtiger Geburtstage mit Bedeutung</span
															>
															<span class="label-text-alt text-info"
																>Diese Beschreibung wird zur KI-Prompt-Erstellung verwendet</span
															>
														</label>
													</div>

													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																💒 Hochzeitsjubiläen (Deutsch)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('anniversary', 'de')}
															>
																🤖 KI-Vorschlag
															</button>
														</label>
														<textarea
															name="specificValuesAnniversaryDe"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Beschreiben Sie wichtige Hochzeitstage und ihre Bedeutung, z.B.: 1 Jahr (Papierhochzeit), 5 Jahre (Holzhochzeit), 10 Jahre (Rosenhochzeit), 25 Jahre (Silberhochzeit), 50 Jahre (Goldene Hochzeit)..."
														>{data.settings.specificValues.anniversaryDe || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>Beschreibung wichtiger Hochzeitstage mit Bedeutung</span
															>
															<span class="label-text-alt text-info"
																>Diese Beschreibung wird zur KI-Prompt-Erstellung verwendet</span
															>
														</label>
													</div>

													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																🎉 Individuelle Anlässe (Deutsch)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('custom', 'de')}
															>
																🤖 KI-Vorschlag
															</button>
														</label>
														<textarea
															name="specificValuesCustomDe"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Beschreiben Sie wichtige Meilensteine und ihre Bedeutung, z.B.: 5 Jahre (Lustrum), 10 Jahre (Dekade), 25 Jahre (Vierteljahrhundert), 50 Jahre (Halbes Jahrhundert)..."
														>{data.settings.specificValues.customDe || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>Beschreibung wichtiger Meilensteine mit Bedeutung</span
															>
															<span class="label-text-alt text-info"
																>Diese Beschreibung wird zur KI-Prompt-Erstellung verwendet</span
															>
														</label>
													</div>
												</div>
											</div>

											<input type="radio" name="values_tab" class="tab" aria-label="English" />
											<div class="tab-content bg-base-100 border-base-300 rounded-box p-6">
												<div class="space-y-6">
													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																🎂 Birthdays (English)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('birthday', 'en')}
															>
																🤖 AI Suggestion
															</button>
														</label>
														<textarea
															name="specificValuesBirthdayEn"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Describe important birthdays and their meanings, e.g.: 16 years (Sweet Sixteen), 18 years (Coming of age), 21 years (Legal adulthood), 30 years (Milestone birthday), 50 years (Golden birthday)..."
														>{data.settings.specificValues.birthdayEn || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>Significant birthdays (comma-separated)</span
															>
															<span class="label-text-alt text-info"
																>e.g. 16=Sweet Sixteen, 21=Coming of Age</span
															>
														</label>
													</div>

													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																💒 Wedding Anniversaries (English)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('anniversary', 'en')}
															>
																🤖 AI Suggestion
															</button>
														</label>
														<textarea
															name="specificValuesAnniversaryEn"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Describe important wedding anniversaries and their meanings, e.g.: 1 year (Paper), 5 years (Wood), 10 years (Tin), 25 years (Silver), 50 years (Golden)..."
														>{data.settings.specificValues.anniversaryEn || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>Wedding anniversaries (comma-separated)</span
															>
															<span class="label-text-alt text-info"
																>e.g. 1=Paper, 10=Tin, 25=Silver, 50=Golden</span
															>
														</label>
													</div>

													<div class="form-control">
														<label class="label">
															<span class="label-text flex items-center gap-2 font-semibold">
																🎉 Custom Events (English)
															</span>
															<button
																type="button"
																class="btn btn-ghost btn-xs"
																onclick={() => generateSpecificValues('custom', 'en')}
															>
																🤖 AI Suggestion
															</button>
														</label>
														<textarea
															name="specificValuesCustomEn"
															class="textarea textarea-bordered w-full"
															rows="4"
															placeholder="Describe important milestones and their meanings, e.g.: 5 years (Lustrum), 10 years (Decade), 25 years (Quarter century), 50 years (Half century)..."
														>{data.settings.specificValues.customEn || ''}</textarea>
														<label class="label">
															<span class="label-text-alt"
																>General milestones (comma-separated)</span
															>
															<span class="label-text-alt text-info"
																>e.g. 5=Lustrum, 10=Decade, 25=Quarter Century</span
															>
														</label>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- Advanced Parameters Section -->
							<div class="bg-base-200 mb-6 rounded-lg p-6">
								<div class="mb-6 flex items-center justify-between">
									<button
										type="button"
										class="hover:text-primary flex cursor-pointer items-center gap-3 text-xl font-bold transition-colors"
										onclick={() => (isAdvancedParametersCollapsed = !isAdvancedParametersCollapsed)}
									>
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
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 transition-transform {isAdvancedParametersCollapsed
												? 'rotate-0'
												: 'rotate-180'}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
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

								{#if !isAdvancedParametersCollapsed}
									<div class="space-y-8 transition-all duration-300">
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
								{/if}
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
		<div class="card bg-base-100 border-base-200 border shadow-xl">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-lg">
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					Aktuelle Einstellungen
				</h3>
				<div class="space-y-3 text-sm">
					<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-primary h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
							<span>Sprache</span>
						</div>
						<div class="badge badge-primary badge-sm">
							{data.settings.profile.language.toUpperCase()}
						</div>
					</div>
					<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-secondary h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z"
								/>
							</svg>
							<span>Theme</span>
						</div>
						<div class="badge badge-secondary badge-sm capitalize">
							{data.settings.preferences.theme}
						</div>
					</div>
					<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-accent h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
								/>
							</svg>
							<span>E-Mail</span>
						</div>
						<div
							class="badge badge-sm {data.settings.notifications.emailNotifications
								? 'badge-success'
								: 'badge-error'}"
						>
							{data.settings.notifications.emailNotifications ? 'An' : 'Aus'}
						</div>
					</div>
					<div class="bg-base-50 flex items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="text-info h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span>API</span>
						</div>
						<div
							class="badge badge-sm {data.settings.system.apiAccess
								? 'badge-success'
								: 'badge-error'}"
						>
							{data.settings.system.apiAccess ? 'Aktiv' : 'Inaktiv'}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 border-base-200 border shadow-xl">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-lg">
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
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Schnelle Aktionen
				</h3>
				<div class="space-y-3">
					<button class="btn btn-outline btn-sm w-full gap-2" onclick={resetSettings}>
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
					<button class="btn btn-primary btn-sm w-full gap-2" onclick={saveSettings}>
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

		<!-- Quick Settings Info -->
		<div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-r">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-base">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary h-4 w-4"
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
					Tipp
				</h3>
				<p class="text-base-content/70 text-sm">
					Änderungen werden automatisch gespeichert. Verwenden Sie die Exportfunktion, um Ihre
					Einstellungen zu sichern.
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Password Change Modal -->
{#if showPasswordModal}
	<div class="modal-open modal">
		<div class="modal-box max-w-md">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="flex items-center gap-3 text-xl font-bold">
					<div class="bg-primary/10 rounded-lg p-2">
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
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>
					Passwort ändern
				</h3>
				<button class="btn btn-sm btn-circle btn-ghost" onclick={() => (showPasswordModal = false)}>
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form class="space-y-6">
				<div class="form-control">
					<label class="label" for="currentPassword">
						<span class="label-text flex items-center gap-2 font-medium">
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
									d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
								/>
							</svg>
							Aktuelles Passwort
						</span>
					</label>
					<input
						id="currentPassword"
						type="password"
						placeholder="Geben Sie Ihr aktuelles Passwort ein"
						class="input-bordered input input-lg w-full"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="newPassword">
						<span class="label-text flex items-center gap-2 font-medium">
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
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
							Neues Passwort
						</span>
					</label>
					<input
						id="newPassword"
						type="password"
						placeholder="Mindestens 8 Zeichen"
						class="input-bordered input input-lg w-full"
						required
					/>
					<label class="label">
						<span class="label-text-alt text-xs">
							Mindestens 8 Zeichen, enthält Groß- und Kleinbuchstaben, Zahlen
						</span>
					</label>
				</div>

				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text flex items-center gap-2 font-medium">
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
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Passwort bestätigen
						</span>
					</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="Neues Passwort wiederholen"
						class="input-bordered input input-lg w-full"
						required
					/>
				</div>
			</form>

			<div class="modal-action border-base-300 border-t pt-6">
				<button class="btn btn-ghost btn-lg gap-2" onclick={() => (showPasswordModal = false)}>
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					Abbrechen
				</button>
				<button class="btn btn-primary btn-lg gap-2" onclick={() => (showPasswordModal = false)}>
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
					Passwort ändern
				</button>
			</div>
		</div>
	</div>
{/if}
