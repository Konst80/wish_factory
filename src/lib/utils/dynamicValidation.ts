import { z } from 'zod';
import type { WishLanguage } from '$lib/stores/wishLanguages';

/**
 * Erstellt ein dynamisches Zod-Schema für Sprach-Validierung basierend auf aktiven Sprachen
 */
export function createDynamicLanguageSchema(
	activeLanguages: WishLanguage[]
): z.ZodEnum<[string, ...string[]]> {
	if (activeLanguages.length === 0) {
		// Fallback auf DE/EN wenn keine aktiven Sprachen vorhanden sind
		return z.enum(['de', 'en']);
	}

	const codes = activeLanguages.map((lang) => lang.code);
	// Zod.enum benötigt mindestens ein Element, daher diese Struktur
	return z.enum([codes[0], ...codes.slice(1)] as [string, ...string[]]);
}

/**
 * Validiert einen Sprach-Code gegen die Liste aktiver Sprachen
 */
export function validateLanguageCode(code: string, activeLanguages: WishLanguage[]): boolean {
	if (activeLanguages.length === 0) {
		// Fallback auf DE/EN wenn keine aktiven Sprachen vorhanden sind
		return ['de', 'en'].includes(code);
	}

	return activeLanguages.some((lang) => lang.code === code);
}

/**
 * Holt die erste aktive Sprache als Fallback
 */
export function getDefaultLanguage(activeLanguages: WishLanguage[]): string {
	if (activeLanguages.length === 0) {
		return 'de'; // Fallback
	}

	return activeLanguages[0].code;
}

/**
 * Erweiterte Wish-Validierung mit dynamischer Sprach-Validierung
 */
export function createWishValidationSchema(activeLanguages: WishLanguage[]) {
	const languageSchema = createDynamicLanguageSchema(activeLanguages);

	return z.object({
		id: z.string().uuid('ID muss eine gültige UUID sein').optional(),
		type: z.enum(['normal', 'herzlich', 'humorvoll']),
		eventType: z.enum(['birthday', 'anniversary', 'custom']),
		relations: z
			.array(z.enum(['friend', 'family', 'partner', 'colleague']))
			.min(1, 'Mindestens eine Relation muss ausgewählt sein'),
		ageGroups: z
			.array(z.enum(['all', 'young', 'middle', 'senior']))
			.min(1, 'Mindestens eine Altersgruppe muss ausgewählt sein'),
		specificValues: z.array(z.number().int().positive()).default([]),
		text: z
			.string()
			.min(10, 'Text muss mindestens 10 Zeichen haben')
			.max(1000, 'Text darf nicht länger als 1000 Zeichen sein'),
		belated: z.boolean().default(false),
		status: z.enum(['Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert']).default('Entwurf'),
		language: languageSchema,
		length: z.enum(['short', 'medium', 'long']).default('medium'),
		createdAt: z.date().default(() => new Date()),
		updatedAt: z.date().default(() => new Date()),
		createdBy: z.string().uuid('Creator muss eine gültige UUID sein')
	});
}

/**
 * Erstellt ein Schema für die Erstellung neuer Wishes
 */
export function createWishCreationSchema(activeLanguages: WishLanguage[]) {
	const baseSchema = createWishValidationSchema(activeLanguages);
	return baseSchema.omit({
		id: true,
		createdAt: true,
		updatedAt: true
	});
}

/**
 * Erstellt ein Schema für die Aktualisierung von Wishes
 */
export function createWishUpdateSchema(activeLanguages: WishLanguage[]) {
	const baseSchema = createWishValidationSchema(activeLanguages);
	return baseSchema.partial().required({ id: true });
}

/**
 * Utility-Funktion für die Migration von bestehenden Wishes
 * Prüft, ob ein Wunsch eine deaktivierte Sprache verwendet
 */
export function isWishLanguageStillActive(
	wishLanguage: string,
	activeLanguages: WishLanguage[]
): boolean {
	return validateLanguageCode(wishLanguage, activeLanguages);
}

/**
 * Holt verfügbare Sprachen für die Anzeige in Formularen
 */
export function getAvailableLanguagesForForm(activeLanguages: WishLanguage[]) {
	return activeLanguages.map((lang) => ({
		value: lang.code,
		label: `${lang.flag} ${lang.name}`
	}));
}
