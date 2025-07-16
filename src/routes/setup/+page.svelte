<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let email = $state('admin@example.com');
	let password = $state('Konst');
	let fullName = $state('Administrator');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			if (!supabase) {
				throw new Error('Supabase client not available');
			}

			// Sign up the user
			const { data, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
						role: 'Administrator'
					}
				}
			});

			if (signUpError) {
				throw signUpError;
			}

			if (data.user) {
				// Create profile
				const { error: profileError } = await supabase.from('profiles').insert({
					id: data.user.id,
					email,
					full_name: fullName,
					role: 'Administrator'
				});

				if (profileError) {
					console.error('Profile creation error:', profileError);
				}

				success = true;
				setTimeout(() => {
					goto('/auth/login');
				}, 2000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Setup Admin User - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-center text-2xl font-bold">Admin Setup</h1>

			{#if success}
				<div class="alert alert-success">
					<span>✅ Admin user created successfully! Redirecting to login...</span>
				</div>
			{:else}
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

					{#if error}
						<div class="alert alert-error">
							<span>{error}</span>
						</div>
					{/if}

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-spinner loading-sm"></span>
								Creating Admin...
							{:else}
								Create Admin User
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
