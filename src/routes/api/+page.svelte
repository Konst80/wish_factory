<script lang="ts">
	const baseUrl = 'http://localhost:5173/api';
</script>

<svelte:head>
	<title>API Documentation - Wish Factory</title>
	<meta name="description" content="Complete API documentation for the Wish Factory REST API" />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<header class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Wish-Factory API Documentation</h1>
		<p class="text-lg opacity-70">Complete documentation for the Wish Factory REST API endpoints</p>
	</header>

	<div class="prose max-w-none">
		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Overview</h2>
			<p class="mb-4">
				The Wish-Factory API provides endpoints for accessing and managing AI-generated
				wishes/greetings. The API supports both public and private endpoints with authentication and
				rate limiting.
			</p>
			<div class="alert alert-info">
				<p class="font-medium">Base URL: <code class="badge badge-primary">{baseUrl}</code></p>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Authentication</h2>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="alert alert-success">
					<h3 class="mb-2 font-semibold">Public API</h3>
					<ul class="space-y-1 text-sm">
						<li><strong>API Key Required:</strong> Yes</li>
						<li><strong>Headers:</strong></li>
						<li class="ml-4">• <code>X-API-Key: your-api-key</code></li>
						<li class="ml-4">• <code>Authorization: Bearer your-api-key</code></li>
						<li><strong>Rate Limiting:</strong> Enforced per API key</li>
					</ul>
				</div>
				<div class="alert alert-warning">
					<h3 class="mb-2 font-semibold">Private API</h3>
					<ul class="space-y-1 text-sm">
						<li><strong>Authentication:</strong> Session-based (Supabase Auth)</li>
						<li><strong>Authorization:</strong> Role-based (Editor/Administrator)</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Public Endpoints</h2>

			<div class="space-y-6">
				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/public/wishes</code>
						</div>
						<p class="mb-4">Retrieve released wishes with filtering and pagination options.</p>
						<div class="alert">
							<h4 class="mb-2 font-semibold">Query Parameters:</h4>
							<ul class="space-y-1 text-sm">
								<li><code>language</code> (optional): de | en - Filter by language</li>
								<li><code>type</code> (optional): normal | funny - Filter by wish type</li>
								<li>
									<code>eventType</code> (optional): birthday | anniversary | custom - Filter by event
									type
								</li>
								<li>
									<code>length</code> (optional): short | medium | long - Filter by wish length
								</li>
								<li><code>belated</code> (optional): true | false - Filter for belated wishes</li>
								<li>
									<code>relations</code> (optional): Comma-separated list (friend,family,partner,colleague)
								</li>
								<li>
									<code>ageGroups</code> (optional): Comma-separated list (young,middle,senior,all)
								</li>
								<li><code>specificValues</code> (optional): Comma-separated list of numbers</li>
								<li><code>limit</code> (optional): Number of results (max 500, default 100)</li>
								<li><code>offset</code> (optional): Pagination offset (default 0)</li>
								<li>
									<code>since</code> (optional): ISO date string - Only wishes released after this date
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/public/wishes/{'{id}'}</code>
						</div>
						<p class="mb-4">Retrieve a specific released wish by ID.</p>
						<div class="alert">
							<h4 class="mb-2 font-semibold">Path Parameters:</h4>
							<ul class="text-sm">
								<li><code>id</code> (required): Wish ID</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/public/wishes/metadata</code>
							<span class="badge badge-warning ml-2 text-xs">API Key Required</span>
						</div>
						<p class="mb-4">Retrieve metadata about available wishes (types, languages, etc.).</p>
						<div class="alert alert-info">
							<p class="text-sm">
								🔑 <strong>API Key authentication</strong> - Required for consistency with other public
								endpoints
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Private Endpoints</h2>

			<div class="space-y-6">
				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-primary mr-3 font-mono text-sm">POST</span>
							<code class="font-mono text-lg">/api/ai/generate</code>
							<span class="badge badge-warning ml-2 text-xs">Auth Required</span>
						</div>
						<p class="mb-4">Generate new wishes using AI.</p>
						<div class="alert">
							<h4 class="mb-2 font-semibold">Authorization:</h4>
							<p class="text-sm">Session + Role: Editor/Administrator</p>
						</div>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/ai/generate</code>
							<span class="badge badge-warning ml-2 text-xs">Auth Required</span>
						</div>
						<p class="mb-4">Check AI service health and configuration.</p>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-primary mr-3 font-mono text-sm">POST</span>
							<code class="font-mono text-lg">/api/ai/suggest-values</code>
							<span class="badge badge-error ml-2 text-xs">Admin Only</span>
						</div>
						<p class="mb-4">Get AI-generated suggestions for specific values descriptions.</p>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-primary mr-3 font-mono text-sm">POST</span>
							<code class="font-mono text-lg">/api/wishes/{'{id}'}/release</code>
							<span class="badge badge-warning ml-2 text-xs">Auth Required</span>
						</div>
						<p class="mb-4">Release a wish for public API access.</p>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-error mr-3 font-mono text-sm">DELETE</span>
							<code class="font-mono text-lg">/api/wishes/{'{id}'}/release</code>
							<span class="badge badge-warning ml-2 text-xs">Auth Required</span>
						</div>
						<p class="mb-4">Remove a wish from public API access.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">System Endpoints</h2>

			<div class="space-y-6">
				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/system/init-status</code>
							<span class="badge badge-info ml-2 text-xs">Public</span>
						</div>
						<p class="mb-4">Check if the system has been initialized.</p>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-primary mr-3 font-mono text-sm">POST</span>
							<code class="font-mono text-lg">/api/system/setup-admin</code>
							<span class="badge badge-accent ml-2 text-xs">Setup Only</span>
						</div>
						<p class="mb-4">Create initial admin user during system setup.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Test Endpoints</h2>

			<div class="space-y-6">
				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/test/db-connection</code>
							<span class="badge badge-info ml-2 text-xs">Public</span>
						</div>
						<p class="mb-4">Test database connectivity.</p>
					</div>
				</div>

				<div class="card border">
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<span class="badge badge-success mr-3 font-mono text-sm">GET</span>
							<code class="font-mono text-lg">/api/test/env-check</code>
							<span class="badge badge-info ml-2 text-xs">Public</span>
						</div>
						<p class="mb-4">Check environment variables configuration.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Error Responses</h2>
			<p class="mb-4">All endpoints return standardized error responses:</p>
			<div class="alert alert-error">
				<pre class="text-sm"><code
						>{JSON.stringify(
							{
								error: {
									code: 'ERROR_CODE',
									message: 'Human readable error message',
									timestamp: '2024-01-01T00:00:00.000Z'
								}
							},
							null,
							2
						)}</code
					></pre>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Rate Limiting</h2>
			<div class="alert alert-warning">
				<p class="mb-2">The public API implements rate limiting per API key:</p>
				<ul class="space-y-1 text-sm">
					<li>• Default limit: Configurable per API key</li>
					<li>• Rate limit headers included in responses</li>
					<li>• <code>429 Too Many Requests</code> when exceeded</li>
				</ul>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">CORS Support</h2>
			<div class="alert alert-success">
				<p class="mb-2">All public endpoints support CORS with the following headers:</p>
				<ul class="space-y-1 text-sm">
					<li>• <code>Access-Control-Allow-Origin: *</code></li>
					<li>• <code>Access-Control-Allow-Methods: GET, HEAD, OPTIONS</code></li>
					<li>
						• <code>Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization</code>
					</li>
				</ul>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Data Model</h2>
			<div class="alert">
				<h3 class="mb-2 font-semibold">Wish Object</h3>
				<pre class="overflow-x-auto text-sm"><code
						>{`interface Wish {
  id: string;
  type: 'normal' | 'funny';
  eventType: 'birthday' | 'anniversary' | 'custom';
  relations: ('friend' | 'family' | 'partner' | 'colleague')[];
  ageGroups: ('young' | 'middle' | 'senior' | 'all')[];
  specificValues: number[];
  text: string;
  belated: string;
  language: 'de' | 'en';
  length: 'short' | 'medium' | 'long';
  status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';
  releasedAt?: string; // ISO date string
}`}</code
					></pre>
			</div>
		</section>

		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold">Security Considerations</h2>
			<div class="alert alert-info">
				<ul class="space-y-2 text-sm">
					<li>1. <strong>API Keys:</strong> Store securely and rotate regularly</li>
					<li>2. <strong>Rate Limiting:</strong> Implement client-side rate limiting awareness</li>
					<li>3. <strong>HTTPS:</strong> Always use HTTPS in production</li>
					<li>4. <strong>Input Validation:</strong> All inputs are validated server-side</li>
					<li>5. <strong>Authentication:</strong> Session-based auth for private endpoints</li>
					<li>6. <strong>Authorization:</strong> Role-based access control implemented</li>
				</ul>
			</div>
		</section>
	</div>
</div>
