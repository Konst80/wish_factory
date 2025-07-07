<script lang="ts">
	import type { Snippet } from 'svelte';
	import DashboardSidebar from './DashboardSidebar.svelte';
	import DashboardNavbar from './DashboardNavbar.svelte';

	let { children }: { children: Snippet } = $props();

	let sidebarOpen = $state(false);

	const toggleSidebar = () => {
		sidebarOpen = !sidebarOpen;
	};

	const closeSidebar = () => {
		sidebarOpen = false;
	};
</script>

<div class="drawer lg:drawer-open">
	<input id="drawer-toggle" type="checkbox" class="drawer-toggle" bind:checked={sidebarOpen} />

	<!-- Page content -->
	<div class="drawer-content flex flex-col">
		<!-- Mobile navbar -->
		<DashboardNavbar onMenuToggle={toggleSidebar} />

		<!-- Main content -->
		<main class="flex-1 p-4 lg:p-6">
			{@render children()}
		</main>
	</div>

	<!-- Sidebar -->
	<div class="drawer-side z-40">
		<label
			for="drawer-toggle"
			class="drawer-overlay"
			onclick={closeSidebar}
			onkeydown={(e) => e.key === 'Enter' && closeSidebar()}
		></label>
		<DashboardSidebar />
	</div>
</div>
