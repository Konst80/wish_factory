import { z } from 'zod';

// User Roles basierend auf FRS
export const UserRole = {
	REDAKTEUR: 'Redakteur',
	ADMINISTRATOR: 'Administrator'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// User Interface
export interface User {
	/** User UUID (von Supabase Auth) */
	id: string;

	/** Email Adresse */
	email: string;

	/** Vollständiger Name */
	fullName: string;

	/** Benutzerrolle */
	role: UserRole;

	/** Erstellungsdatum */
	createdAt: Date;

	/** Letztes Update */
	updatedAt: Date;
}

// User Profile Interface (erweitert User für Supabase)
export interface UserProfile {
	id: string;
	email: string;
	full_name: string;
	role: UserRole;
	avatar_url?: string | null;
	created_at: string | null;
	updated_at: string | null;
}

// Zod Schemas
export const userRoleSchema = z.enum(['Redakteur', 'Administrator']);

export const userSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
	fullName: z
		.string()
		.min(2, 'Name muss mindestens 2 Zeichen haben')
		.max(100, 'Name darf nicht länger als 100 Zeichen sein'),
	role: userRoleSchema,
	createdAt: z.date(),
	updatedAt: z.date()
});

export const userProfileSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	full_name: z.string().min(2).max(100),
	role: userRoleSchema.default('Redakteur'),
	avatar_url: z.string().nullable().optional(),
	created_at: z.string().nullable(),
	updated_at: z.string().nullable()
});

// Schema für das Erstellen neuer User Profiles
export const createUserProfileSchema = userProfileSchema.omit({
	created_at: true,
	updated_at: true
});

// Schema für das Updaten von User Profiles
export const updateUserProfileSchema = userProfileSchema.partial().required({ id: true });

// Type Guards
export function isValidUserRole(value: string): value is UserRole {
	return Object.values(UserRole).includes(value as UserRole);
}

// Helper für Berechtigungen
export const Permissions = {
	// Redakteur Berechtigungen
	CREATE_WISH: 'create_wish',
	EDIT_OWN_WISH: 'edit_own_wish',
	SUBMIT_FOR_APPROVAL: 'submit_for_approval',

	// Administrator Berechtigungen
	APPROVE_WISH: 'approve_wish',
	ARCHIVE_WISH: 'archive_wish',
	EDIT_ANY_WISH: 'edit_any_wish',
	MANAGE_USERS: 'manage_users'
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// Berechtigungen pro Rolle
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	[UserRole.REDAKTEUR]: [
		Permissions.CREATE_WISH,
		Permissions.EDIT_OWN_WISH,
		Permissions.SUBMIT_FOR_APPROVAL
	],
	[UserRole.ADMINISTRATOR]: [
		Permissions.CREATE_WISH,
		Permissions.EDIT_OWN_WISH,
		Permissions.SUBMIT_FOR_APPROVAL,
		Permissions.APPROVE_WISH,
		Permissions.ARCHIVE_WISH,
		Permissions.EDIT_ANY_WISH,
		Permissions.MANAGE_USERS
	]
};

// Helper Types
export type UserFormData = z.infer<typeof createUserProfileSchema>;
export type UserUpdateData = z.infer<typeof updateUserProfileSchema>;
