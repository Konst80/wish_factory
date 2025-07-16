<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { ApiKey } from '$lib/server/api-key-service';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';

	const { data, form }: { data: PageData; form: import('./$types.js').ActionData } = $props();

	// UI State
	let showCreateModal = $state(false);
	let showKeyModal = $state(false);
	let newApiKeyData = $state<{ apiKey: ApiKey; plainKey: string } | null>(null);
	let showWorkflowHelp = $state(false);
	let isSubmitting = $state(false);
	let selectedKeyForDeactivation = $state<string | null>(null);
	let selectedKeyForActivation = $state<string | null>(null);
	let selectedKeyForDeletion = $state<string | null>(null);
	let selectedKeyForEdit = $state<ApiKey | null>(null);
	let showEditModal = $state(false);

	// Form data
	let createForm = $state({
		name: '',
		description: '',
		rateLimitPerHour: 1000,
		expiresAt: ''
	});

	let editForm = $state({
		rateLimitPerHour: 1000,
		description: '',
		expiresAt: ''
	});

	// Watch for successful creation
	$effect(() => {
		if (form?.success && form?.apiKey && form?.plainKey) {
			newApiKeyData = {
				apiKey: form.apiKey,
				plainKey: form.plainKey
			};
			showCreateModal = false;
			showKeyModal = true;
			resetCreateForm();
		}
	});

	function resetCreateForm() {
		createForm = {
			name: '',
			description: '',
			rateLimitPerHour: 1000,
			expiresAt: ''
		};
	}

	function closeCreateModal() {
		showCreateModal = false;
		resetCreateForm();
	}

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		// You might want to add a toast notification here
	}

	function openEditModal(apiKey: ApiKey) {
		selectedKeyForEdit = apiKey;
		editForm = {
			rateLimitPerHour: apiKey.rateLimitPerHour,
			description: apiKey.description || '',
			expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString().slice(0, 16) : ''
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedKeyForEdit = null;
		editForm = {
			rateLimitPerHour: 1000,
			description: '',
			expiresAt: ''
		};
	}

	function getStatusBadgeClass(apiKey: ApiKey) {
		if (!apiKey.isActive) return 'badge-error';
		if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return 'badge-warning';
		return 'badge-success';
	}

	function getStatusText(apiKey: ApiKey) {
		if (!apiKey.isActive) return 'Deaktiviert';
		if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return 'Abgelaufen';
		return 'Aktiv';
	}
</script>

<svelte:head>
	<title>API Keys - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">API Key Verwaltung</h1>
			<p class="text-base-content/70 mt-2">
				Verwalten Sie API Keys für den Zugriff auf öffentliche Endpoints
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (showWorkflowHelp = true)}>
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
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Hilfe
			</button>
			<button class="btn btn-primary btn-sm" onclick={() => (showCreateModal = true)}>
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
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Neuen API Key erstellen
			</button>
		</div>
	</div>
</div>

