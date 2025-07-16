<script lang="ts">
	import DashboardLayout from '$lib/components/layout/DashboardLayout.svelte';
	import type { LayoutData } from './$types';

	const { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
</script>

<DashboardLayout profile={data.profile}>
	{@render children()}
</DashboardLayout>
