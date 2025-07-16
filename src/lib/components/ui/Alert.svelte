<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		type = 'info',
		title,
		message,
		dismissible = false,
		icon,
		onDismiss
	}: {
		type?: 'info' | 'success' | 'warning' | 'error';
		title?: string;
		message: string;
		dismissible?: boolean;
		icon?: Snippet;
		onDismiss?: () => void;
	} = $props();

	const typeClasses = {
		info: 'alert-info',
		success: 'alert-success',
		warning: 'alert-warning',
		error: 'alert-error'
	};

	const defaultIcons = {
		info: () =>
			`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
		success: () =>
			`<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
		warning: () =>
			`<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
		error: () =>
			`<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
	};
</script>

<div class="alert {typeClasses[type]} shadow-lg">
	{#if icon}
		{@render icon()}
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html defaultIcons[type]()}
	{/if}

	<div>
		{#if title}
			<h3 class="font-bold">{title}</h3>
		{/if}
		<div class="text-sm">{message}</div>
	</div>

	{#if dismissible}
		<div class="flex-none">
			<button class="btn btn-ghost btn-sm" onclick={onDismiss} aria-label="Schließen">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/if}
</div>
