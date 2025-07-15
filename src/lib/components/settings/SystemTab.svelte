<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import WishLanguageManagement from '$lib/components/admin/WishLanguageManagement.svelte';

	interface Props {
		data: {
			user: { role: string };
			settings: Record<string, unknown>;
			[key: string]: unknown;
		};
		isSubmitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
	}

	let { data, isSubmitting, onSubmittingChange, onMessage }: Props = $props();
</script>

<div class="card bg-base-100 border-base-200 border shadow-xl">
	<div class="card-body">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="card-title flex items-center gap-3 text-xl">
				<div class="bg-info/10 rounded-lg p-2">
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
							d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
						/>
					</svg>
				</div>
				System
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
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
				</svg>
				Systemeinstellungen
			</div>
		</div>

		<form
			method="POST"
			action="?/updateSystem"
			use:enhance={() => {
				onSubmittingChange(true);
				return async ({ result }) => {
					if (result.type === 'success') {
						await invalidateAll();
						onMessage(
							(result.data?.message as string) || 'System-Einstellungen erfolgreich gespeichert!',
							false
						);
					} else if (result.type === 'failure') {
						onMessage(
							(result.data?.message as string) || 'Fehler beim Speichern der System-Einstellungen',
							true
						);
					}
					onSubmittingChange(false);
				};
			}}
		>
			<div class="space-y-6">
				<!-- Wunsch-Sprachen Verwaltung (nur für Administratoren) -->
				{#if data.user.role === 'Administrator'}
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
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
							Wunsch-Sprachen
						</h3>
						<WishLanguageManagement />
					</div>
				{/if}

				<!-- API Access -->
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
								d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
						API-Zugang
					</h3>

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
										d="M9 12l2 2 4-4m5.018.118l2.008-2.018A3.3 3.3 0 0019 12M9 12a2.1 2.1 0 012.1-2.1"
									/>
								</svg>
								<div>
									<span class="label-text font-medium">API-Zugang aktivieren</span>
									<p class="text-base-content/70 text-sm">
										Externen Anwendungen Zugriff auf Ihre Daten gewähren
									</p>
								</div>
							</div>
							<input
								type="checkbox"
								name="apiAccess"
								class="toggle toggle-success"
								checked={data.settings.system.apiAccess}
							/>
						</label>
					</div>
				</div>

				<!-- Export Settings -->
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
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Export-Einstellungen
					</h3>

					<div class="form-control">
						<label class="label" for="exportFormat">
							<span class="label-text flex items-center gap-2 font-medium">
								Standard Export-Format
							</span>
						</label>
						<select
							id="exportFormat"
							name="exportFormat"
							class="select-bordered select select-lg w-full"
							value={data.settings.system.exportFormat}
						>
							<option value="json">JSON</option>
							<option value="csv">CSV</option>
							<option value="xlsx">Excel (XLSX)</option>
							<option value="pdf">PDF</option>
						</select>
					</div>
				</div>

				<!-- Backup Settings -->
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
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
							/>
						</svg>
						Backup & Datenschutz
					</h3>

					<div class="space-y-4">
						<div class="form-control">
							<label class="label" for="backupFrequency">
								<span class="label-text flex items-center gap-2 font-medium">
									Backup-Häufigkeit
								</span>
							</label>
							<select
								id="backupFrequency"
								name="backupFrequency"
								class="select-bordered select select-lg w-full"
								value={data.settings.system.backupFrequency}
							>
								<option value="none">Keine Backups</option>
								<option value="daily">Täglich</option>
								<option value="weekly">Wöchentlich</option>
								<option value="monthly">Monatlich</option>
							</select>
						</div>

						<div class="form-control">
							<label class="label" for="dataRetention">
								<span class="label-text flex items-center gap-2 font-medium">
									Datenaufbewahrung (Tage)
								</span>
							</label>
							<input
								id="dataRetention"
								name="dataRetention"
								type="number"
								min="30"
								max="3650"
								step="1"
								class="input-bordered input input-lg w-full"
								value={data.settings.system.dataRetention}
							/>
							<div class="label">
								<span class="label-text-alt text-info">
									Daten werden nach dieser Zeit automatisch gelöscht (30-3650 Tage)
								</span>
							</div>
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
						<span>System-Einstellungen können Auswirkungen auf die Performance haben</span>
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
							System-Einstellungen speichern
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
