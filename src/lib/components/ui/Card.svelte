<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		title,
		subtitle,
		actions,
		variant = 'default',
		shadow = 'xl',
		compact = false,
		bordered = false,
		image,
		children
	}: {
		title?: string;
		subtitle?: string;
		actions?: Snippet;
		variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'ghost';
		shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
		compact?: boolean;
		bordered?: boolean;
		image?: string;
		children: Snippet;
	} = $props();

	const variantClasses = {
		default: 'bg-base-100',
		primary: 'bg-primary text-primary-content',
		secondary: 'bg-secondary text-secondary-content',
		accent: 'bg-accent text-accent-content',
		ghost: 'bg-base-100/80 backdrop-blur-sm'
	};

	const shadowClasses = {
		sm: 'shadow-sm',
		md: 'shadow-md',
		lg: 'shadow-lg',
		xl: 'shadow-xl',
		'2xl': 'shadow-2xl',
		none: ''
	};
</script>

<div
	class="card {variantClasses[variant]} {shadowClasses[shadow]} {bordered
		? 'border-base-300 border'
		: ''} transition-all duration-300 hover:shadow-2xl"
>
	{#if image}
		<figure>
			<img src={image} alt={title || ''} class="w-full object-cover" />
		</figure>
	{/if}

	<div class="card-body {compact ? 'p-4' : ''}">
		{#if title || subtitle}
			<div class="card-title-section">
				{#if title}
					<h2 class="card-title">{title}</h2>
				{/if}
				{#if subtitle}
					<p class="text-base-content/70 text-sm">{subtitle}</p>
				{/if}
			</div>
		{/if}

		<div class="card-content">
			{@render children()}
		</div>

		{#if actions}
			<div class="card-actions mt-4 justify-end">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
