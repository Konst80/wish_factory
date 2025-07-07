<script lang="ts">
	interface BreadcrumbItem {
		label: string;
		href?: string;
		active?: boolean;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<div class="breadcrumbs text-sm">
	<ul>
		{#each items as item (item.label)}
			<li>
				{#if item.href && !item.active}
					<a href={item.href} class="link link-hover">
						{item.label}
					</a>
				{:else}
					<span class={item.active ? 'font-semibold' : ''}>
						{item.label}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>
