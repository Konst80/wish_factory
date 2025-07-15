<script lang="ts">
	interface Tab {
		id: string;
		label: string;
		icon: string;
	}

	interface Props {
		activeTab: string;
		tabs: Tab[];
		onTabChange: (tabId: string) => void;
	}

	let { activeTab, tabs, onTabChange }: Props = $props();
</script>

<div class="bg-base-100 border-base-200 mb-6 rounded-lg border p-2 shadow-sm">
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
		{#each tabs as tab}
			<button
				class="btn btn-ghost btn-sm flex items-center gap-2 px-3 py-2 text-sm {activeTab === tab.id
					? 'bg-primary/10 text-primary'
					: 'text-base-content/70 hover:text-base-content hover:bg-base-200'}"
				onclick={() => onTabChange(tab.id)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
				</svg>
				{tab.label}
			</button>
		{/each}
	</div>
</div>
