<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { ApiKey } from '$lib/server/api-key-service';
	import WorkflowHelp from '$lib/components/ui/WorkflowHelp.svelte';

	let { data, form }: { data: PageData; form: any } = $props();

	// UI State
	let showCreateModal = $state(false);
	let showKeyModal = $state(false);
	let newApiKeyData = $state<{ apiKey: ApiKey; plainKey: string } | null>(null);
	let showWorkflowHelp = $state(false);
	let isSubmitting = $state(false);
	let selectedKeyForDeactivation = $state<string | null>(null);

	// Form data
	let createForm = $state({
		name: '',
		description: '',
		rateLimitPerHour: 1000,
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
			<div class="text-center py-12">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-base-300"
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
				<h3 class="text-lg font-medium mt-4">Keine API Keys vorhanden</h3>
				<p class="text-sm opacity-70 mt-2">
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
									<code class="bg-base-200 px-2 py-1 rounded text-sm">
										{apiKey.keyPrefix}***
									</code>
								</td>
								<td>
									<div class="badge {getStatusBadgeClass(apiKey)} badge-sm">
										{getStatusText(apiKey)}
									</div>
									{#if apiKey.expiresAt}
										<div class="text-xs opacity-70 mt-1">
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
									<div class="text-sm font-mono">
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
									<div class="flex gap-2">
										{#if apiKey.isActive}
											<button
												class="btn btn-error btn-xs"
												onclick={() => (selectedKeyForDeactivation = apiKey.id)}
											>
												Deaktivieren
											</button>
										{/if}
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
		<div class="modal-box w-11/12 max-w-2xl">
			<h3 class="text-lg font-bold mb-4">Neuen API Key erstellen</h3>
			
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
				<div class="space-y-4">
					<!-- Name -->
					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Name *</span>
						</label>
						<input
							type="text"
							id="name"
							name="name"
							class="input input-bordered"
							placeholder="z.B. WishSnap Mobile App"
							bind:value={createForm.name}
							required
						/>
					</div>

					<!-- Description -->
					<div class="form-control">
						<label class="label" for="description">
							<span class="label-text">Beschreibung</span>
						</label>
						<textarea
							id="description"
							name="description"
							class="textarea textarea-bordered"
							placeholder="Optionale Beschreibung des API Keys"
							bind:value={createForm.description}
						></textarea>
					</div>

					<!-- Rate Limit -->
					<div class="form-control">
						<label class="label" for="rateLimitPerHour">
							<span class="label-text">Rate Limit (pro Stunde)</span>
						</label>
						<input
							type="number"
							id="rateLimitPerHour"
							name="rateLimitPerHour"
							class="input input-bordered"
							min="1"
							max="10000"
							bind:value={createForm.rateLimitPerHour}
						/>
						<label class="label">
							<span class="label-text-alt">Standard: 1000 Anfragen pro Stunde</span>
						</label>
					</div>

					<!-- Expiration -->
					<div class="form-control">
						<label class="label" for="expiresAt">
							<span class="label-text">Ablaufdatum (optional)</span>
						</label>
						<input
							type="datetime-local"
							id="expiresAt"
							name="expiresAt"
							class="input input-bordered"
							bind:value={createForm.expiresAt}
						/>
						<label class="label">
							<span class="label-text-alt">Leer lassen für unbegrenzten API Key</span>
						</label>
					</div>
				</div>

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeCreateModal}>
						Abbrechen
					</button>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
							Erstellen...
						{:else}
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
			<h3 class="text-lg font-bold mb-4">API Key erfolgreich erstellt</h3>
			
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
					<strong>Wichtig:</strong> Speichern Sie diesen API Key sicher ab! 
					Er wird nur einmal angezeigt und kann nicht wiederhergestellt werden.
				</div>
			</div>

			<div class="space-y-4">
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Name</span>
					</label>
					<div class="input input-bordered bg-base-200">
						{newApiKeyData.apiKey.name}
					</div>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">API Key</span>
					</label>
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

				<div class="bg-base-200 p-4 rounded-lg">
					<h4 class="font-medium mb-2">Verwendung:</h4>
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
				<button class="btn btn-primary" onclick={() => {
					showKeyModal = false;
					newApiKeyData = null;
					window.location.reload(); // Refresh to show new key in list
				}}>
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
			<h3 class="text-lg font-bold mb-4">API Key deaktivieren</h3>
			<p class="mb-4">
				Sind Sie sicher, dass Sie diesen API Key deaktivieren möchten? 
				Apps, die diesen Key verwenden, können danach nicht mehr auf die API zugreifen.
			</p>
			
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (selectedKeyForDeactivation = null)}>
					Abbrechen
				</button>
				<form method="POST" action="?/deactivate" use:enhance>
					<input type="hidden" name="keyId" value={selectedKeyForDeactivation} />
					<button type="submit" class="btn btn-error" onclick={() => (selectedKeyForDeactivation = null)}>
						Deaktivieren
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Workflow Help Modal -->
<WorkflowHelp bind:isOpen={showWorkflowHelp} />