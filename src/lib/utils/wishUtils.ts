import type { Language, WishStatus, EventType, Relation, AgeGroup } from '../types/Wish';
import { WishStatus as WishStatusEnum } from '../types/Wish';
import type { UserRole as UserRoleType } from '../types/User';
import { UserRole, ROLE_PERMISSIONS, type Permission } from '../types/User';

/**
 * Validiert ob ein String eine gültige UUID ist
 * @param id - Zu prüfende ID
 * @returns true wenn es eine gültige UUID ist
 */
export function isValidUUID(id: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(id);
}

/**
 * Validiert erlaubte Status-Übergänge basierend auf Benutzerrolle
 * @param currentStatus - Aktueller Status
 * @param newStatus - Gewünschter neuer Status
 * @param userRole - Rolle des Benutzers
 * @returns true wenn Übergang erlaubt ist
 */
export function isValidStatusTransition(
	currentStatus: WishStatus,
	newStatus: WishStatus,
	userRole: UserRoleType
): boolean {
	// Redakteur Berechtigungen
	if (userRole === UserRole.REDAKTEUR) {
		// Kann von Entwurf zu "Zur Freigabe" wechseln
		if (currentStatus === WishStatusEnum.ENTWURF && newStatus === WishStatusEnum.ZUR_FREIGABE) {
			return true;
		}
		// Kann von "Zur Freigabe" zurück zu Entwurf wechseln
		if (currentStatus === WishStatusEnum.ZUR_FREIGABE && newStatus === WishStatusEnum.ENTWURF) {
			return true;
		}
		return false;
	}

	// Administrator Berechtigungen
	if (userRole === UserRole.ADMINISTRATOR) {
		// Kann alle Übergänge
		const validTransitions: Record<WishStatus, WishStatus[]> = {
			[WishStatusEnum.ENTWURF]: [WishStatusEnum.ZUR_FREIGABE, WishStatusEnum.ARCHIVIERT],
			[WishStatusEnum.ZUR_FREIGABE]: [
				WishStatusEnum.ENTWURF,
				WishStatusEnum.FREIGEGEBEN,
				WishStatusEnum.ARCHIVIERT
			],
			[WishStatusEnum.FREIGEGEBEN]: [WishStatusEnum.ARCHIVIERT],
			[WishStatusEnum.ARCHIVIERT]: [WishStatusEnum.ENTWURF] // Reaktivierung möglich
		};

		return validTransitions[currentStatus]?.includes(newStatus) || false;
	}

	return false;
}

/**
 * Prüft ob ein Benutzer eine bestimmte Berechtigung hat
 * @param userRole - Rolle des Benutzers
 * @param permission - Gewünschte Berechtigung
 * @returns true wenn Berechtigung vorhanden
 */
export function hasPermission(userRole: UserRoleType, permission: Permission): boolean {
	return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Prüft ob ein Benutzer einen Wish bearbeiten darf
 * @param userRole - Rolle des Benutzers
 * @param wishCreatorId - ID des Wish-Erstellers
 * @param currentUserId - ID des aktuellen Benutzers
 * @returns true wenn Bearbeitung erlaubt
 */
export function canEditWish(
	userRole: UserRoleType,
	wishCreatorId: string,
	currentUserId: string
): boolean {
	// Administrator kann alle Wishes bearbeiten
	if (userRole === UserRole.ADMINISTRATOR) {
		return true;
	}

	// Redakteur kann nur eigene Wishes bearbeiten
	if (userRole === UserRole.REDAKTEUR) {
		return wishCreatorId === currentUserId;
	}

	return false;
}

/**
 * Extrahiert Platzhalter aus einem Text
 * @param text - Text der durchsucht werden soll
 * @returns Array der gefundenen Platzhalter
 */
export function extractPlaceholders(text: string): string[] {
	const matches = text.match(/\[([^\]]+)\]/g);
	return matches || [];
}

/**
 * Validiert ob alle notwendigen Platzhalter im Text vorhanden sind
 * @param text - Zu validierender Text
 * @param requiredPlaceholders - Array der erforderlichen Platzhalter
 * @returns true wenn alle Platzhalter vorhanden sind
 */
export function validatePlaceholders(text: string, requiredPlaceholders: string[]): boolean {
	const foundPlaceholders = extractPlaceholders(text);
	return requiredPlaceholders.every((placeholder) => foundPlaceholders.includes(placeholder));
}

/**
 * Fügt einen Platzhalter in den Text ein
 * @param text - Ursprungstext
 * @param placeholder - Einzufügender Platzhalter (ohne [])
 * @param position - Position wo eingefügt werden soll
 * @returns Text mit eingefügtem Platzhalter
 */
export function insertPlaceholder(text: string, placeholder: string, position: number): string {
	const placeholderText = `[${placeholder}]`;
	return text.slice(0, position) + placeholderText + text.slice(position);
}

/**
 * Standardplatzhalter für Wishes
 */
export const STANDARD_PLACEHOLDERS = {
	NAME: '[Name]',
	AGE: '[Age]',
	EVENT: '[Event]',
	DATE: '[Date]',
	YEAR: '[Year]'
} as const;

/**
 * Filtert Wishes basierend auf Suchkriterien
 */
export interface WishFilters {
	language?: Language;
	status?: WishStatus;
	eventType?: EventType;
	relations?: Relation[];
	ageGroups?: AgeGroup[];
	search?: string;
	belated?: string;
}

/**
 * Erstellt einen Suchstring für Wish-Filterung
 * @param filters - Filter-Objekt
 * @returns Query-String für API-Aufrufe
 */
export function buildWishQueryString(filters: WishFilters): string {
	const params = new URLSearchParams();

	if (filters.language) params.append('language', filters.language);
	if (filters.status) params.append('status', filters.status);
	if (filters.eventType) params.append('eventType', filters.eventType);
	if (filters.relations?.length) params.append('relations', filters.relations.join(','));
	if (filters.ageGroups?.length) params.append('ageGroups', filters.ageGroups.join(','));
	if (filters.search) params.append('search', filters.search);

	return params.toString();
}
