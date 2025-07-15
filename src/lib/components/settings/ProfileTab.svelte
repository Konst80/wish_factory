<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		data: {
			settings: Record<string, unknown>;
			[key: string]: unknown;
		};
		isSubmitting: boolean;
		languages: Array<{ value: string; label: string }>;
		timezones: Array<{ value: string; label: string }>;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
		onPasswordModalOpen: () => void;
	}

	let {
		data,
		isSubmitting,
		languages,
		timezones,
		onSubmittingChange,
		onMessage,
		onPasswordModalOpen
	}: Props = $props();
</script>

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
				Profil
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
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
				Persönliche Daten
			</div>
		</div>

		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				onSubmittingChange(true);
				return async ({ result }) => {
					if (result.type === 'success') {
						await invalidateAll();
						onMessage(
							(result.data?.message as string) || 'Profil erfolgreich aktualisiert!',
							false
						);
					} else if (result.type === 'failure') {
						onMessage(
							(result.data?.message as string) || 'Fehler beim Speichern des Profils',
							true
						);
					}
					onSubmittingChange(false);
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
								value={(data.settings as any).profile?.fullName || ''}
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
								value={(data.settings as any).profile?.email || ''}
								disabled
							/>
							<div class="label">
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
							</div>
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
								value={(data.settings as any).profile?.language || ''}
							>
								{#each languages as lang (lang.value)}
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
								value={(data.settings as any).profile?.timezone || ''}
							>
								{#each timezones as tz (tz.value)}
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
						<button
							type="button"
							class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content gap-2"
							onclick={onPasswordModalOpen}
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
