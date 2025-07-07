<script lang="ts">
	// Mock analytics data
	const analyticsData = {
		overview: {
			totalWishes: 156,
			totalUsers: 12,
			totalPublished: 142,
			averageRating: 4.7
		},
		wishesOverTime: [
			{ month: 'Jan', count: 8 },
			{ month: 'Feb', count: 12 },
			{ month: 'Mar', count: 15 },
			{ month: 'Apr', count: 20 },
			{ month: 'Mai', count: 25 },
			{ month: 'Jun', count: 30 },
			{ month: 'Jul', count: 35 }
		],
		userActivity: [
			{ user: 'Max Mustermann', wishes: 45, published: 42 },
			{ user: 'Anna Schmidt', wishes: 38, published: 35 },
			{ user: 'Peter Müller', wishes: 32, published: 28 },
			{ user: 'Lisa Weber', wishes: 25, published: 22 },
			{ user: 'Tom Klein', wishes: 16, published: 15 }
		],
		categoryDistribution: [
			{ category: 'Geburtstag', count: 68, percentage: 43.6 },
			{ category: 'Jubiläum', count: 52, percentage: 33.3 },
			{ category: 'Individuell', count: 36, percentage: 23.1 }
		],
		languageDistribution: [
			{ language: 'Deutsch', count: 124, percentage: 79.5 },
			{ language: 'English', count: 32, percentage: 20.5 }
		],
		statusDistribution: [
			{ status: 'Freigegeben', count: 89, percentage: 57.1 },
			{ status: 'Zur Freigabe', count: 35, percentage: 22.4 },
			{ status: 'Entwurf', count: 24, percentage: 15.4 },
			{ status: 'Archiviert', count: 8, percentage: 5.1 }
		]
	};

	let selectedTimeRange = $state('last-7-days');
	let selectedMetric = $state('wishes');

	const timeRanges = [
		{ value: 'last-7-days', label: 'Letzte 7 Tage' },
		{ value: 'last-30-days', label: 'Letzte 30 Tage' },
		{ value: 'last-3-months', label: 'Letzte 3 Monate' },
		{ value: 'last-year', label: 'Letztes Jahr' }
	];

	const metrics = [
		{ value: 'wishes', label: 'Wünsche' },
		{ value: 'users', label: 'Benutzer' },
		{ value: 'published', label: 'Veröffentlicht' }
	];

	const statusColors: Record<string, string> = {
		Freigegeben: 'bg-success',
		'Zur Freigabe': 'bg-info',
		Entwurf: 'bg-warning',
		Archiviert: 'bg-neutral'
	};

	const categoryColors: Record<string, string> = {
		Geburtstag: 'bg-primary',
		Jubiläum: 'bg-secondary',
		Individuell: 'bg-accent'
	};

	function exportData() {
		const dataStr = JSON.stringify(analyticsData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Analytics - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Analytics Dashboard</h1>
			<p class="text-base-content/70 mt-2">
				Detaillierte Berichte und Statistiken über die Nutzung der Wish Factory
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={exportData}>
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
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				Daten exportieren
			</button>
		</div>
	</div>
</div>

<!-- Time Range and Metric Selectors -->
<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
	<div class="form-control">
		<label class="label" for="timeRange">
			<span class="label-text">Zeitraum</span>
		</label>
		<select id="timeRange" class="select-bordered select w-full" bind:value={selectedTimeRange}>
			{#each timeRanges as range}
				<option value={range.value}>{range.label}</option>
			{/each}
		</select>
	</div>

	<div class="form-control">
		<label class="label" for="metric">
			<span class="label-text">Metrik</span>
		</label>
		<select id="metric" class="select-bordered select w-full" bind:value={selectedMetric}>
			{#each metrics as metric}
				<option value={metric.value}>{metric.label}</option>
			{/each}
		</select>
	</div>
</div>

<!-- Overview Statistics -->
<div class="stats mb-8 w-full shadow">
	<div class="stat">
		<div class="stat-figure text-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
		</div>
		<div class="stat-title">Gesamt Wünsche</div>
		<div class="stat-value text-primary">{analyticsData.overview.totalWishes}</div>
		<div class="stat-desc">↗︎ 12% mehr als letzten Monat</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-secondary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
				/>
			</svg>
		</div>
		<div class="stat-title">Aktive Benutzer</div>
		<div class="stat-value text-secondary">{analyticsData.overview.totalUsers}</div>
		<div class="stat-desc">↗︎ 2 neue diese Woche</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
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
		</div>
		<div class="stat-title">Veröffentlicht</div>
		<div class="stat-value text-success">{analyticsData.overview.totalPublished}</div>
		<div class="stat-desc">91% Erfolgsquote</div>
	</div>

	<div class="stat">
		<div class="stat-figure text-warning">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block h-8 w-8 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
				/>
			</svg>
		</div>
		<div class="stat-title">Durchschnittliche Bewertung</div>
		<div class="stat-value text-warning">{analyticsData.overview.averageRating}</div>
		<div class="stat-desc">von 5 Sternen</div>
	</div>
</div>

<!-- Charts and Analytics -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Wishes Over Time -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Wünsche über Zeit</h2>
			<div class="h-64 w-full">
				<!-- Simple bar chart representation -->
				<div class="flex h-full items-end justify-around gap-2">
					{#each analyticsData.wishesOverTime as data (data.month)}
						<div class="flex flex-col items-center">
							<div
								class="w-8 rounded-t bg-primary"
								style="height: {(data.count / 35) * 100}%"
							></div>
							<span class="mt-2 text-xs">{data.month}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Category Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Kategorieverteilung</h2>
			<div class="space-y-3">
				{#each analyticsData.categoryDistribution as category}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-4 w-4 rounded {categoryColors[category.category]}"></div>
							<span class="text-sm">{category.category}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{category.count}</div>
							<div class="text-xs opacity-70">{category.percentage}%</div>
						</div>
					</div>
					<div class="h-2 w-full rounded-full bg-base-200">
						<div
							class="h-2 rounded-full {categoryColors[category.category]}"
							style="width: {category.percentage}%"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- User Activity -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Benutzer-Aktivität</h2>
			<div class="overflow-x-auto">
				<table class="table table-zebra w-full">
					<thead>
						<tr>
							<th>Benutzer</th>
							<th>Wünsche</th>
							<th>Veröffentlicht</th>
							<th>Rate</th>
						</tr>
					</thead>
					<tbody>
						{#each analyticsData.userActivity as user}
							<tr>
								<td class="font-medium">{user.user}</td>
								<td>{user.wishes}</td>
								<td>{user.published}</td>
								<td>
									<div class="text-sm">
										{Math.round((user.published / user.wishes) * 100)}%
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Status Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Status-Verteilung</h2>
			<div class="space-y-3">
				{#each analyticsData.statusDistribution as status}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-4 w-4 rounded {statusColors[status.status]}"></div>
							<span class="text-sm">{status.status}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{status.count}</div>
							<div class="text-xs opacity-70">{status.percentage}%</div>
						</div>
					</div>
					<div class="h-2 w-full rounded-full bg-base-200">
						<div
							class="h-2 rounded-full {statusColors[status.status]}"
							style="width: {status.percentage}%"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Language Distribution -->
<div class="card mt-6 bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Sprachverteilung</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each analyticsData.languageDistribution as lang}
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content"
						>
							<span class="text-xs font-bold">{lang.language === 'Deutsch' ? 'DE' : 'EN'}</span>
						</div>
						<span class="font-medium">{lang.language}</span>
					</div>
					<div class="text-right">
						<div class="text-lg font-bold">{lang.count}</div>
						<div class="text-sm opacity-70">{lang.percentage}%</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Performance Insights -->
<div class="card mt-6 bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Performance-Insights</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="stat">
				<div class="stat-figure text-success">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="inline-block h-8 w-8 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				</div>
				<div class="stat-title">Wachstumsrate</div>
				<div class="stat-value text-success">+23%</div>
				<div class="stat-desc">Monatliches Wachstum</div>
			</div>

			<div class="stat">
				<div class="stat-figure text-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="inline-block h-8 w-8 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div class="stat-title">Ø Bearbeitungszeit</div>
				<div class="stat-value text-info">2.3h</div>
				<div class="stat-desc">Bis zur Freigabe</div>
			</div>

			<div class="stat">
				<div class="stat-figure text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="inline-block h-8 w-8 stroke-current"
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
				</div>
				<div class="stat-title">Qualitätsscore</div>
				<div class="stat-value text-primary">94%</div>
				<div class="stat-desc">Erste Freigabe</div>
			</div>
		</div>
	</div>
</div>
