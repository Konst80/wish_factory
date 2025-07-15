import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { activeWishLanguages, loadActiveWishLanguages, type WishLanguage } from './wishLanguages';

// Keep the old type for backwards compatibility with paraglide
export type SupportedLanguage = 'de' | 'en';

// Dynamic supportedLanguages from activeWishLanguages
export const supportedLanguages = derived<
	typeof activeWishLanguages,
	Record<string, { name: string; flag: string }>
>(activeWishLanguages, ($activeWishLanguages) => {
	const languages: Record<string, { name: string; flag: string }> = {};

	// Convert activeWishLanguages to supportedLanguages format
	$activeWishLanguages.forEach((lang: WishLanguage) => {
		languages[lang.code] = {
			name: lang.name,
			flag: lang.flag
		};
	});

	// Always ensure at least de and en are available as fallback
	if (!languages.de) {
		languages.de = { name: 'Deutsch', flag: '🇩🇪' };
	}
	if (!languages.en) {
		languages.en = { name: 'English', flag: '🇬🇧' };
	}

	return languages;
});

// Create a writable store for the current language preference
function createLanguageStore() {
	const { subscribe, set, update } = writable<string>('de');

	return {
		subscribe,
		set,
		update,
		// Set language and persist to localStorage and cookie
		setLanguage: (lang: string) => {
			set(lang);

			if (browser) {
				// Save to localStorage
				localStorage.setItem('PARAGLIDE_LOCALE', lang);

				// Save to cookie for server-side access
				document.cookie = `PARAGLIDE_LOCALE=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

				// Also try to save to user profile (non-blocking)
				fetch('/api/user/language', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ language: lang })
				}).catch((error) => {
					console.log('Failed to save language preference to profile:', error);
				});

				// Trigger a page reload to apply the new language
				window.location.reload();
			}
		},
		// Initialize from localStorage or default to 'de'
		initialize: () => {
			if (browser) {
				// Load active wish languages first
				loadActiveWishLanguages();

				const stored = localStorage.getItem('PARAGLIDE_LOCALE');
				if (stored) {
					set(stored);
				} else {
					// Check cookie as fallback
					const cookie = document.cookie
						.split('; ')
						.find((row) => row.startsWith('PARAGLIDE_LOCALE='))
						?.split('=')[1];

					if (cookie) {
						set(cookie);
					}
				}
			}
		}
	};
}

export const currentLanguage = createLanguageStore();
