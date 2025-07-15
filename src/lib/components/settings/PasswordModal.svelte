<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		showModal: boolean;
		isSubmitting: boolean;
		onClose: () => void;
		onSubmittingChange: (submitting: boolean) => void;
		onMessage: (message: string, isError?: boolean) => void;
	}

	let { showModal, isSubmitting, onClose, onSubmittingChange, onMessage }: Props = $props();
</script>

{#if showModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Passwort ändern</h3>

			<form
				method="POST"
				action="?/changePassword"
				class="py-4"
				use:enhance={() => {
					onSubmittingChange(true);
					return async ({ result }) => {
						if (result.type === 'success') {
							onMessage('Passwort erfolgreich geändert!', false);
							onClose();
						} else if (result.type === 'failure') {
							onMessage(
								(result.data?.message as string) || 'Fehler beim Ändern des Passworts',
								true
							);
						}
						onSubmittingChange(false);
					};
				}}
			>
				<div class="space-y-4">
					<div class="form-control">
						<label class="label" for="currentPassword">
							<span class="label-text">Aktuelles Passwort</span>
						</label>
						<input
							id="currentPassword"
							name="currentPassword"
							type="password"
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
							name="newPassword"
							type="password"
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
							name="confirmPassword"
							type="password"
							class="input-bordered input w-full"
							required
						/>
					</div>
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={onClose}>Abbrechen</button>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
							Ändern...
						{:else}
							Passwort ändern
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
