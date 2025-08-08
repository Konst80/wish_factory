import { z } from 'zod';

// Enums für Wish-Typen basierend auf FRS
export const WishType = {
	NORMAL: 'normal',
	HEARTFELT: 'heartfelt',
	FUNNY: 'funny'
} as const;

export const EventType = {
	BIRTHDAY: 'birthday',
	ANNIVERSARY: 'anniversary',
	CUSTOM: 'custom'
} as const;

export const WishStatus = {
	ENTWURF: 'Entwurf',
	ZUR_FREIGABE: 'Zur Freigabe',
	FREIGEGEBEN: 'Freigegeben',
	ARCHIVIERT: 'Archiviert'
} as const;

// Language type updated to support dynamic languages
export const Language = {
	DE: 'de',
	EN: 'en'
} as const;

export const Relation = {
	FRIEND: 'friend',
	FAMILY: 'family',
	PARTNER: 'partner',
	COLLEAGUE: 'colleague'
} as const;

export const AgeGroup = {
	ALL: 'all',
	YOUNG: 'young',
	MIDDLE: 'middle',
	SENIOR: 'senior'
} as const;

export const WishLength = {
	SHORT: 'short',
	MEDIUM: 'medium',
	LONG: 'long'
} as const;

// TypeScript Typen
export type WishType = (typeof WishType)[keyof typeof WishType];
export type EventType = (typeof EventType)[keyof typeof EventType];
export type WishStatus = (typeof WishStatus)[keyof typeof WishStatus];
// Language type now accepts any string to support dynamic languages
export type Language = string;
export type Relation = (typeof Relation)[keyof typeof Relation];
export type AgeGroup = (typeof AgeGroup)[keyof typeof AgeGroup];
export type WishLength = (typeof WishLength)[keyof typeof WishLength];

// Wish Interface basierend auf Referenz-Spezifikation
export interface Wish {
	/** Eindeutiger, systemgenerierter UUID Identifikator */
	id: string;

	/** Art des Wunsches */
	type: 'normal' | 'heartfelt' | 'funny';

	/** Anlass */
	eventType: 'birthday' | 'anniversary' | 'custom';

	/** Ziel-Beziehung(en) */
	relations: ('friend' | 'family' | 'partner' | 'colleague')[];

	/** Ziel-Altersgruppe(n) */
	ageGroups: ('young' | 'middle' | 'senior' | 'all')[];

	/** Array mit Zahlen für Meilensteine (z.B. [18, 30, 50] für Geburtstage). Kann leer sein. */
	specificValues: number[];

	/** Der Haupttext des Wunsches mit Platzhaltern */
	text: string;

	/** Gibt an, ob es sich um einen nachträglichen Wunsch handelt */
	isBelated: boolean;

	/** Sprache des Wunsches */
	language: string;

	/** Gewünschte Länge des Wunsches */
	length: 'short' | 'medium' | 'long';

	/** Status des Wunsches im Workflow */
	status: 'Entwurf' | 'Zur Freigabe' | 'Freigegeben' | 'Archiviert';

	/** ID des Erstellers */
	createdBy: string;

	/** Erstellungsdatum */
	createdAt: string; // ISO date string

	/** Letztes Update */
	updatedAt: string; // ISO date string

	/** Zeitpunkt der Freigabe (optional) */
	releasedAt?: string; // ISO date string
}

// Zod Validation Schemas
export const wishTypeSchema = z.enum(['normal', 'heartfelt', 'funny']);
export const eventTypeSchema = z.enum(['birthday', 'anniversary', 'custom']);
export const wishStatusSchema = z.enum(['Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert']);
export const languageSchema = z.string().min(1, 'Language code cannot be empty');
export const relationSchema = z.enum(['friend', 'family', 'partner', 'colleague']);
export const ageGroupSchema = z.enum(['all', 'young', 'middle', 'senior']);
export const wishLengthSchema = z.enum(['short', 'medium', 'long']);

