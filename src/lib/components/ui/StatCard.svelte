<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		value,
		description,
		trend,
		trendValue,
		icon,
		color = 'primary'
	}: {
		title: string;
		value: string | number;
		description?: string;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
		icon?: Snippet;
		color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
	} = $props();

	const colorClasses = {
		primary: 'text-primary',
		secondary: 'text-secondary',
		accent: 'text-accent',
		success: 'text-success',
		warning: 'text-warning',
		error: 'text-error'
	};

	const trendClasses = {
		up: 'text-success',
		down: 'text-error',
		neutral: 'text-base-content/70'
	};
</script>

<div class="stat rounded-lg bg-base-100 shadow">
	{#if icon}
		<div class="stat-figure {colorClasses[color]}">
			{@render icon()}
		</div>
	{/if}

	<div class="stat-title">{title}</div>
	<div class="stat-value {colorClasses[color]}">{value}</div>

	{#if description}
		<div class="stat-desc">
			{description}
			{#if trend && trendValue}
				<span class={trendClasses[trend]}>
					{#if trend === 'up'}↗︎{:else if trend === 'down'}↘︎{:else}→{/if}
					{trendValue}
				</span>
			{/if}
		</div>
	{/if}
</div>
