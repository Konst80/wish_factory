<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let searchTerm = $state(data.filters.search || '');
	let selectedRole = $state(data.filters.role || '');
	let selectedStatus = $state(data.filters.status || '');
	let showAddUserModal = $state(false);
	let showEditUserModal = $state(false);
	let showDeleteModal = $state(false);
	let showResendModal = $state(false);
	let selectedUser = $state<(typeof data.users)[0] | null>(null);

	// Form data for new/edit user
	let userForm = $state({
		fullName: '',
		email: '',
		role: 'Redakteur'
	});

	// Global status message
	let globalMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Auto-hide message after 5 seconds
	function showGlobalMessage(type: 'success' | 'error', text: string) {
		globalMessage = { type, text };
		setTimeout(() => {
			globalMessage = null;
		}, 5000);
	}

	// Update URL when filters change
	function updateFilters() {
		const params = new URLSearchParams();
		if (searchTerm) params.set('search', searchTerm);
		if (selectedRole) params.set('role', selectedRole);
		if (selectedStatus) params.set('status', selectedStatus);
		goto(`?${params.toString()}`, { replaceState: true });
	}

	// Debounced search
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(updateFilters, 500);
	}

	const roles = ['Administrator', 'Redakteur'];
	// const statuses = ['active', 'inactive', 'invited', 'expired'];

	const roleStyles: Record<string, string> = {
		Administrator: 'badge-error',
		Redakteur: 'badge-primary'
	};

	const statusStyles: Record<string, string> = {
		active: 'badge-success',
		inactive: 'badge-neutral',
		invited: 'badge-warning',
		expired: 'badge-error'
	};

	const statusLabels: Record<string, string> = {
		active: 'Aktiv',
		inactive: 'Inaktiv',
		invited: 'Eingeladen',
		expired: 'Abgelaufen'
	};

	function formatDate(date: Date) {
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatDateTime(date: Date) {
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openEditModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		userForm.fullName = user.full_name;
		userForm.email = user.email;
		userForm.role = user.role;
		showEditUserModal = true;
	}

	function openDeleteModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		selectedUser = null;
		showDeleteModal = false;
	}

	function openResendModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		showResendModal = true;
	}

	function closeResendModal() {
		selectedUser = null;
		showResendModal = false;
	}

	function closeEditModal() {
		selectedUser = null;
		showEditUserModal = false;
		userForm = { fullName: '', email: '', role: 'Redakteur' };
	}

	function openAddModal() {
		userForm = { fullName: '', email: '', role: 'Redakteur' };
		showAddUserModal = true;
	}
</script>

<svelte:head>
	<title>Benutzer verwalten - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Benutzer verwalten</h1>
			<p class="text-base-content/70 mt-2">
				Verwalten Sie Benutzerkonten, Rollen und Berechtigungen
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-primary" onclick={openAddModal}>
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
				Einladung senden
			</button>
		</div>
	</div>
</div>

