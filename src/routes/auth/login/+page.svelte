<script lang="ts">
	import { goto } from '$app/navigation';
	import { signInWithEmail } from '$lib/auth';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const result = await signInWithEmail(email, password);
			if (result.error) {
				error = result.error.message;
			} else {
				goto('/dashboard');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Login - Wish Factory</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-center text-2xl font-bold">Wish Factory</h1>

			<form on:submit={handleSubmit} class="space-y-4">
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
							Anmelden
						{/if}
					</button>
				</div>
			</form>

			<div class="divider">ODER</div>

			<div class="text-center">
				<a href="/auth/register" class="link link-primary"> Neuen Account erstellen </a>
			</div>

			<div class="mt-2 text-center">
				<a href="/auth/forgot-password" class="link link-secondary text-sm">
					Passwort vergessen?
				</a>
			</div>
		</div>
	</div>
</div>