// Validation Schema für komplette Wish-Objekte
export const wishSchema = z.object({
	id: z.string().uuid('ID muss eine gültige UUID sein'),
	type: wishTypeSchema,
	eventType: eventTypeSchema,
	relations: z.array(relationSchema).min(1, 'Mindestens eine Relation muss ausgewählt sein'),
	ageGroups: z.array(ageGroupSchema).min(1, 'Mindestens eine Altersgruppe muss ausgewählt sein'),
	specificValues: z.array(z.number().int().positive()).default([]),
	text: z
		.string()
		.min(10, 'Text muss mindestens 10 Zeichen haben')
		.max(1000, 'Text darf nicht länger als 1000 Zeichen sein'),
	isBelated: z.boolean().default(false),
	language: languageSchema,
	length: wishLengthSchema.default('medium'),
	status: wishStatusSchema.default('Entwurf'),
	createdBy: z.string().uuid('CreatedBy muss eine gültige UUID sein'),
	createdAt: z.string().datetime('Muss eine gültige ISO-Datumszeichenfolge sein'),
	updatedAt: z.string().datetime('Muss eine gültige ISO-Datumszeichenfolge sein'),
	releasedAt: z.string().datetime('Muss eine gültige ISO-Datumszeichenfolge sein').optional()
});

// Schema für das Erstellen neuer Wishes (ohne ID, Timestamps)
export const createWishSchema = wishSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	releasedAt: true
});

// Schema für das Updaten von Wishes (alle Felder optional außer ID)
export const updateWishSchema = wishSchema.partial().required({ id: true });

// Type Guards
export function isValidWishType(value: string): value is WishType {
	return Object.values(WishType).includes(value as WishType);
}

export function isValidEventType(value: string): value is EventType {
	return Object.values(EventType).includes(value as EventType);
}

export function isValidWishStatus(value: string): value is WishStatus {
	return Object.values(WishStatus).includes(value as WishStatus);
}

export function isValidLanguage(value: string): value is Language {
	// With dynamic languages, any string is potentially valid
	return typeof value === 'string' && value.length > 0;
}

// Released Wish Interface für öffentliche API
export interface ReleasedWish {
	/** UUID des released wish */
	id: string;

	/** UUID des ursprünglichen Wunsches */
	originalWishId: string;

	/** Art des Wunsches */
	type: 'normal' | 'heartfelt' | 'funny';

	/** Anlass */
	eventType: 'birthday' | 'anniversary' | 'custom';

	/** Ziel-Beziehung(en) */
	relations: ('friend' | 'family' | 'partner' | 'colleague')[];

	/** Ziel-Altersgruppe(n) */
	ageGroups: ('young' | 'middle' | 'senior' | 'all')[];

	/** Array mit Zahlen für Meilensteine */
	specificValues: number[];

	/** Der Haupttext des Wunsches mit Platzhaltern */
	text: string;

	/** Gibt an, ob es sich um einen nachträglichen Wunsch handelt */
	isBelated: boolean;

	/** Sprache des Wunsches */
	language: string;

	/** Gewünschte Länge des Wunsches */
	length: 'short' | 'medium' | 'long';

	/** Zeitpunkt der Freigabe */
	releasedAt: string; // ISO date string
}

// Validation Schema für ReleasedWish
export const releasedWishSchema = z.object({
	id: z.string().uuid(),
	originalWishId: z.string().uuid(),
	type: wishTypeSchema,
	eventType: eventTypeSchema,
	relations: z.array(relationSchema).min(1),
	ageGroups: z.array(ageGroupSchema).min(1),
	specificValues: z.array(z.number().int().positive()).default([]),
	text: z.string().min(10).max(1000),
	isBelated: z.boolean(),
	language: languageSchema,
	length: wishLengthSchema,
	releasedAt: z.string().datetime('Muss eine gültige ISO-Datumszeichenfolge sein')
});

// Helper Types für Formulare
export type WishFormData = z.infer<typeof createWishSchema>;
export type WishUpdateData = z.infer<typeof updateWishSchema>;

// Form State Type für Component Props
export interface WishFormState {
	type: 'normal' | 'heartfelt' | 'funny';
	eventType: 'birthday' | 'anniversary' | 'custom';
	relations: string[];
	ageGroups: string[];
	specificValues: string | number;
	text: string;
	isBelated: boolean;
	language: string;
	length: 'short' | 'medium' | 'long';
}
