<script lang="ts">
	import type { Snippet } from 'svelte';
	import Breadcrumb from './Breadcrumb.svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
		active?: boolean;
	}

	let {
		title,
		subtitle,
		breadcrumbs,
		actions
	}: {
		title: string;
		subtitle?: string;
		breadcrumbs?: BreadcrumbItem[];
		actions?: Snippet;
	} = $props();
</script>

<div class="mb-8">
	{#if breadcrumbs}
		<div class="mb-4">
			<Breadcrumb items={breadcrumbs} />
		</div>
	{/if}

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">
				{title}
			</h1>
			{#if subtitle}
				<p class="text-base-content/70 mt-2">
					{subtitle}
				</p>
			{/if}
		</div>

		{#if actions}
			<div class="flex gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
