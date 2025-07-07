<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		text,
		variant = 'neutral',
		size = 'md',
		outline = false,
		icon,
		dismissible = false,
		onDismiss
	}: {
		text: string;
		variant?:
			| 'primary'
			| 'secondary'
			| 'accent'
			| 'success'
			| 'warning'
			| 'error'
			| 'info'
			| 'neutral';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		outline?: boolean;
		icon?: Snippet;
		dismissible?: boolean;
		onDismiss?: () => void;
	} = $props();

	const sizeClasses = {
		xs: 'badge-xs',
		sm: 'badge-sm',
		md: '',
		lg: 'badge-lg'
	};
</script>

<div class="badge badge-{variant} {sizeClasses[size]} {outline ? 'badge-outline' : ''} gap-2">
	{#if icon}
		<span class="h-3 w-3">
			{@render icon()}
		</span>
	{/if}

	<span>{text}</span>

	{#if dismissible}
		<button
			class="btn btn-ghost btn-xs h-4 min-h-0 w-4 p-0"
			onclick={onDismiss}
			aria-label="Entfernen"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3 w-3"
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
	{/if}
</div>
