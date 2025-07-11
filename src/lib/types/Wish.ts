import { z } from 'zod';

// Enums für Wish-Typen basierend auf FRS
export const WishType = {
	NORMAL: 'normal',
	HERZLICH: 'herzlich',
	HUMORVOLL: 'humorvoll'
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

// TypeScript Typen
export type WishType = (typeof WishType)[keyof typeof WishType];
export type EventType = (typeof EventType)[keyof typeof EventType];
export type WishStatus = (typeof WishStatus)[keyof typeof WishStatus];
export type Language = (typeof Language)[keyof typeof Language];
export type Relation = (typeof Relation)[keyof typeof Relation];
export type AgeGroup = (typeof AgeGroup)[keyof typeof AgeGroup];

// Wish Interface basierend auf FRS Spezifikation
export interface Wish {
	/** Eindeutiger, systemgenerierter UUID Identifikator */
	id: string;

	/** Art des Wunsches */
	type: WishType;

	/** Anlass */
	eventType: EventType;

	/** Ziel-Beziehung(en) */
	relations: Relation[];

	/** Ziel-Altersgruppe(n) */
	ageGroups: AgeGroup[];

	/** Array mit Zahlen für Meilensteine (z.B. [18, 30, 50] für Geburtstage). Kann leer sein. */
	specificValues: number[];

	/** Der Haupttext des Wunsches mit Platzhaltern */
	text: string;

	/** Gibt an, ob es sich um einen nachträglichen Wunsch handelt */
	belated: boolean;

	/** Der aktuelle Workflow-Status */
	status: WishStatus;

	/** Sprache des Wunsches */
	language: Language;

	/** Erstellungsdatum */
	createdAt: Date;

	/** Letztes Update */
	updatedAt: Date;

	/** Ersteller (User ID) */
	createdBy: string;
}

// Zod Validation Schemas
export const wishTypeSchema = z.enum(['normal', 'herzlich', 'humorvoll']);
export const eventTypeSchema = z.enum(['birthday', 'anniversary', 'custom']);
export const wishStatusSchema = z.enum(['Entwurf', 'Zur Freigabe', 'Freigegeben', 'Archiviert']);
export const languageSchema = z.enum(['de', 'en']);
export const relationSchema = z.enum(['friend', 'family', 'partner', 'colleague']);
export const ageGroupSchema = z.enum(['all', 'young', 'middle', 'senior']);

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
	belated: z.boolean().default(false),
	status: wishStatusSchema.default('Entwurf'),
	language: languageSchema,
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
	createdBy: z.string().uuid('Creator muss eine gültige UUID sein')
});

// Schema für das Erstellen neuer Wishes (ohne ID, Timestamps)
export const createWishSchema = wishSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true
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
	return Object.values(Language).includes(value as Language);
}

// Helper Types für Formulare
export type WishFormData = z.infer<typeof createWishSchema>;
export type WishUpdateData = z.infer<typeof updateWishSchema>;
