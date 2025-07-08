<script lang="ts">
	import { signUpWithEmail } from '$lib/auth';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let fullName = '';
	let loading = false;
	let error = '';
	let success = false;

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		loading = true;
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwörter stimmen nicht überein';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Passwort muss mindestens 6 Zeichen haben';
			loading = false;
			return;
		}

		try {
			const result = await signUpWithEmail(email, password, fullName);
			if (result.error) {
				error = result.error.message;
			} else {
				success = true;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Registrierung - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-center text-2xl font-bold">Registrierung</h1>

			{#if success}
				<div class="alert alert-success">
					<span
						>Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach zur Bestätigung.</span
					>
				</div>
				<div class="mt-4 text-center">
					<a href="/auth/login" class="btn btn-primary"> Zur Anmeldung </a>
				</div>
			{:else}
				<form on:submit={handleSubmit} class="space-y-4">
					<div class="form-control">
						<label class="label" for="fullName">
							<span class="label-text">Vollständiger Name</span>
						</label>
						<input
							id="fullName"
							type="text"
							class="input-bordered input"
							bind:value={fullName}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">E-Mail</span>
						</label>
						<input
							id="email"
							type="email"
							class="input-bordered input"
							bind:value={email}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text">Passwort</span>
						</label>
						<input
							id="password"
							type="password"
							class="input-bordered input"
							bind:value={password}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="confirmPassword">
							<span class="label-text">Passwort bestätigen</span>
						</label>
						<input
							id="confirmPassword"
							type="password"
							class="input-bordered input"
							bind:value={confirmPassword}
							required
							disabled={loading}
						/>
					</div>

					{#if error}
						<div class="alert alert-error">
							<span>{error}</span>
						</div>
					{/if}

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								Registrieren
							{/if}
						</button>
					</div>
				</form>

				<div class="divider">ODER</div>

				<div class="text-center">
					<a href="/auth/login" class="link link-primary"> Bereits einen Account? Anmelden </a>
				</div>
			{/if}
		</div>
	</div>
</div>
