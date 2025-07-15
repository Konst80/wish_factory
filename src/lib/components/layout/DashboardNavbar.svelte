<script lang="ts">
	import { currentUserProfile } from '$lib/stores/auth';
	import LanguageSelector from '$lib/components/ui/LanguageSelector.svelte';

	let { onMenuToggle }: { onMenuToggle?: () => void } = $props();

	const handleMenuToggle = () => {
		onMenuToggle?.();
	};
</script>

<div class="navbar bg-base-100 border-base-300 border-b lg:hidden">
	<div class="flex-none">
		<button class="btn btn-ghost btn-sm" onclick={handleMenuToggle} aria-label="Menu öffnen">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="inline-block h-5 w-5 stroke-current"
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
		<a href="/dashboard" class="text-lg font-semibold">Wish Factory</a>
	</div>

	<div class="flex-none">
		<div class="flex items-center gap-2">
			<!-- Language Selector -->
			<LanguageSelector />

			<!-- User Profile Dropdown -->
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle btn-sm avatar">
					<div class="placeholder avatar">
						<div class="bg-primary text-primary-content w-8 rounded-full">
							<span class="text-xs">{$currentUserProfile?.full_name?.charAt(0) || 'U'}</span>
						</div>
					</div>
				</div>
				<ul
					class="menu dropdown-content rounded-box bg-base-100 border-base-300 z-[1] mt-3 w-48 border p-2 shadow-lg"
				>
					<li class="menu-title">
						<span class="text-xs">{$currentUserProfile?.full_name || 'User'}</span>
					</li>
					<li><a href="/dashboard/settings" class="text-sm">Einstellungen</a></li>
					<div class="divider my-1"></div>
					<li><a href="/auth/logout" class="text-error text-sm">Abmelden</a></li>
				</ul>
			</div>
		</div>
	</div>
</div>
