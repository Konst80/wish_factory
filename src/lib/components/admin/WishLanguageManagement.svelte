<script lang="ts">
	import { onMount } from 'svelte';
	import {
		allWishLanguages,
		wishLanguagesLoading,
		wishLanguagesError,
		loadAllWishLanguages,
		createWishLanguage,
		updateWishLanguage,
		deleteWishLanguage,
		validateLanguageCode,
		formatLanguageDisplay,
		type WishLanguage
	} from '$lib/stores/wishLanguages';

	// Form state
	let showAddForm = false;
	let editingLanguage: WishLanguage | null = null;
	let formData = {
		code: '',
		name: '',
		flag: ''
	};
	let formError = '';

	// Predefined flag options
	const flagOptions = [
		{ value: '🇩🇪', label: '🇩🇪 Deutsch' },
		{ value: '🇺🇸', label: '🇺🇸 English (US)' },
		{ value: '🇬🇧', label: '🇬🇧 English (UK)' },
		{ value: '🇫🇷', label: '🇫🇷 Français' },
		{ value: '🇪🇸', label: '🇪🇸 Español' },
		{ value: '🇮🇹', label: '🇮🇹 Italiano' },
		{ value: '🇳🇱', label: '🇳🇱 Nederlands' },
		{ value: '🇵🇹', label: '🇵🇹 Português' },
		{ value: '🇷🇺', label: '🇷🇺 Русский' },
		{ value: '🇯🇵', label: '🇯🇵 日本語' },
		{ value: '🇰🇷', label: '🇰🇷 한국어' },
		{ value: '🇨🇳', label: '🇨🇳 中文' },
		{ value: '🇦🇹', label: '🇦🇹 Österreich' },
		{ value: '🇨🇭', label: '🇨🇭 Schweiz' },
		{ value: '🇧🇪', label: '🇧🇪 België' },
		{ value: '🇨🇦', label: '🇨🇦 Canada' },
		{ value: '🇦🇺', label: '🇦🇺 Australia' },
		{ value: '🇮🇳', label: '🇮🇳 India' },
		{ value: '🇧🇷', label: '🇧🇷 Brasil' },
		{ value: '🇲🇽', label: '🇲🇽 México' }
	];

	// Confirmation dialog
	let showDeleteConfirm = false;
	let languageToDelete: WishLanguage | null = null;

	onMount(() => {
		loadAllWishLanguages();
	});

	function resetForm() {
		formData = { code: '', name: '', flag: '' };
		formError = '';
		showAddForm = false;
		editingLanguage = null;
	}

	function startAdd() {
		resetForm();
		showAddForm = true;
	}

	function startEdit(language: WishLanguage) {
		editingLanguage = language;
		formData = {
			code: language.code,
			name: language.name,
			flag: language.flag
		};
		formError = '';
		showAddForm = true;
	}

	async function handleSubmit() {
		formError = '';

		// Validation
		if (!formData.code || !formData.name || !formData.flag) {
			formError = 'Alle Felder sind erforderlich';
			return;
		}

		if (!validateLanguageCode(formData.code)) {
			formError = 'Sprach-Code muss genau 2 Kleinbuchstaben enthalten';
			return;
		}

		if (formData.name.length < 2 || formData.name.length > 50) {
			formError = 'Name muss zwischen 2 und 50 Zeichen lang sein';
			return;
		}

		if (formData.flag.length > 10) {
			formError = 'Flag darf maximal 10 Zeichen lang sein';
			return;
		}

		try {
			if (editingLanguage) {
				// Update existing language
				await updateWishLanguage(editingLanguage.id, {
					name: formData.name,
					flag: formData.flag
				});
			} else {
				// Create new language
				await createWishLanguage(formData);
			}
			resetForm();
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unbekannter Fehler';
		}
	}

	async function toggleLanguageActive(language: WishLanguage) {
		try {
			await updateWishLanguage(language.id, {
				is_active: !language.is_active
			});
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Sprache');
		}
	}

	function confirmDelete(language: WishLanguage) {
		languageToDelete = language;
		showDeleteConfirm = true;
	}

	async function handleDelete() {
		if (!languageToDelete) return;

		try {
			await deleteWishLanguage(languageToDelete.id);
			showDeleteConfirm = false;
			languageToDelete = null;
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Fehler beim Löschen der Sprache');
		}
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		languageToDelete = null;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">Wunsch-Sprachen verwalten</h3>
			<p class="text-sm text-gray-600">
				Konfiguriere unterstützte Sprachen für Wünsche. Mindestens eine Sprache muss aktiv sein.
			</p>
		</div>
		<button class="btn btn-primary" on:click={startAdd}>
			<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6v6m0 0v6m0-6h6m-6 0H6"
				></path>
			</svg>
			Sprache hinzufügen
		</button>
	</div>

	<!-- Error display -->
	{#if $wishLanguagesError}
		<div class="alert alert-error">
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			{$wishLanguagesError}
		</div>
	{/if}

	<!-- Add/Edit Form -->
	{#if showAddForm}
		<div class="card bg-base-200 p-6">
			<h4 class="mb-4 text-lg font-semibold">
				{editingLanguage ? 'Sprache bearbeiten' : 'Neue Sprache hinzufügen'}
			</h4>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="form-control">
						<label class="label" for="code">
							<span class="label-text">Sprach-Code *</span>
						</label>
						<input
							id="code"
							type="text"
							class="input input-bordered"
							bind:value={formData.code}
							placeholder="z.B. de"
							maxlength="2"
							disabled={editingLanguage !== null}
							required
						/>
						<label class="label">
							<span class="label-text-alt">2 Kleinbuchstaben (ISO 639-1)</span>
						</label>
					</div>

					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Name *</span>
						</label>
						<input
							id="name"
							type="text"
							class="input input-bordered"
							bind:value={formData.name}
							placeholder="z.B. Deutsch"
							maxlength="50"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="flag">
							<span class="label-text">Flag *</span>
						</label>
						<select
							id="flag"
							class="select select-bordered w-full"
							bind:value={formData.flag}
							required
						>
							<option value="">-- Flag auswählen --</option>
							{#each flagOptions as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if formError}
					<div class="alert alert-error">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						{formError}
					</div>
				{/if}

				<div class="flex gap-2">
					<button type="submit" class="btn btn-primary">
						{editingLanguage ? 'Aktualisieren' : 'Hinzufügen'}
					</button>
					<button type="button" class="btn btn-ghost" on:click={resetForm}> Abbrechen </button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Languages Table -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			{#if $wishLanguagesLoading}
				<div class="flex items-center justify-center py-8">
					<span class="loading loading-spinner loading-lg"></span>
				</div>
			{:else if $allWishLanguages.length === 0}
				<div class="py-8 text-center text-gray-500">Keine Wunsch-Sprachen konfiguriert</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Sprache</th>
								<th>Code</th>
								<th>Status</th>
								<th>Erstellt</th>
								<th>Aktionen</th>
							</tr>
						</thead>
						<tbody>
							{#each $allWishLanguages as language (language.id)}
								<tr>
									<td class="font-medium">
										{formatLanguageDisplay(language)}
									</td>
									<td>
										<code class="badge badge-outline">{language.code}</code>
									</td>
									<td>
										<div class="form-control">
											<input
												type="checkbox"
												class="toggle toggle-primary"
												checked={language.is_active}
												on:change={() => toggleLanguageActive(language)}
											/>
										</div>
									</td>
									<td>
										{new Date(language.created_at || '').toLocaleDateString('de-DE')}
									</td>
									<td>
										<div class="flex gap-2">
											<button class="btn btn-sm btn-ghost" on:click={() => startEdit(language)}>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													></path>
												</svg>
											</button>
											<button
												class="btn btn-sm btn-ghost text-error"
												on:click={() => confirmDelete(language)}
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													></path>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Sprache löschen</h3>
			<p class="py-4">
				Sind Sie sicher, dass Sie die Sprache
				<strong>{languageToDelete ? formatLanguageDisplay(languageToDelete) : ''}</strong>
				löschen möchten?
			</p>
			<p class="text-warning mb-4 text-sm">
				Diese Aktion kann nicht rückgängig gemacht werden. Stellen Sie sicher, dass keine Wünsche in
				dieser Sprache existieren.
			</p>
			<div class="modal-action">
				<button class="btn btn-error" on:click={handleDelete}> Löschen </button>
				<button class="btn btn-ghost" on:click={cancelDelete}> Abbrechen </button>
			</div>
		</div>
	</div>
{/if}
