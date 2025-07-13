<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	onMount(() => {
		// Check if we have a code in the URL (from email link)
		const code = $page.url.searchParams.get('code');
		if (!code) {
			// No code means this wasn't accessed via email link
			goto('/auth/login');
		}
	});

	async function handleResetPassword() {
		if (newPassword !== confirmPassword) {
			error = 'Passwörter stimmen nicht überein';
			return;
		}

		if (newPassword.length < 8) {
			error = 'Passwort muss mindestens 8 Zeichen lang sein';
			return;
		}

		loading = true;
		error = '';

		try {
			if (!supabase) {
				error = 'Supabase nicht verfügbar';
				return;
			}

			const { error: resetError } = await supabase!.auth.updateUser({
				password: newPassword
			});

			if (resetError) {
				error = resetError.message;
			} else {
				success = true;
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			}
		} catch {
			error = 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Passwort zurücksetzen - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-2xl font-bold">Neues Passwort setzen</h1>

			{#if success}
				<div class="alert alert-success">
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
					<span>Passwort erfolgreich geändert! Weiterleitung zum Dashboard...</span>
				</div>
			{:else}
				<form onsubmit={handleResetPassword} class="space-y-4">
					<div class="form-control">
						<label class="label">
							<span class="label-text">Neues Passwort</span>
						</label>
						<input
							type="password"
							placeholder="Mindestens 8 Zeichen"
							class="input input-bordered"
							bind:value={newPassword}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Passwort bestätigen</span>
						</label>
						<input
							type="password"
							placeholder="Passwort wiederholen"
							class="input input-bordered"
							bind:value={confirmPassword}
							required
							disabled={loading}
						/>
					</div>

					{#if error}
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
							<span>{error}</span>
						</div>
					{/if}

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-spinner loading-sm"></span>
								Speichern...
							{:else}
								Passwort ändern
							{/if}
						</button>
					</div>
				</form>

				<div class="divider"></div>

				<div class="text-center">
					<a href="/auth/login" class="link link-primary">Zurück zur Anmeldung</a>
				</div>
			{/if}
		</div>
	</div>
</div>
