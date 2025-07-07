<script lang="ts">
	// Mock data for users
	const users = [
		{
			id: '1',
			full_name: 'Max Mustermann',
			email: 'max@example.com',
			role: 'Administrator',
			status: 'active',
			createdAt: new Date('2024-01-15'),
			lastLogin: new Date('2024-07-06')
		},
		{
			id: '2',
			full_name: 'Anna Schmidt',
			email: 'anna@example.com',
			role: 'Redakteur',
			status: 'active',
			createdAt: new Date('2024-02-20'),
			lastLogin: new Date('2024-07-05')
		},
		{
			id: '3',
			full_name: 'Peter Müller',
			email: 'peter@example.com',
			role: 'Redakteur',
			status: 'inactive',
			createdAt: new Date('2024-03-10'),
			lastLogin: new Date('2024-06-15')
		}
	];

	let searchTerm = $state('');
	let selectedRole = $state('');
	let selectedStatus = $state('');
	let showAddUserModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedUser = $state<(typeof users)[0] | null>(null);

	const roles = ['Administrator', 'Redakteur'];
	// const statuses = ['active', 'inactive']; // Unused for now

	const roleStyles: Record<string, string> = {
		Administrator: 'badge-error',
		Redakteur: 'badge-primary'
	};

	const statusStyles: Record<string, string> = {
		active: 'badge-success',
		inactive: 'badge-neutral'
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

	function filteredUsers() {
		return users.filter((user) => {
			const matchesSearch =
				!searchTerm ||
				user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesRole = !selectedRole || user.role === selectedRole;
			const matchesStatus = !selectedStatus || user.status === selectedStatus;

			return matchesSearch && matchesRole && matchesStatus;
		});
	}

	function openDeleteModal(user: (typeof users)[0]) {
		selectedUser = user;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		selectedUser = null;
		showDeleteModal = false;
	}
</script>

<svelte:head>
	<title>Benutzer verwalten - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Benutzer verwalten</h1>
			<p class="text-base-content/70 mt-2">
				Verwalten Sie Benutzerkonten, Rollen und Berechtigungen
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-primary" onclick={() => (showAddUserModal = true)}>
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
				Neuer Benutzer
			</button>
		</div>
	</div>
</div>

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
		<div class="stat-value text-primary">{users.length}</div>
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
		<div class="stat-value text-success">{users.filter((u) => u.status === 'active').length}</div>
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
			{users.filter((u) => u.role === 'Administrator').length}
		</div>
		<div class="stat-desc">Mit Admin-Rechten</div>
	</div>
</div>

<!-- Filters -->
<div class="card mb-6 bg-base-100 shadow-xl">
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
				/>
			</div>

			<div class="form-control">
				<label class="label" for="role">
					<span class="label-text">Rolle</span>
				</label>
				<select id="role" class="select-bordered select w-full" bind:value={selectedRole}>
					<option value="">Alle Rollen</option>
					{#each roles as role}
						<option value={role}>{role}</option>
					{/each}
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="status">
					<span class="label-text">Status</span>
				</label>
				<select id="status" class="select-bordered select w-full" bind:value={selectedStatus}>
					<option value="">Alle Status</option>
					<option value="active">Aktiv</option>
					<option value="inactive">Inaktiv</option>
				</select>
			</div>
		</div>
	</div>
</div>

<!-- Users Table -->
<div class="card bg-base-100 shadow-xl">
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full">
			<thead>
				<tr>
					<th>Benutzer</th>
					<th>Rolle</th>
					<th>Status</th>
					<th>Erstellt am</th>
					<th>Letzte Anmeldung</th>
					<th>Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers() as user (user.id)}
					<tr class="hover">
						<td>
							<div class="flex items-center gap-3">
								<div class="avatar">
									<div class="w-12 rounded-full bg-primary text-primary-content">
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
								{user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
							</span>
						</td>
						<td>{formatDate(user.createdAt)}</td>
						<td>{formatDateTime(user.lastLogin)}</td>
						<td>
							<div class="flex gap-1">
								<button
									class="btn btn-ghost btn-xs"
									title="Bearbeiten"
									aria-label="Benutzer bearbeiten"
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
			<h3 class="mb-4 text-lg font-bold">Neuen Benutzer hinzufügen</h3>
			<form class="space-y-4">
				<div class="form-control">
					<label class="label" for="newUserName">
						<span class="label-text">Name</span>
					</label>
					<input
						id="newUserName"
						type="text"
						placeholder="Vollständiger Name"
						class="input-bordered input w-full"
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="newUserEmail">
						<span class="label-text">E-Mail</span>
					</label>
					<input
						id="newUserEmail"
						type="email"
						placeholder="benutzer@example.com"
						class="input-bordered input w-full"
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="newUserRole">
						<span class="label-text">Rolle</span>
					</label>
					<select id="newUserRole" class="select-bordered select w-full" required>
						<option value="">Rolle auswählen</option>
						{#each roles as role}
							<option value={role}>{role}</option>
						{/each}
					</select>
				</div>
				<div class="form-control">
					<label class="label" for="newUserPassword">
						<span class="label-text">Temporäres Passwort</span>
					</label>
					<input
						id="newUserPassword"
						type="password"
						placeholder="Passwort"
						class="input-bordered input w-full"
						required
					/>
				</div>
			</form>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showAddUserModal = false)}>
					Abbrechen
				</button>
				<button class="btn btn-primary">Benutzer erstellen</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete User Modal -->
{#if showDeleteModal && selectedUser}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Benutzer löschen</h3>
			<p class="mb-4">
				Möchten Sie den Benutzer <strong>{selectedUser.full_name}</strong> wirklich löschen?
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
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={closeDeleteModal}>Abbrechen</button>
				<button class="btn btn-error" onclick={closeDeleteModal}>Löschen</button>
			</div>
		</div>
	</div>
{/if}
