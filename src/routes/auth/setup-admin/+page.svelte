<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let currentStep = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	// Step 1: Preset Password
	let presetPassword = $state('');

	// Step 2: Admin Details
	let adminEmail = $state('');
	let adminFullName = $state('');
	let adminPassword = $state('');
	let adminPasswordConfirm = $state('');

	// Check if setup is still needed
	onMount(async () => {
		try {
			const response = await fetch('/api/system/init-status');
			const data = await response.json();
			
			if (data.status === 'success' && !data.data.requiresSetup) {
				// System already initialized, redirect to login
				goto('/auth/login?message=already_initialized');
			}
		} catch (err) {
			console.error('Error checking initialization status:', err);
			error = 'Failed to check system status';
		}
	});

	const handlePresetPasswordSubmit = async (e: Event) => {
		e.preventDefault();
		error = '';
		
		if (!presetPassword) {
			error = 'Please enter the setup password';
			return;
		}

		// Simple validation - the actual validation happens on the server
		if (presetPassword.length < 8) {
			error = 'Invalid setup password';
			return;
		}

		currentStep = 2;
	};

	const handleAdminSetup = async (e: Event) => {
		e.preventDefault();
		error = '';
		success = '';

		// Validate inputs
		if (!adminEmail || !adminFullName || !adminPassword || !adminPasswordConfirm) {
			error = 'Please fill in all fields';
			return;
		}

		if (adminPassword !== adminPasswordConfirm) {
			error = 'Passwords do not match';
			return;
		}

		if (adminPassword.length < 8) {
			error = 'Password must be at least 8 characters long';
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(adminEmail)) {
			error = 'Please enter a valid email address';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/system/setup-admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					presetPassword,
					adminEmail,
					adminFullName,
					adminPassword
				})
			});

			const data = await response.json();

			if (data.status === 'success') {
				success = 'Admin user created successfully! Please check your email for verification.';
				
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/auth/login?message=admin_created');
				}, 3000);
			} else {
				error = data.message || 'Failed to create admin user';
			}
		} catch (err) {
			console.error('Error creating admin:', err);
			error = 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	};

	const goBackToStep1 = () => {
		currentStep = 1;
		error = '';
	};
</script>

<svelte:head>
	<title>Admin Setup - Wish Factory</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-center text-2xl font-bold">
				🔧 System Setup
			</h1>

			<!-- Progress Steps -->
			<div class="steps steps-horizontal mb-6">
				<div class="step {currentStep >= 1 ? 'step-primary' : ''}">Setup Password</div>
				<div class="step {currentStep >= 2 ? 'step-primary' : ''}">Admin Details</div>
			</div>

			{#if error}
				<div class="alert alert-error mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div class="alert alert-success mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{success}</span>
				</div>
			{/if}

			{#if currentStep === 1}
				<!-- Step 1: Preset Password -->
				<div class="alert alert-info mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<div>
						<div class="font-bold">First-time Setup</div>
						<div class="text-sm">Enter the preset password to create the first admin user.</div>
					</div>
				</div>

				<form onsubmit={handlePresetPasswordSubmit} class="space-y-4">
					<div class="form-control">
						<label class="label" for="presetPassword">
							<span class="label-text">Setup Password</span>
						</label>
						<input
							id="presetPassword"
							type="password"
							class="input-bordered input"
							bind:value={presetPassword}
							placeholder="Enter the preset setup password"
							required
							disabled={isLoading}
						/>
						<div class="label">
							<span class="label-text-alt">This password was provided during deployment</span>
						</div>
					</div>

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={isLoading}>
							{#if isLoading}
								<span class="loading loading-spinner loading-sm"></span>
								Verifying...
							{:else}
								Continue
							{/if}
						</button>
					</div>
				</form>
			{:else if currentStep === 2}
				<!-- Step 2: Admin Details -->
				<div class="alert alert-success mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<div class="font-bold">Setup Password Verified</div>
						<div class="text-sm">Now create your admin account.</div>
					</div>
				</div>

				<form onsubmit={handleAdminSetup} class="space-y-4">
					<div class="form-control">
						<label class="label" for="adminFullName">
							<span class="label-text">Full Name</span>
						</label>
						<input
							id="adminFullName"
							type="text"
							class="input-bordered input"
							bind:value={adminFullName}
							placeholder="Enter your full name"
							required
							disabled={isLoading}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="adminEmail">
							<span class="label-text">Email Address</span>
						</label>
						<input
							id="adminEmail"
							type="email"
							class="input-bordered input"
							bind:value={adminEmail}
							placeholder="Enter your email address"
							required
							disabled={isLoading}
						/>
						<div class="label">
							<span class="label-text-alt">You'll receive a verification email</span>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="adminPassword">
							<span class="label-text">Password</span>
						</label>
						<input
							id="adminPassword"
							type="password"
							class="input-bordered input"
							bind:value={adminPassword}
							placeholder="Enter your password"
							required
							minlength="8"
							disabled={isLoading}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="adminPasswordConfirm">
							<span class="label-text">Confirm Password</span>
						</label>
						<input
							id="adminPasswordConfirm"
							type="password"
							class="input-bordered input"
							bind:value={adminPasswordConfirm}
							placeholder="Confirm your password"
							required
							minlength="8"
							disabled={isLoading}
						/>
					</div>

					<div class="form-control mt-6 space-y-2">
						<button type="submit" class="btn btn-primary" disabled={isLoading}>
							{#if isLoading}
								<span class="loading loading-spinner loading-sm"></span>
								Creating Admin...
							{:else}
								Create Admin User
							{/if}
						</button>
						
						<button type="button" class="btn btn-ghost" onclick={goBackToStep1} disabled={isLoading}>
							Back
						</button>
					</div>
				</form>
			{/if}

			<!-- Security Notice -->
			<div class="mt-6 rounded-lg bg-base-200 p-4">
				<div class="flex items-center gap-2 text-sm">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
					</svg>
					<span class="font-medium">Security Notice</span>
				</div>
				<p class="mt-2 text-sm opacity-70">
					This setup process can only be completed once. After creating the admin user, this page will no longer be accessible.
				</p>
			</div>
		</div>
	</div>
</div>