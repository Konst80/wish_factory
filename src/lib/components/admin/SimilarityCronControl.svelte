<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';

	type Props = {
		isEnabled: boolean;
		lastExecution: string | null;
		orphanedWishes: number;
		githubActionsConfigured: boolean;
		stats: {
			totalWishes: number;
			withSimilarities: number;
			withoutSimilarities: number;
			successRate: number;
		};
	};

	let { isEnabled, lastExecution, orphanedWishes, githubActionsConfigured, stats }: Props =
		$props();

	// Local state
	let isRunning = $state(false);
	let showLogs = $state(false);
	let logs = $state<string[]>([]);
	let showGithubSetup = $state(false);
	let executionResult = $state<any>(null);
	let errorMessage = $state<string | null>(null);

	// Auto-refresh orphaned wishes count
	let refreshInterval: NodeJS.Timeout | null = null;

	onMount(() => {
		if (browser) {
			refreshInterval = setInterval(async () => {
				if (!isRunning) {
					await refreshStats();
				}
			}, 30000); // Refresh every 30 seconds
		}

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function refreshStats() {
		try {
			const response = await fetch('/api/admin/similarity-stats');
			if (response.ok) {
				const data = await response.json();
				orphanedWishes = data.orphanedWishes;
				stats = data.stats;
			}
		} catch (error) {
			console.error('Failed to refresh stats:', error);
		}
	}

	async function runManualCron() {
		isRunning = true;
		errorMessage = null;
		logs = [];
		executionResult = null;

		try {
			addLog('🔄 Starting manual similarity cron job...');

			const response = await fetch('/api/admin/similarity-cron', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					source: 'manual-admin',
					timestamp: new Date().toISOString()
				})
			});

			const result = await response.json();

			if (response.ok) {
				addLog('✅ Cron job completed successfully');
				addLog(`📊 Processed: ${result.processed} wishes`);
				addLog(`❌ Errors: ${result.errors} wishes`);
				addLog(`⏱️ Duration: ${result.duration}ms`);

				executionResult = result;
				await refreshStats();
			} else {
				throw new Error(result.error || 'Unknown error');
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			addLog(`❌ Error: ${errorMsg}`);
			errorMessage = errorMsg;
		} finally {
			isRunning = false;
			await invalidateAll();
		}
	}

	function addLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		logs = [...logs, `[${timestamp}] ${message}`];
	}

	function getStatusColor(orphanedCount: number) {
		if (orphanedCount === 0) return 'text-success';
		if (orphanedCount < 10) return 'text-warning';
		return 'text-error';
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
	}

	function getSuccessRateColor(rate: number) {
		if (rate >= 95) return 'text-success';
		if (rate >= 90) return 'text-warning';
		return 'text-error';
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="text-primary h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Similarity Cron Job Control
		</h2>

		<!-- Status Overview -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Status</div>
				<div class="stat-value text-sm {isEnabled ? 'text-success' : 'text-warning'}">
					{isEnabled ? 'Enabled' : 'Disabled'}
				</div>
				<div class="stat-desc">
					{isEnabled ? 'Auto-processing enabled' : 'Manual mode only'}
				</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Orphaned Wishes</div>
				<div class="stat-value text-sm {getStatusColor(orphanedWishes)}">
					{orphanedWishes}
				</div>
				<div class="stat-desc">
					{orphanedWishes === 0 ? 'All up to date' : 'Need processing'}
				</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Success Rate</div>
				<div class="stat-value text-sm {getSuccessRateColor(stats.successRate)}">
					{stats.successRate.toFixed(1)}%
				</div>
				<div class="stat-desc">
					{stats.withSimilarities}/{stats.totalWishes} wishes
				</div>
			</div>

			<div class="stat bg-base-200 rounded-lg">
				<div class="stat-title">Last Execution</div>
				<div class="stat-value text-xs">
					{formatDate(lastExecution)}
				</div>
				<div class="stat-desc">
					{lastExecution ? 'Completed' : 'Never run'}
				</div>
			</div>
		</div>

		<!-- Control Buttons -->
		<div class="mb-4 flex flex-wrap gap-3">
			<button class="btn btn-primary gap-2" onclick={runManualCron} disabled={isRunning}>
				{#if isRunning}
					<span class="loading loading-spinner loading-sm"></span>
					Running...
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
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Run Manual Cron
				{/if}
			</button>

			<button class="btn btn-outline gap-2" onclick={() => refreshStats()} disabled={isRunning}>
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
				Refresh Stats
			</button>

			<button class="btn btn-ghost gap-2" onclick={() => (showLogs = !showLogs)}>
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
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				{showLogs ? 'Hide Logs' : 'Show Logs'}
			</button>

			<button class="btn btn-info gap-2" onclick={() => (showGithubSetup = !showGithubSetup)}>
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
				GitHub Actions Setup
			</button>
		</div>

		<!-- Execution Result -->
		{#if executionResult}
			<div class="alert alert-success mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Execution Completed Successfully!</h3>
					<div class="text-xs">
						Processed {executionResult.processed} wishes in {executionResult.duration}ms
						{executionResult.errors > 0 ? ` with ${executionResult.errors} errors` : ''}
					</div>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="alert alert-error mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Execution Failed</h3>
					<div class="text-xs">{errorMessage}</div>
				</div>
			</div>
		{/if}

		<!-- Logs -->
		{#if showLogs}
			<div class="mockup-code bg-base-300 mb-4">
				<div class="bg-base-200 flex items-center justify-between px-4 py-2">
					<span class="text-sm font-semibold">Execution Logs</span>
					<button class="btn btn-ghost btn-xs" onclick={() => (logs = [])}> Clear </button>
				</div>
				<div class="max-h-64 overflow-y-auto p-4">
					{#if logs.length === 0}
						<div class="text-base-content/50 italic">
							No logs yet. Run the cron job to see output.
						</div>
					{:else}
						{#each logs as log (log.id || log.timestamp)}
							<div class="py-1 font-mono text-sm">{log}</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- GitHub Actions Setup -->
		{#if showGithubSetup}
			<div class="bg-base-200 mb-4 rounded-lg p-4">
				<h3 class="mb-3 flex items-center gap-2 font-semibold">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
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
					GitHub Actions Automation Setup
				</h3>

				<div class="space-y-4">
					<!-- Status -->
					<div class="flex items-center gap-2">
						<div class="badge {githubActionsConfigured ? 'badge-success' : 'badge-warning'}">
							{githubActionsConfigured ? 'Configured' : 'Not Configured'}
						</div>
						<span class="text-sm">
							{githubActionsConfigured
								? 'GitHub Actions workflow is ready to use'
								: 'GitHub Actions workflow needs configuration'}
						</span>
					</div>

					<!-- Instructions -->
					<div class="steps steps-vertical lg:steps-horizontal">
						<div class="step {githubActionsConfigured ? 'step-primary' : ''}">
							<div class="text-left">
								<div class="font-semibold">1. Configure Secrets</div>
								<div class="text-base-content/70 text-xs">
									Set CRON_SECRET and CLOUDFLARE_PAGES_URL in GitHub
								</div>
							</div>
						</div>
						<div class="step {githubActionsConfigured ? 'step-primary' : ''}">
							<div class="text-left">
								<div class="font-semibold">2. Enable Workflow</div>
								<div class="text-base-content/70 text-xs">
									Activate the similarity-cron.yml workflow
								</div>
							</div>
						</div>
						<div class="step {githubActionsConfigured ? 'step-primary' : ''}">
							<div class="text-left">
								<div class="font-semibold">3. Test & Monitor</div>
								<div class="text-base-content/70 text-xs">Run manually and check logs</div>
							</div>
						</div>
					</div>

					<!-- Setup Commands -->
					<div class="mockup-code text-sm">
						<pre><code
								># 1. Configure GitHub Secrets
gh secret set CRON_SECRET --body "your-super-secret-key"
gh secret set CLOUDFLARE_PAGES_URL --body "https://your-app.pages.dev"

# 2. Test the workflow
gh workflow run similarity-cron.yml

# 3. Monitor execution
gh run list --workflow=similarity-cron.yml
gh run view --log</code
							></pre>
					</div>

					<!-- Current Endpoint -->
					<div class="alert alert-info">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 shrink-0 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div>
							<h4 class="font-bold">Webhook Endpoint</h4>
							<div class="text-xs">
								GitHub Actions will call: <code>/api/admin/similarity-cron</code>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Recommendations -->
		<div class="bg-base-200 rounded-lg p-4">
			<h3 class="mb-2 font-semibold">💡 Recommendations</h3>
			<ul class="space-y-1 text-sm">
				{#if orphanedWishes === 0}
					<li class="text-success">✅ All wishes have similarities - system is healthy</li>
				{:else if orphanedWishes < 10}
					<li class="text-warning">
						⚠️ {orphanedWishes} wishes need processing - consider running manual cron
					</li>
				{:else}
					<li class="text-error">
						❌ {orphanedWishes} wishes need processing - run manual cron immediately
					</li>
				{/if}

				{#if stats.successRate < 90}
					<li class="text-warning">
						⚠️ Low success rate ({stats.successRate}%) - investigate hook failures
					</li>
				{/if}

				{#if !githubActionsConfigured}
					<li class="text-info">💡 Set up GitHub Actions for automatic daily processing</li>
				{/if}

				{#if !isEnabled}
					<li class="text-info">💡 Enable cron job processing in user settings</li>
				{/if}
			</ul>
		</div>
	</div>
</div>
