<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTimeRange = $state(data.timeRange || 'last-30-days');
	let selectedMetric = $state('wishes');

	// Update URL when time range changes
	function updateTimeRange() {
		const params = new URLSearchParams();
		params.set('timeRange', selectedTimeRange);
		goto(`?${params.toString()}`, { replaceState: true });
	}

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
		Hochzeitstag: 'bg-secondary',
		Individuell: 'bg-accent'
	};

	const typeColors: Record<string, string> = {
		Normal: 'bg-blue-500',
		Herzlich: 'bg-pink-500',
		Humorvoll: 'bg-yellow-500'
	};

	const relationColors: Record<string, string> = {
		'Freund/in': 'bg-green-500',
		Familie: 'bg-red-500',
		'Partner/in': 'bg-purple-500',
		'Kollege/in': 'bg-orange-500'
	};

	const ageGroupColors: Record<string, string> = {
		'Junge Menschen': 'bg-cyan-500',
		'Mittleres Alter': 'bg-indigo-500',
		Senioren: 'bg-gray-500',
		'Alle Altersgruppen': 'bg-emerald-500'
	};

	const belatedColors: Record<string, string> = {
		Normal: 'bg-blue-600',
		Nachträglich: 'bg-amber-600'
	};

	function exportData() {
		const dataStr = JSON.stringify(data, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	// Format date string to show day and month abbreviation split on two lines
	function formatChartLabel(dateString: string): { day: string; month: string } {
		try {
			// Parse the date string - assuming it's in format like "30.6" or similar
			const parts = dateString.split('.');
			if (parts.length >= 2) {
				const day = parseInt(parts[0]);
				const month = parseInt(parts[1]);

				const monthNames = [
					'Jan',
					'Feb',
					'Mär',
					'Apr',
					'Mai',
					'Jun',
					'Jul',
					'Aug',
					'Sep',
					'Okt',
					'Nov',
					'Dez'
				];

				if (month >= 1 && month <= 12) {
					return {
						day: `${day}.`,
						month: monthNames[month - 1]
					};
				}
			}
		} catch {
			// If parsing fails, return original string split
			return { day: dateString, month: '' };
		}

		// Fallback: return original string split
		return { day: dateString, month: '' };
	}
</script>

<svelte:head>
	<title>Analytics - Wish Factory</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-base-content text-3xl font-bold">Analytics Dashboard</h1>
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
		<select
			id="timeRange"
			class="select-bordered select w-full"
			bind:value={selectedTimeRange}
			onchange={updateTimeRange}
		>
			{#each timeRanges as range (range.value)}
				<option value={range.value}>{range.label}</option>
			{/each}
		</select>
	</div>

	<div class="form-control">
		<label class="label" for="metric">
			<span class="label-text">Metrik</span>
		</label>
		<select id="metric" class="select-bordered select w-full" bind:value={selectedMetric}>
			{#each metrics as metric (metric.value)}
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
		<div class="stat-value text-primary">{data.overview.totalWishes}</div>
		<div class="stat-desc">Alle erstellten Wünsche</div>
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
		<div class="stat-value text-secondary">{data.overview.totalUsers}</div>
		<div class="stat-desc">Registrierte Benutzer</div>
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
		<div class="stat-value text-success">{data.overview.totalPublished}</div>
		<div class="stat-desc">
			{data.overview.totalWishes > 0
				? Math.round((data.overview.totalPublished / data.overview.totalWishes) * 100)
				: 0}% Erfolgsquote
		</div>
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
		<div class="stat-value text-warning">{data.overview.averageRating}</div>
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
				{#if data.wishesOverTime.length > 0}
					<!-- Simple bar chart representation -->
					<div class="flex h-full flex-col justify-center gap-1 px-4">
						<!-- Count numbers row -->
						<div class="flex justify-center gap-1">
							{#each data.wishesOverTime as dayData (dayData.month)}
								<div class="flex max-w-12 flex-1 justify-center">
									<span class="font-mono text-xs opacity-60">{dayData.count}</span>
								</div>
							{/each}
						</div>

						<!-- Bars row -->
						<div class="flex items-end justify-center gap-1" style="height: 180px;">
							{#each data.wishesOverTime as dayData (dayData.month)}
								{@const maxCount = Math.max(...data.wishesOverTime.map((d) => d.count)) || 1}
								<div class="flex max-w-12 flex-1 justify-center">
									<div
										class="bg-primary hover:bg-primary-focus rounded-t transition-all duration-300"
										style="width: {Math.min(
											data.wishesOverTime.length <= 7 ? 32 : 24,
											48
										)}px; height: {Math.max(
											(dayData.count / maxCount) * 180,
											dayData.count > 0 ? 8 : 2
										)}px; min-height: 2px;"
										title="{formatChartLabel(dayData.month).day} {formatChartLabel(dayData.month)
											.month}: {dayData.count} Wünsche"
									></div>
								</div>
							{/each}
						</div>

						<!-- Date labels row -->
						<div class="flex justify-center gap-1">
							{#each data.wishesOverTime as dayData (dayData.month)}
								<div class="flex max-w-12 flex-1 justify-center">
									<div class="text-center text-xs font-medium">
										<div>{formatChartLabel(dayData.month).day}</div>
										<div>{formatChartLabel(dayData.month).month}</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<!-- Empty state -->
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<div class="text-base-content/50 mb-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mx-auto h-12 w-12"
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
							</div>
							<p class="text-base-content/70 text-sm">Keine Daten verfügbar</p>
							<p class="text-base-content/50 text-xs">
								Erstellen Sie Wünsche, um Statistiken zu sehen
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Category Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Kategorieverteilung</h2>
			<div class="space-y-3">
				{#each data.categoryDistribution as category (category.category)}
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
					<div class="bg-base-200 h-2 w-full rounded-full">
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
				<table class="table-zebra table w-full">
					<thead>
						<tr>
							<th>Benutzer</th>
							<th>Wünsche</th>
							<th>Veröffentlicht</th>
							<th>Rate</th>
						</tr>
					</thead>
					<tbody>
						{#each data.userActivity as user (user.user)}
							<tr>
								<td class="font-medium">{user.user}</td>
								<td>{user.wishes}</td>
								<td>{user.published}</td>
								<td>
									<div class="text-sm">
										{user.wishes > 0 ? Math.round((user.published / user.wishes) * 100) : 0}%
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="text-center opacity-70">Keine Benutzerdaten verfügbar</td>
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
				{#each data.statusDistribution as status (status.status)}
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
					<div class="bg-base-200 h-2 w-full rounded-full">
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
<div class="card bg-base-100 mt-6 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Sprachverteilung</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each data.languageDistribution as lang (lang.language)}
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex items-center gap-3">
						<div
							class="bg-primary text-primary-content flex h-8 w-8 items-center justify-center rounded-full"
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

<!-- Additional Distributions -->
<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
	<!-- Type/Style Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Stil-Verteilung</h2>
			<div class="space-y-3">
				{#each data.typeDistribution as type (type.type)}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-4 w-4 rounded {typeColors[type.type]}"></div>
							<span class="text-sm">{type.type}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{type.count}</div>
							<div class="text-xs opacity-70">{type.percentage}%</div>
						</div>
					</div>
					<div class="bg-base-200 h-2 w-full rounded-full">
						<div
							class="h-2 rounded-full {typeColors[type.type]}"
							style="width: {type.percentage}%"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Relations Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Beziehungs-Verteilung</h2>
			<div class="space-y-3">
				{#each data.relationsDistribution as relation (relation.relation)}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-4 w-4 rounded {relationColors[relation.relation]}"></div>
							<span class="text-sm">{relation.relation}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{relation.count}</div>
							<div class="text-xs opacity-70">{relation.percentage}%</div>
						</div>
					</div>
					<div class="bg-base-200 h-2 w-full rounded-full">
						<div
							class="h-2 rounded-full {relationColors[relation.relation]}"
							style="width: {relation.percentage}%"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Age Groups Distribution -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Altersgruppen-Verteilung</h2>
			<div class="space-y-3">
				{#each data.ageGroupsDistribution as ageGroup (ageGroup.ageGroup)}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-4 w-4 rounded {ageGroupColors[ageGroup.ageGroup]}"></div>
							<span class="text-sm">{ageGroup.ageGroup}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{ageGroup.count}</div>
							<div class="text-xs opacity-70">{ageGroup.percentage}%</div>
						</div>
					</div>
					<div class="bg-base-200 h-2 w-full rounded-full">
						<div
							class="h-2 rounded-full {ageGroupColors[ageGroup.ageGroup]}"
							style="width: {ageGroup.percentage}%"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Belated Distribution -->
<div class="card bg-base-100 mt-6 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Nachträgliche Wünsche</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each data.belatedDistribution as belated (belated.belated)}
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex items-center gap-3">
						<div class="h-6 w-6 rounded {belatedColors[belated.belated]}"></div>
						<span class="font-medium">{belated.belated}</span>
					</div>
					<div class="text-right">
						<div class="text-lg font-bold">{belated.count}</div>
						<div class="text-sm opacity-70">{belated.percentage}%</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Performance Insights -->
<div class="card bg-base-100 mt-6 shadow-xl">
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
