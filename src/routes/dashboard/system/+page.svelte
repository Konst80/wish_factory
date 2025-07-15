<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Helper function to format bytes
	function formatBytes(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Helper function to format uptime
	function formatUptime(seconds: number) {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
		if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
		if (minutes > 0) return `${minutes}m ${secs}s`;
		return `${secs}s`;
	}

	// Helper function to get status badge class
	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'online':
				return 'badge-success';
			case 'offline':
				return 'badge-error';
			case 'warning':
				return 'badge-warning';
			default:
				return 'badge-neutral';
		}
	}

	// Calculate memory usage percentage
	function getMemoryUsagePercentage() {
		const { rss, heapTotal, heapUsed } = data.systemInfo.runtime.memory;
		const totalMemory = data.systemInfo.performance.totalMemory;
		return ((rss / totalMemory) * 100).toFixed(2);
	}

	// Auto-refresh every 30 seconds
	let refreshInterval: number;

	function startAutoRefresh() {
		refreshInterval = setInterval(() => {
			window.location.reload();
		}, 30000);
	}

	function stopAutoRefresh() {
		clearInterval(refreshInterval);
	}

	// Start auto-refresh on mount
	import { onMount } from 'svelte';
	onMount(() => {
		startAutoRefresh();
		return () => stopAutoRefresh();
	});
</script>

<svelte:head>
	<title>System Status - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="breadcrumbs text-sm">
		<ul>
			<li><a href="/" class="link link-hover">Home</a></li>
			<li><a href="/dashboard" class="link link-hover">Dashboard</a></li>
			<li>System Status</li>
		</ul>
	</div>

	<div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-4xl font-bold">System Status</h1>
			<p class="text-base-content/70 mt-2 text-lg">
				Detaillierte Systeminformationen und Debugging-Daten
			</p>
		</div>
		<div class="flex items-center gap-3">
			<button class="btn btn-outline btn-sm" onclick={() => window.location.reload()}>
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
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Aktualisieren
			</button>
			<div class="badge badge-info gap-2">
				<div class="bg-info h-2 w-2 animate-pulse rounded-full"></div>
				Auto-Refresh: 30s
			</div>
		</div>
	</div>
</div>

<!-- System Overview -->
<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
	<!-- Application Info -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
				Application
			</h2>
			<div class="space-y-2">
				<div class="text-sm">
					<span class="font-medium">Name:</span>
					<span class="float-right">{data.systemInfo.application.name}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Version:</span>
					<span class="float-right">{data.systemInfo.application.version}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Environment:</span>
					<span class="float-right">
						<div
							class="badge badge-sm {data.systemInfo.application.environment === 'production'
								? 'badge-success'
								: 'badge-warning'}"
						>
							{data.systemInfo.application.environment}
						</div>
					</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Uptime:</span>
					<span class="float-right">{formatUptime(data.systemInfo.application.uptime)}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Runtime Info -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-secondary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
					/>
				</svg>
				Runtime
			</h2>
			<div class="space-y-2">
				<div class="text-sm">
					<span class="font-medium">Node.js:</span>
					<span class="float-right">{data.systemInfo.runtime.nodeVersion}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Platform:</span>
					<span class="float-right">{data.systemInfo.runtime.platform}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Architecture:</span>
					<span class="float-right">{data.systemInfo.runtime.arch}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">PID:</span>
					<span class="float-right">{data.systemInfo.runtime.pid}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Memory Usage -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-accent">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
					/>
				</svg>
				Memory
			</h2>
			<div class="space-y-2">
				<div class="text-sm">
					<span class="font-medium">RSS:</span>
					<span class="float-right">{formatBytes(data.systemInfo.runtime.memory.rss)}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Heap Used:</span>
					<span class="float-right">{formatBytes(data.systemInfo.runtime.memory.heapUsed)}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Heap Total:</span>
					<span class="float-right">{formatBytes(data.systemInfo.runtime.memory.heapTotal)}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Usage:</span>
					<span class="float-right">{getMemoryUsagePercentage()}%</span>
				</div>
			</div>
		</div>
	</div>

	<!-- System Performance -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Performance
			</h2>
			<div class="space-y-2">
				<div class="text-sm">
					<span class="font-medium">Free Memory:</span>
					<span class="float-right">{formatBytes(data.systemInfo.performance.freeMemory)}</span>
				</div>
				<div class="text-sm">
					<span class="font-medium">Total Memory:</span>
					<span class="float-right">{formatBytes(data.systemInfo.performance.totalMemory)}</span>
				</div>
				{#if data.systemInfo.performance.loadAverage}
					<div class="text-sm">
						<span class="font-medium">Load Avg:</span>
						<span class="float-right">{data.systemInfo.performance.loadAverage[0].toFixed(2)}</span>
					</div>
				{/if}
				<div class="text-sm">
					<span class="font-medium">CPU Time:</span>
					<span class="float-right"
						>{(data.systemInfo.performance.cpuUsage.user / 1000).toFixed(2)}ms</span
					>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Services Status -->
<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
	{#each Object.entries(data.systemInfo.services) as [serviceName, serviceInfo]}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="card-title capitalize">{serviceName.replace('Service', ' Service')}</h2>
					<div class="badge {getStatusBadgeClass(serviceInfo.status)} gap-2">
						<div
							class="h-2 w-2 rounded-full {serviceInfo.status === 'online'
								? 'bg-success animate-pulse'
								: 'bg-error'}"
						></div>
						{serviceInfo.status}
					</div>
				</div>
				<div class="space-y-2">
					<div class="text-sm">
						<span class="font-medium">Last Checked:</span>
						<span class="float-right">{new Date(serviceInfo.lastChecked).toLocaleTimeString()}</span
						>
					</div>
					<div class="text-sm">
						<span class="font-medium">Response Time:</span>
						<span class="float-right">{serviceInfo.responseTime}ms</span>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Environment Variables -->
<div class="card bg-base-100 mb-8 shadow-xl">
	<div class="card-body">
		<h2 class="card-title mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			Environment Configuration
		</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each Object.entries(data.systemInfo.environment) as [key, value]}
				<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
					<span class="font-medium">{key}</span>
					<span
						class="text-sm {value && value.includes('[CONFIGURED]')
							? 'text-success'
							: value && value.includes('[NOT CONFIGURED]')
								? 'text-error'
								: ''}">{value || 'N/A'}</span
					>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Request Information -->
<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Request Information
		</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
				<span class="font-medium">Timestamp</span>
				<span class="text-sm">{new Date(data.systemInfo.request.timestamp).toLocaleString()}</span>
			</div>
			<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
				<span class="font-medium">Timezone</span>
				<span class="text-sm">{data.systemInfo.request.timezone}</span>
			</div>
			<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
				<span class="font-medium">User Agent</span>
				<span class="text-sm">{data.systemInfo.request.userAgent}</span>
			</div>
			<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
				<span class="font-medium">Build Date</span>
				<span class="text-sm"
					>{new Date(data.systemInfo.application.buildDate).toLocaleString()}</span
				>
			</div>
		</div>
	</div>
</div>
