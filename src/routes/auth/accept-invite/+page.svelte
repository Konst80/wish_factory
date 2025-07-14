<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);

	const passwordsMatch = $derived(password === confirmPassword && password.length > 0);
	const passwordValid = $derived(password.length >= 6);
</script>

<svelte:head>
	<title>Einladung annehmen - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body">
			{#if data.invitation}
				<h1 class="card-title mb-6 text-center text-2xl font-bold">Willkommen bei Wish Factory!</h1>

				<div class="mb-6">
					<p class="text-base-content/70">
						Sie wurden als <span class="font-semibold">{data.invitation.role}</span> eingeladen.
					</p>
					<p class="text-base-content/70 mt-2">
						Bitte legen Sie ein Passwort für Ihren Account fest:
					</p>
				</div>

				<form
					method="POST"
					action="?/acceptInvite"
					use:enhance={() => {
						isLoading = true;
						return async ({ result }) => {
							isLoading = false;
							if (result.type === 'redirect') {
								goto(result.location);
							}
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="token" value={data.invitation.token} />

					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">E-Mail</span>
						</label>
						<input
							id="email"
							type="email"
							class="input-bordered input"
							value={data.invitation.email}
							disabled
						/>
					</div>

					<div class="form-control">
						<label class="label" for="fullName">
							<span class="label-text">Name</span>
						</label>
						<input
							id="fullName"
							type="text"
							class="input-bordered input"
							value={data.invitation.full_name}
							disabled
						/>
					</div>

					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text">Neues Passwort</span>
						</label>
						<input
							id="password"
							name="password"
							type="password"
							class="input-bordered input"
							bind:value={password}
							required
							disabled={isLoading}
							minlength="6"
						/>
						{#if password && !passwordValid}
							<label class="label">
								<span class="label-text-alt text-error"
									>Passwort muss mindestens 6 Zeichen lang sein</span
								>
							</label>
						{/if}
					</div>

					<div class="form-control">
						<label class="label" for="confirmPassword">
							<span class="label-text">Passwort bestätigen</span>
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							class="input-bordered input"
							bind:value={confirmPassword}
							required
							disabled={isLoading}
						/>
						{#if confirmPassword && !passwordsMatch}
							<label class="label">
								<span class="label-text-alt text-error">Passwörter stimmen nicht überein</span>
							</label>
						{/if}
					</div>

					{#if form?.error}
						<div class="alert alert-error">
							<span>{form.error}</span>
						</div>
					{/if}

					<div class="form-control mt-6">
						<button
							type="submit"
							class="btn btn-primary"
							disabled={isLoading || !passwordsMatch || !passwordValid}
						>
							{#if isLoading}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								Account erstellen
							{/if}
						</button>
					</div>
				</form>
			{:else if data.error}
				<h1 class="card-title mb-6 text-center text-2xl font-bold">Ungültige Einladung</h1>

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
					<span>{data.error}</span>
				</div>

				<div class="mt-6 text-center">
					<a href="/auth/login" class="link link-primary">Zur Anmeldung</a>
				</div>
			{/if}
		</div>
	</div>
</div>
