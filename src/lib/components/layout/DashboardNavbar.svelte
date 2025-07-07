<script lang="ts">
	// Mock data for testing
	const currentUserProfile = {
		full_name: 'Test User',
		email: 'test@example.com'
	};

	let { onMenuToggle }: { onMenuToggle?: () => void } = $props();

	const handleMenuToggle = () => {
		onMenuToggle?.();
	};
</script>

<div class="navbar bg-base-300 lg:hidden">
	<div class="flex-none">
		<button class="btn btn-square btn-ghost" onclick={handleMenuToggle} aria-label="Menu öffnen">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="inline-block h-6 w-6 stroke-current"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				></path>
			</svg>
		</button>
	</div>

	<div class="flex-1">
		<a href="/dashboard" class="text-xl font-bold">Wish Factory</a>
	</div>

	<div class="flex-none">
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
				<div
					class="bg-primary text-primary-content flex w-10 items-center justify-center rounded-full"
				>
					<span class="text-sm font-semibold">
						{currentUserProfile?.full_name?.charAt(0) || 'U'}
					</span>
				</div>
			</div>
			<ul class="menu dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
				<li class="menu-title">
					<span>{currentUserProfile?.full_name || 'User'}</span>
				</li>
				<li><a href="/dashboard/profile">Profil bearbeiten</a></li>
				<li><a href="/dashboard/settings">Einstellungen</a></li>
				<div class="divider my-1"></div>
				<li><a href="/auth/logout" class="text-error">Abmelden</a></li>
			</ul>
		</div>
	</div>
</div>
