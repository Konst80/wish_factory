<script lang="ts">
	import type { Snippet } from 'svelte';

	interface TimelineItem {
		id: string;
		title: string;
		description?: string;
		timestamp: string;
		status?: 'pending' | 'active' | 'completed' | 'error';
		icon?: Snippet;
		content?: Snippet;
	}

	const {
		items,
		vertical = true
	}: {
		items: TimelineItem[];
		vertical?: boolean;
	} = $props();

	const statusClasses = {
		pending: 'step-neutral',
		active: 'step-primary',
		completed: 'step-success',
		error: 'step-error'
	};
</script>

<div class="timeline {vertical ? 'timeline-vertical' : 'timeline-horizontal'}">
	{#each items as item, index (item.id)}
		<div class="timeline-item">
			{#if index > 0}
				<hr class="timeline-line" />
			{/if}

			<div class="timeline-start mb-10 md:text-end">
				<time class="font-mono text-sm italic opacity-70">{item.timestamp}</time>
				<div class="text-lg font-black">{item.title}</div>
				{#if item.description}
					<p class="text-sm opacity-70">{item.description}</p>
				{/if}
				{#if item.content}
					<div class="mt-2">
						{@render item.content()}
					</div>
				{/if}
			</div>

			<div class="timeline-middle">
				<div class="timeline-marker {item.status ? statusClasses[item.status] : 'step-primary'}">
					{#if item.icon}
						{@render item.icon()}
					{:else}
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
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</div>
			</div>

			<hr class="timeline-line" />
		</div>
	{/each}
</div>