<!-- Success/Error Messages -->
{#if form?.success && !form?.apiKey}
	<div class="alert alert-success mb-6">
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
		<span>{form.message}</span>
	</div>
{:else if form?.error}
	<div class="alert alert-error mb-6">
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
		<span>{form.error}</span>
	</div>
{/if}

<!-- API Keys Overview -->
<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">API Keys</h2>

		{#if data.apiKeys.length === 0}
			<div class="py-12 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="text-base-300 mx-auto h-16 w-16"
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
				<h3 class="mt-4 text-lg font-medium">Keine API Keys vorhanden</h3>
				<p class="mt-2 text-sm opacity-70">
					Erstellen Sie Ihren ersten API Key für den Zugriff auf die öffentlichen Endpoints.
				</p>
				<button class="btn btn-primary mt-4" onclick={() => (showCreateModal = true)}>
					Ersten API Key erstellen
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr>
							<th>Name</th>
							<th>Prefix</th>
							<th>Status</th>
							<th>Rate Limit</th>
							<th>Nutzung</th>
							<th>Letzte Nutzung</th>
							<th>Erstellt</th>
							<th>Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{#each data.apiKeys as apiKey (apiKey.id)}
							<tr class="hover">
								<td>
									<div>
										<div class="font-bold">{apiKey.name}</div>
										{#if apiKey.description}
											<div class="text-sm opacity-70">{apiKey.description}</div>
										{/if}
									</div>
								</td>
								<td>
									<code class="bg-base-200 rounded px-2 py-1 text-sm">
										{apiKey.keyPrefix}***
									</code>
								</td>
								<td>
									<div class="badge {getStatusBadgeClass(apiKey)} badge-sm">
										{getStatusText(apiKey)}
									</div>
									{#if apiKey.expiresAt}
										<div class="mt-1 text-xs opacity-70">
											Läuft ab: {formatDate(apiKey.expiresAt)}
										</div>
									{/if}
								</td>
								<td>
									<div class="text-sm">
										{apiKey.rateLimitPerHour}/h
									</div>
								</td>
								<td>
									<div class="font-mono text-sm">
										{apiKey.totalRequests.toLocaleString()}
									</div>
								</td>
								<td>
									<div class="text-sm">
										{apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Nie'}
									</div>
								</td>
								<td>
									<div class="text-sm">
										{formatDate(apiKey.createdAt)}
									</div>
								</td>
								<td>
									<div class="flex gap-1">
										<button
											class="btn btn-ghost btn-xs"
											onclick={() => openEditModal(apiKey)}
											title="API Key bearbeiten"
											aria-label="API Key bearbeiten"
										>
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
													d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
												/>
											</svg>
										</button>
										{#if apiKey.isActive}
											<button
												class="btn btn-warning btn-xs"
												onclick={() => (selectedKeyForDeactivation = apiKey.id)}
												title="API Key deaktivieren"
												aria-label="API Key deaktivieren"
											>
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
														d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
													/>
												</svg>
											</button>
										{:else}
											<button
												class="btn btn-success btn-xs"
												onclick={() => (selectedKeyForActivation = apiKey.id)}
												title="API Key aktivieren"
												aria-label="API Key aktivieren"
											>
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
														d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
											</button>
										{/if}
										<button
											class="btn btn-error btn-xs"
											onclick={() => (selectedKeyForDeletion = apiKey.id)}
											title="API Key löschen"
											aria-label="API Key löschen"
										>
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
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
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

<!-- Create API Key Modal -->
{#if showCreateModal}
	<div class="modal modal-open">
		<div class="modal-box w-11/12 max-w-3xl">
			<!-- Modal Header -->
			<div class="border-base-200 mb-6 flex items-center justify-between border-b pb-4">
				<div class="flex items-center gap-3">
					<div class="avatar placeholder">
						<div class="bg-primary text-primary-content w-12 rounded-xl">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 7 21 9z"
								/>
							</svg>
						</div>
					</div>
					<div>
						<h3 class="text-xl font-bold">Neuen API Key erstellen</h3>
						<p class="text-base-content/70 text-sm">
							Erstellen Sie einen sicheren Zugangsschlüssel für Ihre Anwendung
						</p>
					</div>
				</div>
				<button
					class="btn btn-sm btn-circle btn-ghost"
					onclick={closeCreateModal}
					aria-label="Modal schließen"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="grid gap-6">
					<!-- Basic Information -->
					<div class="card bg-base-50 border-base-200 border">
						<div class="card-body p-4">
							<h4 class="card-title mb-3 flex items-center gap-2 text-base">
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
								Grundinformationen
							</h4>

							<div class="grid gap-4">
								<div class="form-control">
									<label class="label" for="name">
										<span class="label-text font-medium">Name *</span>
										<span class="label-text-alt">Eindeutiger Bezeichner</span>
									</label>
									<input
										type="text"
										id="name"
										name="name"
										bind:value={createForm.name}
										placeholder="z.B. WishSnap Mobile App"
										class="input input-bordered focus:input-primary"
										required
									/>
								</div>

								<div class="form-control">
									<label class="label" for="description">
										<span class="label-text font-medium">Beschreibung</span>
										<span class="label-text-alt">Optional</span>
									</label>
									<textarea
										id="description"
										name="description"
										bind:value={createForm.description}
										placeholder="Beschreiben Sie den Verwendungszweck dieses API Keys..."
										class="textarea textarea-bordered focus:textarea-primary h-20"
									></textarea>
								</div>
							</div>
						</div>
					</div>

					<!-- Security Settings -->
					<div class="card bg-base-50 border-base-200 border">
						<div class="card-body p-4">
							<h4 class="card-title mb-3 flex items-center gap-2 text-base">
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
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
								Sicherheitseinstellungen
							</h4>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="rateLimitPerHour">
										<span class="label-text font-medium">Rate Limit (pro Stunde)</span>
									</label>
									<div class="join">
										<input
											type="number"
											id="rateLimitPerHour"
											name="rateLimitPerHour"
											bind:value={createForm.rateLimitPerHour}
											min="1"
											max="10000"
											class="input input-bordered join-item focus:input-primary flex-1"
										/>
										<span class="btn btn-outline join-item">Req/h</span>
									</div>
									<div class="label">
										<span class="label-text-alt text-info"
											>💡 Standard: 1000 Anfragen pro Stunde</span
										>
									</div>
								</div>

								<div class="form-control">
									<label class="label" for="expiresAt">
										<span class="label-text font-medium">Ablaufdatum</span>
									</label>
									<input
										type="datetime-local"
										id="expiresAt"
										name="expiresAt"
										bind:value={createForm.expiresAt}
										class="input input-bordered focus:input-primary"
									/>
									<div class="label">
										<span class="label-text-alt text-info"
											>⏰ Leer lassen für unbegrenzten API Key</span
										>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Info Banner -->
					<div class="alert alert-info">
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
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div class="text-sm">
							<strong>Hinweis:</strong> Der API Key wird nur einmal angezeigt und kann nicht wiederhergestellt
							werden. Speichern Sie ihn an einem sicheren Ort.
						</div>
					</div>
				</div>

				<div class="modal-action border-base-200 mt-6 border-t pt-6">
					<button type="button" class="btn btn-ghost" onclick={closeCreateModal}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-4 w-4"
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
					<button type="submit" class="btn btn-primary min-w-32" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
							Erstelle...
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 7 21 9z"
								/>
							</svg>
							API Key erstellen
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- New API Key Display Modal -->
{#if showKeyModal && newApiKeyData}
	<div class="modal modal-open">
		<div class="modal-box w-11/12 max-w-2xl">
			<h3 class="mb-4 text-lg font-bold">API Key erfolgreich erstellt</h3>

			<div class="alert alert-warning mb-4">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<div>
					<strong>Wichtig:</strong> Speichern Sie diesen API Key sicher ab! Er wird nur einmal angezeigt
					und kann nicht wiederhergestellt werden.
				</div>
			</div>

			<div class="space-y-4">
				<div class="form-control">
					<div class="label">
						<span class="label-text font-medium">Name</span>
					</div>
					<div class="input input-bordered bg-base-200">
						{newApiKeyData.apiKey.name}
					</div>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text font-medium">API Key</span>
					</div>
					<div class="join">
						<input
							type="text"
							class="input input-bordered join-item flex-1 font-mono text-sm"
							value={newApiKeyData.plainKey}
							readonly
						/>
						<button
							class="btn btn-outline join-item"
							onclick={() => newApiKeyData && copyToClipboard(newApiKeyData.plainKey)}
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
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Kopieren
						</button>
					</div>
				</div>

				<div class="bg-base-200 rounded-lg p-4">
					<h4 class="mb-2 font-medium">Verwendung:</h4>
					<div class="space-y-2 text-sm">
						<div>
							<strong>Header:</strong> <code>X-API-Key: {newApiKeyData.plainKey}</code>
						</div>
						<div>
							<strong>Oder:</strong> <code>Authorization: Bearer {newApiKeyData.plainKey}</code>
						</div>
						<div>
							<strong>Endpoint:</strong> <code>GET /api/public/wishes</code>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-action">
				<button
					class="btn btn-primary"
					onclick={() => {
						showKeyModal = false;
						newApiKeyData = null;
						window.location.reload(); // Refresh to show new key in list
					}}
				>
					Verstanden
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Deactivate Confirmation Modal -->
{#if selectedKeyForDeactivation}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">API Key deaktivieren</h3>
			<p class="mb-4">
				Sind Sie sicher, dass Sie diesen API Key deaktivieren möchten? Apps, die diesen Key
				verwenden, können danach nicht mehr auf die API zugreifen.
			</p>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (selectedKeyForDeactivation = null)}>
					Abbrechen
				</button>
				<form
					method="POST"
					action="?/deactivate"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							selectedKeyForDeactivation = null;
						};
					}}
				>
					<input type="hidden" name="keyId" value={selectedKeyForDeactivation} />
					<button type="submit" class="btn btn-warning"> Deaktivieren </button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Activate Confirmation Modal -->
{#if selectedKeyForActivation}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">API Key aktivieren</h3>
			<p class="mb-4">
				Sind Sie sicher, dass Sie diesen API Key aktivieren möchten? Apps, die diesen Key verwenden,
				können danach wieder auf die API zugreifen.
			</p>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (selectedKeyForActivation = null)}>
					Abbrechen
				</button>
				<form
					method="POST"
					action="?/activate"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							selectedKeyForActivation = null;
						};
					}}
				>
					<input type="hidden" name="keyId" value={selectedKeyForActivation} />
					<button type="submit" class="btn btn-success"> Aktivieren </button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if selectedKeyForDeletion}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">API Key löschen</h3>
			<div class="alert alert-warning mb-4">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<span><strong>Achtung:</strong> Diese Aktion kann nicht rückgängig gemacht werden!</span>
			</div>
			<p class="mb-4">
				Sind Sie sicher, dass Sie diesen API Key permanent löschen möchten? Alle Apps, die diesen
				Key verwenden, können danach nicht mehr auf die API zugreifen und der Key kann nicht
				wiederhergestellt werden.
			</p>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (selectedKeyForDeletion = null)}>
					Abbrechen
				</button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							selectedKeyForDeletion = null;
						};
					}}
				>
					<input type="hidden" name="keyId" value={selectedKeyForDeletion} />
					<button type="submit" class="btn btn-error"> Permanent löschen </button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Edit API Key Modal -->
{#if showEditModal && selectedKeyForEdit}
	<div class="modal modal-open">
		<div class="modal-box w-11/12 max-w-2xl">
			<!-- Modal Header -->
			<div class="border-base-200 mb-6 flex items-center justify-between border-b pb-4">
				<div class="flex items-center gap-3">
					<div class="avatar placeholder">
						<div class="bg-info text-info-content w-12 rounded-xl">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
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
						</div>
					</div>
					<div>
						<h3 class="text-xl font-bold">API Key bearbeiten</h3>
						<p class="text-base-content/70 text-sm">
							Anpassungen an "{selectedKeyForEdit.name}"
						</p>
					</div>
				</div>
				<button
					class="btn btn-sm btn-circle btn-ghost"
					onclick={closeEditModal}
					aria-label="Modal schließen"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						closeEditModal();
					};
				}}
			>
				<input type="hidden" name="keyId" value={selectedKeyForEdit.id} />

				<div class="grid gap-6">
					<!-- Basic Information -->
					<div class="card bg-base-50 border-base-200 border">
						<div class="card-body p-4">
							<h4 class="card-title mb-3 flex items-center gap-2 text-base">
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
								Grundinformationen
							</h4>

							<div class="grid gap-4">
								<div class="form-control">
									<label class="label" for="edit-description">
										<span class="label-text font-medium">Beschreibung</span>
										<span class="label-text-alt">Optional</span>
									</label>
									<textarea
										id="edit-description"
										name="description"
										bind:value={editForm.description}
										placeholder="Beschreiben Sie den Verwendungszweck dieses API Keys..."
										class="textarea textarea-bordered focus:textarea-info h-20"
									></textarea>
								</div>
							</div>
						</div>
					</div>

					<!-- Settings -->
					<div class="card bg-base-50 border-base-200 border">
						<div class="card-body p-4">
							<h4 class="card-title mb-3 flex items-center gap-2 text-base">
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
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
								Einstellungen
							</h4>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="edit-rateLimitPerHour">
										<span class="label-text font-medium">Rate Limit (pro Stunde) *</span>
									</label>
									<div class="join">
										<input
											type="number"
											id="edit-rateLimitPerHour"
											name="rateLimitPerHour"
											bind:value={editForm.rateLimitPerHour}
											min="1"
											max="10000"
											class="input input-bordered join-item focus:input-info flex-1"
											required
										/>
										<span class="btn btn-outline join-item">Req/h</span>
									</div>
									<div class="label">
										<span class="label-text-alt text-info"
											>💡 Aktuell: {selectedKeyForEdit.rateLimitPerHour} Anfragen pro Stunde</span
										>
									</div>
								</div>

								<div class="form-control">
									<label class="label" for="edit-expiresAt">
										<span class="label-text font-medium">Ablaufdatum</span>
									</label>
									<input
										type="datetime-local"
										id="edit-expiresAt"
										name="expiresAt"
										bind:value={editForm.expiresAt}
										class="input input-bordered focus:input-info"
									/>
									<div class="label">
										<span class="label-text-alt text-info"
											>⏰ Leer lassen für unbegrenzten API Key</span
										>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Current Info -->
					<div class="alert alert-info">
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
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div class="text-sm">
							<strong>Aktueller Status:</strong>
							{getStatusText(selectedKeyForEdit)} •
							<strong>Erstellt:</strong>
							{formatDate(selectedKeyForEdit.createdAt)} •
							<strong>Nutzung:</strong>
							{selectedKeyForEdit.totalRequests.toLocaleString()} Anfragen
						</div>
					</div>
				</div>

				<div class="modal-action border-base-200 mt-6 border-t pt-6">
					<button type="button" class="btn btn-ghost" onclick={closeEditModal}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-4 w-4"
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
					<button type="submit" class="btn btn-info min-w-32" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
							Speichere...
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Änderungen speichern
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} contentType="api-keys" />
