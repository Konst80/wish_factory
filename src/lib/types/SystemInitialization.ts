/**
 * Types for system initialization and admin setup
 */

export interface SystemInitializationRecord {
	id: string;
	admin_user_id: string;
	admin_email: string;
	admin_full_name: string;
	setup_completed: boolean;
	created_at: string;
}

export interface InitializationStatus {
	isInitialized: boolean;
	hasAdminUsers: boolean;
	requiresSetup: boolean;
	initializationInfo: {
		adminEmail: string;
		completedAt: string;
	} | null;
}

export interface InitializationStatusResponse {
	status: 'success' | 'error';
	data?: InitializationStatus;
	message?: string;
	error?: string;
	timestamp: string;
}

export interface AdminSetupRequest {
	presetPassword: string;
	adminEmail: string;
	adminFullName: string;
	adminPassword: string;
}

export interface AdminSetupResponse {
	status: 'success' | 'error';
	message: string;
	data?: {
		userId: string;
		email: string;
		fullName: string;
		emailConfirmationRequired: boolean;
	};
	error?: string;
	timestamp: string;
}

export interface AdminSetupFormData {
	presetPassword: string;
	adminEmail: string;
	adminFullName: string;
	adminPassword: string;
	adminPasswordConfirm: string;
}

export interface AdminSetupState {
	currentStep: 1 | 2;
	isLoading: boolean;
	error: string;
	success: string;
}