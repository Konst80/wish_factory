<script lang="ts">
	import { page } from '$app/stores';
	import SimilarityCronControl from '$lib/components/admin/SimilarityCronControl.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const breadcrumbs = [
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Admin', href: '/dashboard/admin' }
	];
</script>

<svelte:head>
	<title>Admin Dashboard - Wish Factory</title>
	<meta
		name="description"
		content="Administrative controls and system monitoring for Wish Factory"
	/>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="breadcrumbs text-sm">
			<ul>
				{#each breadcrumbs as breadcrumb}
					<li>
						<a href={breadcrumb.href} class="link link-hover">
							{breadcrumb.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<h1 class="text-base-content mb-2 text-3xl font-bold">Admin Dashboard</h1>
		<p class="text-base-content/70">System administration and monitoring controls</p>
	</div>

	<!-- Admin Cards Grid -->
	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<!-- Similarity Cron Control -->
		<div class="xl:col-span-2">
			<SimilarityCronControl
				isEnabled={data.similarityCron.isEnabled}
				orphanedWishes={data.similarityCron.orphanedWishes}
				lastExecution={data.similarityCron.lastExecution}
				githubActionsConfigured={data.similarityCron.githubActionsConfigured}
				stats={data.similarityCron.stats}
			/>
		</div>

		<!-- System Overview -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-success h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					System Overview
				</h2>

				<div class="stats stats-vertical">
					<div class="stat">
						<div class="stat-title">Total Wishes</div>
						<div class="stat-value text-2xl">{data.similarityCron.stats.totalWishes}</div>
						<div class="stat-desc">Published and active</div>
					</div>

					<div class="stat">
						<div class="stat-title">Similarity Coverage</div>
						<div
							class="stat-value text-2xl {data.similarityCron.stats.successRate >= 95
								? 'text-success'
								: data.similarityCron.stats.successRate >= 90
									? 'text-warning'
									: 'text-error'}"
						>
							{data.similarityCron.stats.successRate.toFixed(1)}%
						</div>
						<div class="stat-desc">
							{data.similarityCron.stats.withSimilarities} of {data.similarityCron.stats
								.totalWishes} wishes
						</div>
					</div>

					<div class="stat">
						<div class="stat-title">System Health</div>
						<div
							class="stat-value text-sm {data.similarityCron.orphanedWishes === 0
								? 'text-success'
								: 'text-warning'}"
						>
							{data.similarityCron.orphanedWishes === 0 ? 'Excellent' : 'Needs Attention'}
						</div>
						<div class="stat-desc">
							{data.similarityCron.orphanedWishes} wishes need processing
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-info h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Quick Actions
				</h2>

				<div class="space-y-3">
					<a href="/dashboard/wishes" class="btn btn-outline btn-block justify-start">
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
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							/>
						</svg>
						Manage Wishes
					</a>

					<a href="/dashboard/users" class="btn btn-outline btn-block justify-start">
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
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
						Manage Users
					</a>

					<a href="/dashboard/settings" class="btn btn-outline btn-block justify-start">
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
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						System Settings
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Documentation Links -->
	<div class="mt-8">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-secondary h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Documentation & Help
				</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<a
						href="/docs/similarity-caching"
						class="card card-compact bg-base-200 hover:bg-base-300 transition-colors"
					>
						<div class="card-body">
							<h3 class="card-title text-base">Similarity Caching</h3>
							<p class="text-base-content/70 text-sm">
								Complete guide to the similarity caching system
							</p>
						</div>
					</a>

					<a
						href="/docs/github-actions"
						class="card card-compact bg-base-200 hover:bg-base-300 transition-colors"
					>
						<div class="card-body">
							<h3 class="card-title text-base">GitHub Actions</h3>
							<p class="text-base-content/70 text-sm">
								Setup automated cron jobs with GitHub Actions
							</p>
						</div>
					</a>

					<a
						href="/docs/troubleshooting"
						class="card card-compact bg-base-200 hover:bg-base-300 transition-colors"
					>
						<div class="card-body">
							<h3 class="card-title text-base">Troubleshooting</h3>
							<p class="text-base-content/70 text-sm">Common issues and solutions</p>
						</div>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
