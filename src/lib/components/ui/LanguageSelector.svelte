<script lang="ts">
	import { currentLanguage } from '$lib/stores/language';
	import {
		activeWishLanguages,
		wishLanguagesLoading,
		wishLanguagesError,
		loadActiveWishLanguages
	} from '$lib/stores/wishLanguages';
	import { onMount } from 'svelte';

	let selectedLanguage = $state<string>('de');
	let dropdownRef: HTMLDivElement;

	// Get current language info from dynamic languages
	const currentLanguageInfo = $derived(
		$activeWishLanguages.find((lang) => lang.code === selectedLanguage) || {
			code: selectedLanguage,
			name: 'Deutsch',
			flag: '🇩🇪'
		}
	);

	// Initialize language store and load dynamic languages
	onMount(() => {
		console.log('🚀 LanguageSelector: Initializing component');
		currentLanguage.initialize();

		// Load dynamic languages with fallback
		loadActiveWishLanguages().catch((error) => {
			console.warn('Failed to load wish languages, using fallback:', error);
			// Set fallback languages if API fails
			activeWishLanguages.set([
				{ id: '1', code: 'de', name: 'Deutsch', flag: '🇩🇪', is_active: true },
				{ id: '2', code: 'en', name: 'English', flag: '🇬🇧', is_active: true }
			]);
		});

		// Subscribe to language changes
		const unsubscribe = currentLanguage.subscribe((lang) => {
			console.log('🔄 Language changed to:', lang);
			selectedLanguage = lang;
		});

		return unsubscribe;
	});

	function handleLanguageChange(lang: string) {
		// Validate that the language code exists in active languages
		if ($activeWishLanguages.some((l) => l.code === lang)) {
			currentLanguage.setLanguage(lang);
		}
		// DaisyUI will close the dropdown automatically
	}

	// DaisyUI handles dropdown behavior automatically
	// No need for manual toggle functions
</script>

<div class="dropdown dropdown-top" bind:this={dropdownRef}>
	<div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2" aria-label="Sprache auswählen">
		<span class="text-sm">{currentLanguageInfo.flag}</span>
		<span class="hidden text-sm sm:inline">{currentLanguageInfo.name}</span>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</div>

	<ul
		class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-[1000] w-48 border p-2 shadow-lg"
		role="menu"
		aria-label="Sprache auswählen"
	>
		<li class="menu-title">
			<span class="text-xs font-semibold">Sprache für Wünsche & Analyse</span>
		</li>
		<div class="divider my-1"></div>

		{#if $wishLanguagesLoading}
			<li>
				<div class="flex items-center gap-3 text-sm">
					<span class="loading loading-spinner loading-sm"></span>
					<span class="text-base-content/60">Sprachen werden geladen...</span>
				</div>
			</li>
		{:else if $wishLanguagesError}
			<li>
				<div class="text-error flex items-center gap-3 text-sm">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-xs">Fehler beim Laden der Sprachen</span>
				</div>
			</li>
		{:else}
			{#each $activeWishLanguages as language (language.id)}
				<li>
					<button
						class="flex items-center gap-3 text-sm"
						class:active={selectedLanguage === language.code}
						onclick={() => handleLanguageChange(language.code)}
						aria-label="Sprache zu {language.name} wechseln"
						role="menuitem"
					>
						<span class="text-lg">{language.flag}</span>
						<span class="flex-1 text-left">{language.name}</span>
						{#if selectedLanguage === language.code}
							<svg class="text-primary h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		{/if}

		<div class="divider my-1"></div>
		<li>
			<div class="text-base-content/60 px-3 py-2 text-xs">
				Diese Einstellung bestimmt die Sprache für alle Wünsche und Ähnlichkeitsanalysen
			</div>
		</li>
	</ul>
</div>
