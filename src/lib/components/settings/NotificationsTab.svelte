<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SettingsData } from '$lib/types/Settings';

	interface Props {
		data: SettingsData;
		isSubmitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
	}

	const { data, isSubmitting, onSubmittingChange, onMessage }: Props = $props();
</script>

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
				onSubmittingChange(true);
				return async ({ result }) => {
					if (result.type === 'success') {
						await invalidateAll();
						onMessage(
							(result.data?.message as string) || 'Benachrichtigungen erfolgreich gespeichert!',
							false
						);
					} else if (result.type === 'failure') {
						onMessage(
							(result.data?.message as string) || 'Fehler beim Speichern der Benachrichtigungen',
							true
						);
					}
					onSubmittingChange(false);
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
									checked={data.settings.notifications?.emailNotifications || false}
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
									checked={data.settings.notifications?.pushNotifications || false}
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
									checked={data.settings.notifications?.newWishAlerts || false}
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
									checked={data.settings.notifications?.approvalRequests || false}
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
									checked={data.settings.notifications?.systemUpdates || false}
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
									checked={data.settings.notifications?.weeklyReport || false}
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
