<script lang="ts">
	import DashboardLayout from '$lib/components/layout/DashboardLayout.svelte';

	let { children } = $props();
</script>

<DashboardLayout>
	{@render children()}
</DashboardLayout>
