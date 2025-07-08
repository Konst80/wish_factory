<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, isAuthLoading, authError } from '$lib/stores/auth';

	let email = 'admin@example.com';
	let password = 'Konst';

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		const result = await auth.signIn(email, password);
		if (result && !result.error) {
			goto('/dashboard');
		}
	};
</script>

<svelte:head>
	<title>Login - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
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
						disabled={$isAuthLoading}
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
						disabled={$isAuthLoading}
					/>
				</div>

				{#if $authError}
					<div class="alert alert-error">
						<span>{$authError}</span>
					</div>
				{/if}

				<div class="form-control mt-6">
					<button type="submit" class="btn btn-primary" disabled={$isAuthLoading}>
						{#if $isAuthLoading}
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
