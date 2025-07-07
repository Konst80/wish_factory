<script lang="ts">
	import { page } from '$app/stores';

	// Mock data for testing
	const currentUserProfile = {
		full_name: 'Test User',
		email: 'test@example.com'
	};
	const isAdmin = true;

	interface MenuItem {
		href: string;
		label: string;
		icon: string;
		adminOnly?: boolean;
	}

	const menuItems: MenuItem[] = [
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 00-1-1V7a2 2 0 012-2h7a2 2 0 012 2v1'
		},
		{
			href: '/dashboard/wishes',
			label: 'Wünsche',
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
		},
		{
			href: '/dashboard/users',
			label: 'Benutzer',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			adminOnly: true
		},
		{
			href: '/dashboard/analytics',
			label: 'Analytics',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			adminOnly: true
		},
		{
			href: '/dashboard/settings',
			label: 'Einstellungen',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
		}
	];

	let visibleMenuItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

	function isActiveRoute(href: string): boolean {
		if (href === '/dashboard') {
			return $page.url.pathname === '/dashboard';
		}
		return $page.url.pathname.startsWith(href);
	}

	const handleSignOut = async () => {
		console.log('Sign out clicked');
		// Temporarily disabled
	};
</script>

<aside class="min-h-full w-80 bg-base-200 text-base-content">
	<!-- Sidebar header -->
	<div class="border-b border-base-300 p-4">
		<div class="flex items-center gap-3">
			<div class="avatar">
				<div class="w-12 rounded-full bg-primary text-primary-content">
					<div class="flex h-12 items-center justify-center">
						<span class="text-lg font-medium"
							>{currentUserProfile?.full_name?.charAt(0) || 'U'}</span
						>
					</div>
				</div>
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate font-bold">{currentUserProfile?.full_name || 'User'}</div>
				<div class="truncate text-sm opacity-70">{currentUserProfile?.email || ''}</div>
				<div class="mt-1">
					{#if isAdmin}
						<span class="badge badge-error badge-xs">Admin</span>
					{:else}
						<span class="badge badge-primary badge-xs">Redakteur</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Navigation menu -->
	<nav class="p-4">
		<ul class="menu space-y-2">
			{#each visibleMenuItems as item (item.href)}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-3 {isActiveRoute(item.href) ? 'active' : ''}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
						</svg>
						{item.label}
					</a>
				</li>
			{/each}

			<div class="divider my-4"></div>

			<li>
				<a href="/api" class="flex items-center gap-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
						/>
					</svg>
					API Dokumentation
				</a>
			</li>

			<li>
				<button
					class="flex items-center gap-3 text-error hover:bg-error hover:text-error-content"
					onclick={handleSignOut}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
						/>
					</svg>
					Abmelden
				</button>
			</li>
		</ul>
	</nav>
</aside>
