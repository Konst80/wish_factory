<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		href,
		buttonText,
		buttonVariant = 'primary',
		icon,
		disabled = false
	}: {
		title: string;
		description: string;
		href: string;
		buttonText: string;
		buttonVariant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
		icon?: Snippet;
		disabled?: boolean;
	} = $props();
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">
			{#if icon}
				{@render icon()}
			{/if}
			{title}
		</h2>
		<p class="text-base-content/80">{description}</p>
		<div class="card-actions justify-end">
			<a
				{href}
				class="btn btn-{buttonVariant} {disabled ? 'btn-disabled' : ''}"
				aria-disabled={disabled}
			>
				{buttonText}
			</a>
		</div>
	</div>
</div>
