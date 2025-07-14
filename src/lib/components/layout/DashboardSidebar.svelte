<script lang="ts">
	import { page } from '$app/stores';
	import type { Database } from '$lib/types/supabase';

	type Profile = Database['public']['Tables']['profiles']['Row'];

	let { profile }: { profile: Profile | null } = $props();

	// Use profile data from database with $derived
	const currentUserProfile = $derived({
		full_name: profile?.full_name || 'User',
		email: profile?.email || ''
	});
	const isAdmin = $derived(profile?.role === 'Administrator');

	interface MenuItem {
		href: string;
		label: string;
		icon: string;
		adminOnly?: boolean;
		submenu?: MenuItem[];
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
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
			submenu: [
				{
					href: '/dashboard/wishes?status=Zur%20Freigabe',
					label: 'Zur Freigabe',
					icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
				},
				{
					href: '/dashboard/wishes?status=Freigegeben',
					label: 'Freigegeben',
					icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
				},
				{
					href: '/dashboard/wishes?status=Archiviert',
					label: 'Archiv',
					icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10'
				},
				{
					href: '/dashboard/wishes/released',
					label: 'Released',
					icon: 'M15 17h5l-5 5v-5zM4.828 7l2.828 2.828L5.828 12l-2.828-2.828L7 5.172zm7.071-7.071L19.07 7.1 12 14.172 4.929 7.1l7.07-7.071z'
				}
			]
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
			href: '/dashboard/api-keys',
			label: 'API Keys',
			icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
			adminOnly: true
		},
		{
			href: '/dashboard/settings',
			label: 'Einstellungen',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
		}
	];

	const visibleMenuItems = $derived(menuItems.filter((item) => !item.adminOnly || isAdmin));

	function isActiveRoute(href: string): boolean {
		if (href === '/dashboard') {
			return $page.url.pathname === '/dashboard';
		}
		return $page.url.pathname.startsWith(href);
	}

	function hasActiveSubmenu(item: MenuItem): boolean {
		if (!item.submenu) return false;
		return item.submenu.some((submenuItem) => isActiveRoute(submenuItem.href));
	}

	const handleSignOut = async () => {
		window.location.href = '/auth/logout';
	};
</script>

<aside class="bg-base-100 text-base-content border-base-300 min-h-full w-64 border-r">
	<!-- Sidebar header -->
	<div class="border-base-300 border-b p-4">
		<div class="flex items-center gap-3">
			<div class="avatar">
				<div class="bg-primary text-primary-content w-8 rounded-full">
					<div class="flex h-8 items-center justify-center">
						<span class="text-sm font-medium"
							>{currentUserProfile?.full_name?.charAt(0) || 'U'}</span
						>
					</div>
				</div>
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium">{currentUserProfile?.full_name || 'User'}</div>
				{#if isAdmin}
					<span class="badge badge-error badge-xs">Admin</span>
				{:else}
					<span class="badge badge-primary badge-xs">Editor</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Navigation menu -->
	<nav class="p-3">
		<ul class="menu menu-compact">
			{#each visibleMenuItems as item (item.href)}
				<li>
					{#if item.submenu}
						<a
							href={item.href}
							class={isActiveRoute(item.href) || hasActiveSubmenu(item) ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="h-4 w-4"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
							</svg>
							{item.label}
						</a>
						<ul>
							{#each item.submenu as submenuItem (submenuItem.href)}
								<li>
									<a
										href={submenuItem.href}
										class={isActiveRoute(submenuItem.href) ? 'active' : ''}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class="h-3 w-3"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d={submenuItem.icon} />
										</svg>
										{submenuItem.label}
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<a href={item.href} class={isActiveRoute(item.href) ? 'active' : ''}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="h-4 w-4"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
							</svg>
							{item.label}
						</a>
					{/if}
				</li>
			{/each}

			<div class="divider my-2"></div>

			<li>
				<a href="/api">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-4 w-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
						/>
					</svg>
					API Docs
				</a>
			</li>

			<li>
				<button class="text-error hover:bg-error hover:text-error-content" onclick={handleSignOut}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-4 w-4"
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
