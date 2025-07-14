<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, isAuthLoading, authError } from '$lib/stores/auth';

	let email = $state('admin@example.com');
	let password = $state('Konst');

	const justRegistered = $derived($page.url.searchParams.get('registered') === 'true');

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

			{#if justRegistered}
				<div class="alert alert-success mb-4">
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
					<span>Account erfolgreich erstellt! Sie können sich jetzt anmelden.</span>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
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

			<div class="mt-6 text-center">
				<a href="/auth/forgot-password" class="link link-secondary text-sm">
					Passwort vergessen?
				</a>
			</div>
		</div>
	</div>
</div>
