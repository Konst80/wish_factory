<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	onMount(() => {
		const form = document.getElementById('logout-form') as HTMLFormElement;
		if (form) {
			form.requestSubmit();
		}
	});
</script>

<svelte:head>
	<title>Abmelden - Wish Factory</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body text-center">
			<h1 class="card-title mb-6 text-2xl font-bold">Abmelden</h1>
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">Sie werden abgemeldet...</p>

			<form id="logout-form" method="POST" use:enhance class="hidden">
				<button type="submit">Abmelden</button>
			</form>
		</div>
	</div>
</div>