<!-- Global Status Message -->
{#if globalMessage}
	<div class="alert {globalMessage.type === 'success' ? 'alert-success' : 'alert-error'} mb-6">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			{#if globalMessage.type === 'success'}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			{:else}
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			{/if}
		</svg>
		<span>{globalMessage.text}</span>
		<button class="btn btn-sm btn-ghost" onclick={() => (globalMessage = null)}>✕</button>
	</div>
{/if}

<!-- Statistics -->
<div class="stats mb-6 w-full shadow">
	<div class="stat">
		<div class="stat-figure text-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
				/>
			</svg>
		</div>
		<div class="stat-title">Gesamt</div>
		<div class="stat-value text-primary">{data.stats.total}</div>
		<div class="stat-desc">Registrierte Benutzer</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
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
		</div>
		<div class="stat-title">Aktiv</div>
		<div class="stat-value text-success">{data.stats.active}</div>
		<div class="stat-desc">Online Benutzer</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-error">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div class="stat-title">Administratoren</div>
		<div class="stat-value text-error">
			{data.stats.administrators}
		</div>
		<div class="stat-desc">Mit Admin-Rechten</div>
	</div>
</div>

<!-- Filters -->
<div class="card bg-base-100 mb-6 shadow-xl">
	<div class="card-body">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="form-control">
				<label class="label" for="search">
					<span class="label-text">Suche</span>
				</label>
				<input
					id="search"
					type="text"
					placeholder="Name oder E-Mail suchen..."
					class="input-bordered input w-full"
					bind:value={searchTerm}
					oninput={handleSearchInput}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="role">
					<span class="label-text">Rolle</span>
				</label>
				<select
					id="role"
					class="select-bordered select w-full"
					bind:value={selectedRole}
					onchange={updateFilters}
				>
					<option value="">Alle Rollen</option>
					{#each roles as role (role)}
						<option value={role}>{role}</option>
					{/each}
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="status">
					<span class="label-text">Status</span>
				</label>
				<select
					id="status"
					class="select-bordered select w-full"
					bind:value={selectedStatus}
					onchange={updateFilters}
				>
					<option value="">Alle Status</option>
					<option value="active">Aktiv</option>
					<option value="inactive">Inaktiv</option>
					<option value="invited">Eingeladen</option>
					<option value="expired">Abgelaufen</option>
				</select>
			</div>
		</div>
	</div>
</div>

<!-- Users Table -->
<div class="card bg-base-100 shadow-xl">
	<div class="overflow-x-auto">
		<table class="table-zebra table w-full">
			<thead>
				<tr>
					<th>Benutzer</th>
					<th>Rolle</th>
					<th>Status</th>
					<th>Erstellt am</th>
					<th>Zusätzliche Info</th>
					<th>Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr class="hover">
						<td>
							<div class="flex items-center gap-3">
								<div class="avatar">
									<div class="bg-primary text-primary-content w-12 rounded-full">
										<div class="flex h-12 items-center justify-center">
											<span class="text-lg font-medium">{user.full_name.charAt(0)}</span>
										</div>
									</div>
								</div>
								<div>
									<div class="font-bold">{user.full_name}</div>
									<div class="text-sm opacity-70">{user.email}</div>
								</div>
							</div>
						</td>
						<td>
							<span class="badge {roleStyles[user.role]} badge-sm">
								{user.role}
							</span>
						</td>
						<td>
							<span class="badge {statusStyles[user.status]} badge-sm">
								{statusLabels[user.status]}
							</span>
						</td>
						<td>{formatDate(user.createdAt)}</td>
						<td>
							{#if user.type === 'invitation'}
								{#if user.status === 'expired'}
									<span class="text-error text-sm">Abgelaufen: {formatDate(user.expiresAt)}</span>
								{:else}
									<span class="text-warning text-sm">Läuft ab: {formatDate(user.expiresAt)}</span>
								{/if}
							{:else}
								<span class="text-sm opacity-70"
									>Letzte Anmeldung: {formatDateTime(user.lastLogin)}</span
								>
							{/if}
						</td>
						<td>
							<div class="flex gap-1">
								{#if user.type === 'invitation'}
									{#if user.status === 'invited'}
										<button
											class="btn btn-ghost btn-xs text-warning"
											title="Einladung erneut senden"
											aria-label="Einladung erneut senden"
											onclick={() => openResendModal(user)}
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
													d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
										</button>
									{/if}
									<button
										class="btn btn-ghost btn-xs text-error"
										title="Einladung löschen"
										aria-label="Einladung löschen"
										onclick={() => openDeleteModal(user)}
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{:else}
									<button
										class="btn btn-ghost btn-xs"
										title="Bearbeiten"
										aria-label="Benutzer bearbeiten"
										onclick={() => openEditModal(user)}
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
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											/>
										</svg>
									</button>
									<button
										class="btn btn-ghost btn-xs text-error"
										title="Löschen"
										aria-label="Benutzer löschen"
										onclick={() => openDeleteModal(user)}
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="text-center py-8">
							<div class="flex flex-col items-center gap-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-16 w-16 opacity-30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
								<div>
									<h3 class="text-lg font-medium">Keine Benutzer gefunden</h3>
									<p class="text-sm opacity-70 mt-1">
										Passen Sie Ihre Filter an oder erstellen Sie einen neuen Benutzer.
									</p>
								</div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Add User Modal -->
{#if showAddUserModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Benutzer einladen</h3>

			<form
				method="POST"
				action="?/inviteUser"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							showAddUserModal = false;
							userForm = { fullName: '', email: '', role: 'Redakteur' };
							showGlobalMessage('success', 'Einladung erfolgreich versendet');
							// Reload page data to show new user
							await invalidateAll();
						} else if (result.type === 'failure') {
							showGlobalMessage(
								'error',
								(result.data?.message as string) || 'Fehler beim Versenden der Einladung'
							);
						}
					};
				}}
				class="space-y-4"
			>
				<div class="form-control">
					<label class="label" for="newUserName">
						<span class="label-text">Name</span>
					</label>
					<input
						id="newUserName"
						name="fullName"
						type="text"
						placeholder="Vollständiger Name"
						class="input-bordered input w-full"
						bind:value={userForm.fullName}
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="newUserEmail">
						<span class="label-text">E-Mail</span>
					</label>
					<input
						id="newUserEmail"
						name="email"
						type="email"
						placeholder="benutzer@example.com"
						class="input-bordered input w-full"
						bind:value={userForm.email}
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="newUserRole">
						<span class="label-text">Rolle</span>
					</label>
					<select
						id="newUserRole"
						name="role"
						class="select-bordered select w-full"
						bind:value={userForm.role}
						required
					>
						{#each roles as role (role)}
							<option value={role}>{role}</option>
						{/each}
					</select>
				</div>
				<div class="alert alert-info">
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
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Der Benutzer erhält eine E-Mail mit einem Link zur Passwort-Festlegung.</span>
				</div>
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={() => (showAddUserModal = false)}>
						Abbrechen
					</button>
					<button type="submit" class="btn btn-primary">Einladung senden</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete User Modal -->
{#if showDeleteModal && selectedUser}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">
				{selectedUser.type === 'invitation' ? 'Einladung löschen' : 'Benutzer löschen'}
			</h3>
			<p class="mb-4">
				Möchten Sie {selectedUser.type === 'invitation' ? 'die Einladung für' : 'den Benutzer'}
				<strong>{selectedUser.full_name}</strong> wirklich löschen?
			</p>
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<span>Diese Aktion kann nicht rückgängig gemacht werden!</span>
			</div>
			<form
				method="POST"
				action={selectedUser.type === 'invitation' ? '?/deleteInvitation' : '?/deleteUser'}
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							const userName = selectedUser?.full_name || 'Benutzer';
							const isInvitation = selectedUser?.type === 'invitation';
							showDeleteModal = false;
							selectedUser = null;
							showGlobalMessage(
								'success',
								`${isInvitation ? 'Einladung für ' : ''}${userName} erfolgreich gelöscht`
							);
							// Reload page data to remove deleted user/invitation
							await invalidateAll();
						} else if (result.type === 'failure') {
							const isInvitation = selectedUser?.type === 'invitation';
							showGlobalMessage(
								'error',
								(result.data?.message as string) ||
									`Fehler beim Löschen ${isInvitation ? 'der Einladung' : 'des Benutzers'}`
							);
						}
					};
				}}
			>
				<input type="hidden" name="userId" value={selectedUser.id} />
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeDeleteModal}>Abbrechen</button>
					<button type="submit" class="btn btn-error">Löschen</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Resend Invitation Modal -->
{#if showResendModal && selectedUser}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Einladung erneut senden</h3>
			<p class="mb-4">
				Möchten Sie die Einladung für <strong>{selectedUser.full_name}</strong>
				({selectedUser.email}) erneut senden?
			</p>
			<div class="alert alert-info">
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
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>Die Einladung wird mit einer neuen Gültigkeitsdauer von 7 Tagen versendet.</span>
			</div>
			<form
				method="POST"
				action="?/resendInvitation"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							const userName = selectedUser?.full_name || 'Benutzer';
							showResendModal = false;
							selectedUser = null;
							showGlobalMessage('success', `Einladung für ${userName} erfolgreich erneut gesendet`);
							// Reload page data to update invitation status
							await invalidateAll();
						} else if (result.type === 'failure') {
							showGlobalMessage(
								'error',
								(result.data?.message as string) || 'Fehler beim erneuten Senden der Einladung'
							);
						}
					};
				}}
			>
				<input type="hidden" name="userId" value={selectedUser.id} />
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeResendModal}>Abbrechen</button>
					<button type="submit" class="btn btn-warning">Einladung senden</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if showEditUserModal && selectedUser}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Benutzer bearbeiten</h3>

			<form
				method="POST"
				action="?/updateRole"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							showEditUserModal = false;
							const userName = selectedUser?.full_name || 'Benutzer';
							selectedUser = null;
							userForm = { fullName: '', email: '', role: 'Redakteur' };
							showGlobalMessage('success', `Rolle von ${userName} erfolgreich aktualisiert`);
							// Reload page data to show updated user
							await invalidateAll();
						} else if (result.type === 'failure') {
							showGlobalMessage(
								'error',
								(result.data?.message as string) || 'Fehler beim Aktualisieren der Rolle'
							);
						}
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="userId" value={selectedUser.id} />

				<div class="form-control">
					<div class="label">
						<span class="label-text">Name</span>
					</div>
					<input
						type="text"
						class="input-bordered input w-full"
						value={selectedUser.full_name}
						disabled
					/>
					<div class="label">
						<span class="label-text-alt">Name kann derzeit nicht geändert werden</span>
					</div>
				</div>

				<div class="form-control">
					<div class="label">
						<span class="label-text">E-Mail</span>
					</div>
					<input
						type="email"
						class="input-bordered input w-full"
						value={selectedUser.email}
						disabled
					/>
					<div class="label">
						<span class="label-text-alt">E-Mail kann derzeit nicht geändert werden</span>
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="editUserRole">
						<span class="label-text">Rolle</span>
					</label>
					<select
						id="editUserRole"
						name="role"
						class="select-bordered select w-full"
						bind:value={userForm.role}
						required
					>
						{#each roles as role (role)}
							<option value={role}>{role}</option>
						{/each}
					</select>
				</div>

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeEditModal}> Abbrechen </button>
					<button type="submit" class="btn btn-primary">Rolle aktualisieren</button>
				</div>
			</form>
		</div>
	</div>
{/if}
