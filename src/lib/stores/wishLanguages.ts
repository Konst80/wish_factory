import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface WishLanguage {
	id: string;
	code: string;
	name: string;
	flag: string;
	is_active?: boolean; // Optional für öffentliche API
	created_at?: string;
	updated_at?: string;
}

// Store für aktive Wunsch-Sprachen (für Formulare)
export const activeWishLanguages = writable<WishLanguage[]>([]);

// Store für alle Wunsch-Sprachen (für Admin-Interface)
export const allWishLanguages = writable<WishLanguage[]>([]);

// Loading state
export const wishLanguagesLoading = writable(false);

// Error state
export const wishLanguagesError = writable<string | null>(null);

/**
 * Lädt alle aktiven Wunsch-Sprachen (für Formulare)
 */
export async function loadActiveWishLanguages() {
	if (!browser) return;

	wishLanguagesLoading.set(true);
	wishLanguagesError.set(null);

	try {
		const response = await fetch('/api/wish-languages');
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to load active wish languages');
		}

		activeWishLanguages.set(data.languages || []);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		wishLanguagesError.set(errorMessage);
		console.error('❌ Failed to load active wish languages:', errorMessage);

		// Set fallback languages when API fails
		activeWishLanguages.set([
			{ id: '1', code: 'de', name: 'Deutsch', flag: '🇩🇪', is_active: true },
			{ id: '2', code: 'en', name: 'English', flag: '🇬🇧', is_active: true }
		]);
	} finally {
		wishLanguagesLoading.set(false);
	}
}

/**
 * Lädt alle Wunsch-Sprachen (für Admin-Interface)
 */
export async function loadAllWishLanguages() {
	if (!browser) return;

	wishLanguagesLoading.set(true);
	wishLanguagesError.set(null);

	try {
		const response = await fetch('/api/admin/wish-languages');
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to load all wish languages');
		}

		allWishLanguages.set(data.languages || []);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		wishLanguagesError.set(errorMessage);
		console.error('❌ Failed to load all wish languages:', errorMessage);
	} finally {
		wishLanguagesLoading.set(false);
	}
}

/**
 * Erstellt eine neue Wunsch-Sprache
 */
export async function createWishLanguage(language: {
	code: string;
	name: string;
	flag: string;
}): Promise<WishLanguage> {
	if (!browser) throw new Error('Not in browser environment');

	const response = await fetch('/api/admin/wish-languages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(language)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to create wish language');
	}

	// Reload all languages to refresh the store
	await loadAllWishLanguages();
	await loadActiveWishLanguages();

	return data.language;
}

/**
 * Aktualisiert eine Wunsch-Sprache
 */
export async function updateWishLanguage(
	id: string,
	updates: {
		is_active?: boolean;
		name?: string;
		flag?: string;
	}
): Promise<WishLanguage> {
	if (!browser) throw new Error('Not in browser environment');

	const response = await fetch('/api/admin/wish-languages', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id, ...updates })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update wish language');
	}

	// Reload all languages to refresh the store
	await loadAllWishLanguages();
	await loadActiveWishLanguages();

	return data.language;
}

/**
 * Löscht eine Wunsch-Sprache
 */
export async function deleteWishLanguage(id: string): Promise<void> {
	if (!browser) throw new Error('Not in browser environment');

	const response = await fetch('/api/admin/wish-languages', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to delete wish language');
	}

	// Reload all languages to refresh the store
	await loadAllWishLanguages();
	await loadActiveWishLanguages();
}

/**
 * Utility-Funktion: Prüft ob eine Sprache aktiv ist
 */
export function isLanguageActive(code: string, languages: WishLanguage[]): boolean {
	return languages.some((lang) => lang.code === code && lang.is_active !== false);
}

/**
 * Utility-Funktion: Holt Sprach-Informationen nach Code
 */
export function getLanguageByCode(code: string, languages: WishLanguage[]): WishLanguage | null {
	return languages.find((lang) => lang.code === code) || null;
}

/**
 * Utility-Funktion: Validiert Sprach-Code
 */
export function validateLanguageCode(code: string): boolean {
	return /^[a-z]{2}$/.test(code);
}

/**
 * Utility-Funktion: Formatiert Sprach-Code zu Anzeigename
 */
export function formatLanguageDisplay(language: WishLanguage): string {
	return `${language.flag} ${language.name}`;
}
