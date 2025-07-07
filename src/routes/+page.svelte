<script lang="ts">
	// Temporarily simplified for testing
</script>

<svelte:head>
	<title>Welcome - Wish Factory</title>
</svelte:head>

<!-- Hero Section -->
<div class="hero from-primary/10 via-secondary/5 to-accent/10 min-h-screen bg-gradient-to-br">
	<div class="hero-content text-center">
		<div class="max-w-4xl">
			<!-- Main Title with Animation -->
			<div class="mb-8">
				<h1
					class="from-primary to-secondary mb-6 bg-gradient-to-r bg-clip-text text-7xl font-bold text-transparent"
				>
					Wish Factory
				</h1>
				<p class="text-base-content/80 mx-auto max-w-2xl text-xl leading-relaxed">
					Erstellen Sie personalisierte Wünsche mit KI-Unterstützung für jeden Anlass.
					Professionelles Content Management mit intelligenten Workflows.
				</p>
			</div>

			<!-- CTA Buttons -->
			<div class="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a href="/dashboard" class="btn btn-primary btn-lg gap-2 shadow-lg">
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
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
					Dashboard öffnen
				</a>
				<a href="/auth/login" class="btn btn-outline btn-lg gap-2">
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
							d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
						/>
					</svg>
					Anmelden
				</a>
			</div>

			<!-- Features Grid -->
			<div class="mb-16 grid gap-6 md:grid-cols-3">
				<div
					class="card bg-base-100/80 border-base-300/20 border shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
				>
					<div class="card-body items-center text-center">
						<div class="avatar">
							<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-primary h-8 w-8"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
							</div>
						</div>
						<h3 class="card-title text-lg">KI-gestützte Wünsche</h3>
						<p class="text-base-content/70 text-sm">
							Intelligente Textgenerierung für personalisierte Glückwünsche zu jedem Anlass
						</p>
					</div>
				</div>

				<div
					class="card bg-base-100/80 border-base-300/20 border shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
				>
					<div class="card-body items-center text-center">
						<div class="avatar">
							<div class="bg-secondary/10 flex h-16 w-16 items-center justify-center rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-secondary h-8 w-8"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
									/>
								</svg>
							</div>
						</div>
						<h3 class="card-title text-lg">Workflow-Management</h3>
						<p class="text-base-content/70 text-sm">
							Professionelle Freigabeprozesse mit rollenbasierten Berechtigungen
						</p>
					</div>
				</div>

				<div
					class="card bg-base-100/80 border-base-300/20 border shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
				>
					<div class="card-body items-center text-center">
						<div class="avatar">
							<div class="bg-accent/10 flex h-16 w-16 items-center justify-center rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-accent h-8 w-8"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
									/>
								</svg>
							</div>
						</div>
						<h3 class="card-title text-lg">Mehrsprachig</h3>
						<p class="text-base-content/70 text-sm">
							Unterstützung für Deutsch und Englisch mit lokalisierten Inhalten
						</p>
					</div>
				</div>
			</div>

			<!-- Stats Section -->
			<div
				class="stats stats-vertical lg:stats-horizontal bg-base-100/80 border-base-300/20 border shadow-xl backdrop-blur-sm"
			>
				<div class="stat">
					<div class="stat-figure text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
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
					</div>
					<div class="stat-title">Erstellte Wünsche</div>
					<div class="stat-value text-primary">1,200+</div>
					<div class="stat-desc">↗︎ 90% mehr als letzten Monat</div>
				</div>

				<div class="stat">
					<div class="stat-figure text-secondary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7"
							/>
						</svg>
					</div>
					<div class="stat-title">Zufriedene Nutzer</div>
					<div class="stat-value text-secondary">98%</div>
					<div class="stat-desc">↗︎ 12% mehr Engagement</div>
				</div>

				<div class="stat">
					<div class="stat-figure text-accent">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
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
					</div>
					<div class="stat-title">Ø Erstellungszeit</div>
					<div class="stat-value text-accent">2min</div>
					<div class="stat-desc">↘︎ 80% schneller mit KI</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<footer class="footer footer-center bg-base-200 text-base-content p-10">
	<div>
		<div class="grid grid-flow-col gap-4">
			<a class="link link-hover">Über uns</a>
			<a class="link link-hover">Kontakt</a>
			<a class="link link-hover">Jobs</a>
			<a class="link link-hover">Presse</a>
		</div>
		<div>
			<div class="grid grid-flow-col gap-4">
				<a href="#" class="hover:text-primary text-2xl transition-colors">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
						></path>
					</svg>
				</a>
				<a href="#" class="hover:text-primary text-2xl transition-colors">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
						></path>
					</svg>
				</a>
				<a href="#" class="hover:text-primary text-2xl transition-colors">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						class="fill-current"
					>
						<path
							d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
						></path>
					</svg>
				</a>
			</div>
		</div>
		<div>
			<p>Copyright © 2024 - Wish Factory. Alle Rechte vorbehalten.</p>
		</div>
	</div>
</footer>
