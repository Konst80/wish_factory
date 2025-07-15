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
	exportFormat?: string;
	backupFrequency?: string;
	dataRetention?: number;
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
	[key: string]: unknown;
}
