// Settings types for better type safety
export interface NotificationSettings {
	emailNotifications?: boolean;
	pushNotifications?: boolean;
	newWishAlerts?: boolean;
	approvalRequests?: boolean;
	systemUpdates?: boolean;
	weeklyReport?: boolean;
}

export interface PreferencesSettings {
	theme?: string;
	defaultLanguage?: string;
	wishesPerPage?: number;
	autoSave?: boolean;
	confirmBeforeDelete?: boolean;
}

export interface SystemSettings {
	apiAccess?: boolean;
	exportFormat?: 'json' | 'csv' | 'xlsx' | 'pdf' | string;
	backupFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | string;
	dataRetention?: string | number;
}

export interface ProfileSettings {
	fullName?: string;
	email?: string;
	language?: string;
	timezone?: string;
}

export interface AISettings {
	model?: string;
	promptSystem?: string;
	promptTemplate?: string;
	promptAgeYoung?: string;
	promptAgeMiddle?: string;
	promptAgeSenior?: string;
	promptRelationFriend?: string;
	promptRelationFamily?: string;
	promptRelationPartner?: string;
	promptRelationColleague?: string;
	promptBatch?: string;
	promptBelated?: string;
	temperature?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	maxTokens?: number;
}

export interface SpecificValuesSettings {
	birthdayDe?: string;
	anniversaryDe?: string;
	birthdayEn?: string;
	anniversaryEn?: string;
}

export interface AppSettings {
	notifications?: NotificationSettings;
	preferences?: PreferencesSettings;
	system?: SystemSettings;
	profile?: ProfileSettings;
	ai?: AISettings;
	specificValues?: SpecificValuesSettings;
}

export interface SettingsData {
	settings: AppSettings;
	user?: {
		role: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface FormResult {
	type: 'success' | 'failure' | 'error' | 'redirect';
	data?: {
		message?: string;
		[key: string]: unknown;
	};
	status?: number;
	location?: string;
	[key: string]: unknown;
}

export interface EnhanceResult {
	result: FormResult;
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	update: (options?: { reset?: boolean; invalidateAll?: boolean } | undefined) => Promise<void>;
	[key: string]: unknown;
}
