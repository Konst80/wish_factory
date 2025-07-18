import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Extended interface for user settings including AI fields and specific values
interface UserSettingsWithAI {
	user_id: string;
	theme: string;
	language: string;
	timezone: string;
	email_notifications: boolean;
	push_notifications: boolean;
	new_wish_alerts: boolean;
	approval_requests: boolean;
	system_updates: boolean;
	weekly_report: boolean;
	dashboard_layout: string;
	wishes_per_page: number;
	auto_save: boolean;
	confirm_before_delete: boolean;
	api_access: boolean;
	export_format: string;
	backup_frequency: string;
	data_retention: number;
	// AI Settings
	ai_prompt_system?: string;
	ai_prompt_template?: string;
	ai_prompt_age_young?: string;
	ai_prompt_age_middle?: string;
	ai_prompt_age_senior?: string;
	// Relation-specific prompts
	ai_prompt_relation_friend?: string;
	ai_prompt_relation_family?: string;
	ai_prompt_relation_partner?: string;
	ai_prompt_relation_colleague?: string;
	// Batch-specific prompt
	ai_prompt_batch?: string;
	// Belated-specific prompt
	ai_prompt_belated?: string;
	ai_model?: string;
	ai_temperature?: number;
	ai_max_tokens?: number;
	ai_top_p?: number;
	ai_frequency_penalty?: number;
	ai_presence_penalty?: number;
	// Specific Values
	specific_values_birthday_de?: string;
	specific_values_birthday_en?: string;
	specific_values_anniversary_de?: string;
	specific_values_anniversary_en?: string;
	specific_values_custom_de?: string;
	specific_values_custom_en?: string;
	created_at?: string;
	updated_at?: string;
}

// Default settings if none exist
const defaultSettings: Omit<UserSettingsWithAI, 'user_id' | 'created_at' | 'updated_at'> = {
	theme: 'light',
	language: 'de',
	timezone: 'Europe/Berlin',
	email_notifications: true,
	push_notifications: false,
	new_wish_alerts: true,
	approval_requests: true,
	system_updates: false,
	weekly_report: true,
	dashboard_layout: 'grid',
	wishes_per_page: 25,
	auto_save: true,
	confirm_before_delete: true,
	api_access: false,
	export_format: 'json',
	backup_frequency: 'daily',
	data_retention: 365,
	// AI Settings
	ai_prompt_system:
		'Du bist ein Experte für das Schreiben von Glückwünschen. Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt.',
	ai_prompt_template: `Du bist ein Experte für das Schreiben von Glückwünschen. Generiere {count} {countText} in der Sprache "{language}" basierend auf folgenden Kriterien:

**Wichtige Regeln:**
- Verwende IMMER geschlechtsneutrale Sprache (keine "er/sie" Annahmen)
- Nutze die Platzhalter [Name], [Alter], [Anlass] wo sinnvoll
- Der Stil soll "{style}" sein
- Anlass: {eventText}
- Beziehung: {relationTexts}
- Zielgruppe: {ageGroupTexts}
{specificValues}
{additionalInstructions}

**Stil-Definitionen:**
- normal: Freundlich und herzlich, aber nicht übertrieben
- herzlich: Emotional und warmherzig, persönlich
- humorvoll: Lustig und spielerisch, aber respektvoll
- formell: Höflich und professionell, respektvoll

Generiere für jeden Wunsch sowohl einen normalen Text als auch einen nachträglichen (belated) Text.

**KRITISCH WICHTIG: Du MUSST exakt in diesem JSON-Format antworten - KEIN anderes Format ist erlaubt:**

{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches hier",
      "belated": "Nachträglicher Text hier", 
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}

**ANTWORTE NUR MIT DIESEM JSON - KEIN zusätzlicher Text, keine Markdown-Formatierung, keine Erklärungen!**`,

	ai_model: 'anthropic/claude-sonnet-4',
	ai_temperature: 0.8,
	ai_max_tokens: 2000,
	ai_top_p: 0.9,
	ai_frequency_penalty: 0.1,
	ai_presence_penalty: 0.1,
	// Relation-specific prompts
	ai_prompt_relation_friend:
		'Schreibe freundliche, persönliche Wünsche für Freunde. Verwende einen warmen, vertrauten Ton.',
	ai_prompt_relation_family:
		'Schreibe herzliche, familiäre Wünsche. Verwende einen liebevollen, persönlichen Ton.',
	ai_prompt_relation_partner:
		'Schreibe romantische, liebevolle Wünsche für Partner. Verwende einen intimen, zärtlichen Ton.',
	ai_prompt_relation_colleague:
		'Schreibe respektvolle, professionelle Wünsche für Kollegen. Verwende einen höflichen, aber freundlichen Ton.',
	// Batch-specific prompt
	ai_prompt_batch:
		'Generiere eine ausgewogene Mischung von Wünschen für die Batch-Erstellung. Verteilung: 70% Geburtstag, 20% Jubiläum, 10% Sonstiges. Achte auf Vielfalt in Stil und Tonalität innerhalb jeder Kategorie. Berücksichtige verschiedene Altersgruppen und Beziehungsarten für eine repräsentative Sammlung.',
	// Belated-specific prompt
	ai_prompt_belated:
		'Formuliere den Wunsch als nachträglichen Glückwunsch. Beginne mit einer höflichen Entschuldigung für die Verspätung (z.B. "Auch wenn ich etwas spät dran bin..." oder "Nachträglich aber von Herzen..."). Der Ton sollte dennoch warm und herzlich bleiben, ohne übermäßig entschuldigend zu wirken.',
	// Specific Values
	specific_values_birthday_de: '16,18,21,30,40,50,60,65,70,80,90,100',
	specific_values_birthday_en: '16,18,21,30,40,50,60,65,70,80,90,100',
	specific_values_anniversary_de: '1,5,10,15,20,25,30,40,50,60,70',
	specific_values_anniversary_en: '1,5,10,15,20,25,30,40,50,60,70',
	specific_values_custom_de: '5,10,15,20,25,30',
	specific_values_custom_en: '5,10,15,20,25,30'
};

export const load: PageServerLoad = async ({ locals, parent }) => {
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(302, '/auth/login');
	}

	// Get parent layout data (includes profile)
	const { profile } = await parent();

	try {
		// Get user's current settings from the database
		const { data: userSettings, error: settingsError } = await locals.supabase
			.from('user_settings')
			.select('*')
			.eq('user_id', user.id)
			.single();

		let settings: UserSettingsWithAI | null = null;

		// If no settings exist, create default record
		if (settingsError && settingsError.code === 'PGRST116') {
			const { data: newSettings, error: insertError } = await locals.supabase
				.from('user_settings')
				.insert({
					user_id: user.id,
					...defaultSettings
				})
				.select()
				.single();

			if (insertError) {
				console.error('Error creating default settings:', insertError);
				// Fall back to defaults if creation fails
				settings = { user_id: user.id, ...defaultSettings };
			} else {
				// Use the newly created settings
				settings = newSettings as UserSettingsWithAI;
			}
		} else if (settingsError) {
			// Other database errors
			throw settingsError;
		} else {
			// Use existing settings from database
			settings = userSettings as UserSettingsWithAI;
		}

		return {
			user: {
				id: user.id,
				email: user.email,
				fullName: profile?.full_name || '',
				role: profile?.role || 'Redakteur',
				avatarUrl: profile?.avatar_url || '',
				createdAt: profile?.created_at
			},
			settings: {
				profile: {
					fullName: profile?.full_name || '',
					email: user.email || '',
					language: settings?.language || defaultSettings.language,
					timezone: settings?.timezone || defaultSettings.timezone,
					avatarUrl: profile?.avatar_url || ''
				},
				notifications: {
					emailNotifications: settings?.email_notifications ?? defaultSettings.email_notifications,
					pushNotifications: settings?.push_notifications ?? defaultSettings.push_notifications,
					newWishAlerts: settings?.new_wish_alerts ?? defaultSettings.new_wish_alerts,
					approvalRequests: settings?.approval_requests ?? defaultSettings.approval_requests,
					systemUpdates: settings?.system_updates ?? defaultSettings.system_updates,
					weeklyReport: settings?.weekly_report ?? defaultSettings.weekly_report
				},
				preferences: {
					theme: settings?.theme || defaultSettings.theme,
					dashboardLayout: settings?.dashboard_layout || defaultSettings.dashboard_layout,
					defaultLanguage: settings?.language || defaultSettings.language,
					wishesPerPage: settings?.wishes_per_page || defaultSettings.wishes_per_page,
					autoSave: settings?.auto_save ?? defaultSettings.auto_save,
					confirmBeforeDelete:
						settings?.confirm_before_delete ?? defaultSettings.confirm_before_delete
				},
				system: {
					apiAccess: settings?.api_access ?? defaultSettings.api_access,
					exportFormat: settings?.export_format || defaultSettings.export_format,
					backupFrequency: settings?.backup_frequency || defaultSettings.backup_frequency,
					dataRetention: settings?.data_retention || defaultSettings.data_retention
				},
				ai: {
					promptSystem: settings?.ai_prompt_system || defaultSettings.ai_prompt_system,
					promptTemplate: settings?.ai_prompt_template || defaultSettings.ai_prompt_template,
					promptAgeYoung: settings?.ai_prompt_age_young || defaultSettings.ai_prompt_age_young,
					promptAgeMiddle: settings?.ai_prompt_age_middle || defaultSettings.ai_prompt_age_middle,
					promptAgeSenior: settings?.ai_prompt_age_senior || defaultSettings.ai_prompt_age_senior,
					promptRelationFriend:
						settings?.ai_prompt_relation_friend || defaultSettings.ai_prompt_relation_friend,
					promptRelationFamily:
						settings?.ai_prompt_relation_family || defaultSettings.ai_prompt_relation_family,
					promptRelationPartner:
						settings?.ai_prompt_relation_partner || defaultSettings.ai_prompt_relation_partner,
					promptRelationColleague:
						settings?.ai_prompt_relation_colleague || defaultSettings.ai_prompt_relation_colleague,
					promptBatch: settings?.ai_prompt_batch || defaultSettings.ai_prompt_batch,
					promptBelated: settings?.ai_prompt_belated || defaultSettings.ai_prompt_belated,
					model: settings?.ai_model || defaultSettings.ai_model,
					temperature: settings?.ai_temperature ?? defaultSettings.ai_temperature,
					maxTokens: settings?.ai_max_tokens || defaultSettings.ai_max_tokens,
					topP: settings?.ai_top_p ?? defaultSettings.ai_top_p,
					frequencyPenalty: settings?.ai_frequency_penalty ?? defaultSettings.ai_frequency_penalty,
					presencePenalty: settings?.ai_presence_penalty ?? defaultSettings.ai_presence_penalty
				},
				specificValues: {
					birthdayDe:
						settings?.specific_values_birthday_de || defaultSettings.specific_values_birthday_de,
					birthdayEn:
						settings?.specific_values_birthday_en || defaultSettings.specific_values_birthday_en,
					anniversaryDe:
						settings?.specific_values_anniversary_de ||
						defaultSettings.specific_values_anniversary_de,
					anniversaryEn:
						settings?.specific_values_anniversary_en ||
						defaultSettings.specific_values_anniversary_en,
					customDe:
						settings?.specific_values_custom_de || defaultSettings.specific_values_custom_de,
					customEn: settings?.specific_values_custom_en || defaultSettings.specific_values_custom_en
				}
			}
		};
	} catch (error) {
		console.error('Error loading user settings:', error);

		// Try to create default settings record for user
		try {
			const { error: insertError } = await locals.supabase
				.from('user_settings')
				.insert({
					user_id: user.id,
					...defaultSettings
				})
				.select()
				.single();

			if (insertError) {
				console.error('Error creating default settings:', insertError);
				// Use default settings object
			} else {
				// Use newly created settings
			}
		} catch (insertError) {
			console.error('Failed to create default settings:', insertError);
			// Final fallback to default settings
		}

		// Return basic user data with fallback settings
		return {
			user: {
				id: user.id,
				email: user.email,
				fullName: profile?.full_name || '',
				role: profile?.role || 'Redakteur',
				avatarUrl: profile?.avatar_url || '',
				createdAt: profile?.created_at
			},
			settings: {
				profile: {
					fullName: profile?.full_name || '',
					email: user.email || '',
					language: defaultSettings.language,
					timezone: defaultSettings.timezone,
					avatarUrl: profile?.avatar_url || ''
				},
				notifications: {
					emailNotifications: defaultSettings.email_notifications,
					pushNotifications: defaultSettings.push_notifications,
					newWishAlerts: defaultSettings.new_wish_alerts,
					approvalRequests: defaultSettings.approval_requests,
					systemUpdates: defaultSettings.system_updates,
					weeklyReport: defaultSettings.weekly_report
				},
				preferences: {
					theme: defaultSettings.theme,
					dashboardLayout: defaultSettings.dashboard_layout,
					defaultLanguage: defaultSettings.language,
					wishesPerPage: defaultSettings.wishes_per_page,
					autoSave: defaultSettings.auto_save,
					confirmBeforeDelete: defaultSettings.confirm_before_delete
				},
				system: {
					apiAccess: defaultSettings.api_access,
					exportFormat: defaultSettings.export_format,
					backupFrequency: defaultSettings.backup_frequency,
					dataRetention: defaultSettings.data_retention
				},
				ai: {
					promptSystem: defaultSettings.ai_prompt_system,
					promptTemplate: defaultSettings.ai_prompt_template,
					promptAgeYoung: defaultSettings.ai_prompt_age_young,
					promptAgeMiddle: defaultSettings.ai_prompt_age_middle,
					promptAgeSenior: defaultSettings.ai_prompt_age_senior,
					promptRelationFriend: defaultSettings.ai_prompt_relation_friend,
					promptRelationFamily: defaultSettings.ai_prompt_relation_family,
					promptRelationPartner: defaultSettings.ai_prompt_relation_partner,
					promptRelationColleague: defaultSettings.ai_prompt_relation_colleague,
					promptBatch: defaultSettings.ai_prompt_batch,
					promptBelated: defaultSettings.ai_prompt_belated,
					model: defaultSettings.ai_model,
					temperature: defaultSettings.ai_temperature,
					maxTokens: defaultSettings.ai_max_tokens,
					topP: defaultSettings.ai_top_p,
					frequencyPenalty: defaultSettings.ai_frequency_penalty,
					presencePenalty: defaultSettings.ai_presence_penalty
				},
				specificValues: {
					birthdayDe: defaultSettings.specific_values_birthday_de,
					birthdayEn: defaultSettings.specific_values_birthday_en,
					anniversaryDe: defaultSettings.specific_values_anniversary_de,
					anniversaryEn: defaultSettings.specific_values_anniversary_en,
					customDe: defaultSettings.specific_values_custom_de,
					customEn: defaultSettings.specific_values_custom_en
				}
			}
		};
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const language = formData.get('language') as string;
		const timezone = formData.get('timezone') as string;

		try {
			// Update profile
			const { error: profileError } = await locals.supabase
				.from('profiles')
				.update({
					full_name: fullName,
					updated_at: new Date().toISOString()
				})
				.eq('id', user.id);

			if (profileError) {
				console.error('Error updating profile:', profileError);
				return fail(500, { message: 'Fehler beim Aktualisieren des Profils' });
			}

			// Ensure user has settings record and update profile fields
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Update only the profile-related fields
			const { error: settingsError } = await locals.supabase
				.from('user_settings')
				.update({
					language,
					timezone,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (settingsError) {
				console.error('Error updating settings:', settingsError);
				return fail(500, { message: 'Fehler beim Aktualisieren der Einstellungen' });
			}

			return { success: true, message: 'Profil erfolgreich aktualisiert' };
		} catch (error) {
			console.error('Unexpected error updating profile:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	},

	updateNotifications: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();

		try {
			// First ensure user has settings record
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Update only the notification fields
			const { error } = await locals.supabase
				.from('user_settings')
				.update({
					email_notifications: formData.get('emailNotifications') === 'on',
					push_notifications: formData.get('pushNotifications') === 'on',
					new_wish_alerts: formData.get('newWishAlerts') === 'on',
					approval_requests: formData.get('approvalRequests') === 'on',
					system_updates: formData.get('systemUpdates') === 'on',
					weekly_report: formData.get('weeklyReport') === 'on',
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) {
				console.error('Error updating notifications:', error);
				return fail(500, { message: 'Fehler beim Aktualisieren der Benachrichtigungen' });
			}

			return { success: true, message: 'Benachrichtigungseinstellungen erfolgreich aktualisiert' };
		} catch (error) {
			console.error('Unexpected error updating notifications:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	},

	updatePreferences: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();

		try {
			// First ensure user has settings record
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Update only the preference fields
			const { error } = await locals.supabase
				.from('user_settings')
				.update({
					theme: formData.get('theme') as string,
					dashboard_layout: formData.get('dashboardLayout') as string,
					language: formData.get('defaultLanguage') as string,
					wishes_per_page: parseInt(formData.get('wishesPerPage') as string) || 25,
					auto_save: formData.get('autoSave') === 'on',
					confirm_before_delete: formData.get('confirmBeforeDelete') === 'on',
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) {
				console.error('Error updating preferences:', error);
				return fail(500, { message: 'Fehler beim Aktualisieren der Einstellungen' });
			}

			return { success: true, message: 'Einstellungen erfolgreich aktualisiert' };
		} catch (error) {
			console.error('Unexpected error updating preferences:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	},

	updateSystem: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Only administrators can change system settings
		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung für System-Einstellungen' });
		}

		const formData = await request.formData();

		try {
			// First ensure user has settings record
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Update only the system fields
			const { error } = await locals.supabase
				.from('user_settings')
				.update({
					api_access: formData.get('apiAccess') === 'on',
					export_format: formData.get('exportFormat') as string,
					backup_frequency: formData.get('backupFrequency') as string,
					data_retention: parseInt(formData.get('dataRetention') as string) || 365,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) {
				console.error('Error updating system settings:', error);
				return fail(500, { message: 'Fehler beim Aktualisieren der System-Einstellungen' });
			}

			return { success: true, message: 'System-Einstellungen erfolgreich aktualisiert' };
		} catch (error) {
			console.error('Unexpected error updating system settings:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	},

	updateAI: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Only administrators can change AI settings
		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung für AI-Einstellungen' });
		}

		const formData = await request.formData();

		try {
			// First ensure user has settings record
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Parse numeric values
			const temperature = parseFloat(formData.get('temperature') as string) || 0.8;
			const maxTokens = parseInt(formData.get('maxTokens') as string) || 2000;
			const topP = parseFloat(formData.get('topP') as string) || 0.9;
			const frequencyPenalty = parseFloat(formData.get('frequencyPenalty') as string) || 0.1;
			const presencePenalty = parseFloat(formData.get('presencePenalty') as string) || 0.1;

			// Validate ranges
			if (temperature < 0 || temperature > 2) {
				return fail(400, { message: 'Temperature muss zwischen 0 und 2 liegen' });
			}
			if (topP <= 0 || topP > 1) {
				return fail(400, { message: 'Top-P muss zwischen 0 und 1 liegen' });
			}

			// Build update object with only non-null values
			const updateData: Partial<UserSettingsWithAI> = {
				ai_model: formData.get('model') as string,
				ai_temperature: temperature,
				ai_max_tokens: maxTokens,
				ai_top_p: topP,
				ai_frequency_penalty: frequencyPenalty,
				ai_presence_penalty: presencePenalty,
				updated_at: new Date().toISOString()
			};

			// Only update prompts if they are provided (not null/empty)
			const promptSystem = formData.get('promptSystem') as string;
			const promptTemplate = formData.get('promptTemplate') as string;
			const promptAgeYoung = formData.get('promptAgeYoung') as string;
			const promptAgeMiddle = formData.get('promptAgeMiddle') as string;
			const promptAgeSenior = formData.get('promptAgeSenior') as string;

			if (promptSystem !== null && promptSystem !== undefined) {
				updateData.ai_prompt_system = promptSystem;
			}
			if (promptTemplate !== null && promptTemplate !== undefined) {
				updateData.ai_prompt_template = promptTemplate;
			}
			if (promptAgeYoung !== null && promptAgeYoung !== undefined) {
				updateData.ai_prompt_age_young = promptAgeYoung;
			}
			if (promptAgeMiddle !== null && promptAgeMiddle !== undefined) {
				updateData.ai_prompt_age_middle = promptAgeMiddle;
			}
			if (promptAgeSenior !== null && promptAgeSenior !== undefined) {
				updateData.ai_prompt_age_senior = promptAgeSenior;
			}

			// Only update relation prompts if they are provided
			const promptRelationFriend = formData.get('promptRelationFriend') as string;
			const promptRelationFamily = formData.get('promptRelationFamily') as string;
			const promptRelationPartner = formData.get('promptRelationPartner') as string;
			const promptRelationColleague = formData.get('promptRelationColleague') as string;
			const promptBatch = formData.get('promptBatch') as string;
			const promptBelated = formData.get('promptBelated') as string;

			if (promptRelationFriend !== null && promptRelationFriend !== undefined) {
				updateData.ai_prompt_relation_friend = promptRelationFriend;
			}
			if (promptRelationFamily !== null && promptRelationFamily !== undefined) {
				updateData.ai_prompt_relation_family = promptRelationFamily;
			}
			if (promptRelationPartner !== null && promptRelationPartner !== undefined) {
				updateData.ai_prompt_relation_partner = promptRelationPartner;
			}
			if (promptRelationColleague !== null && promptRelationColleague !== undefined) {
				updateData.ai_prompt_relation_colleague = promptRelationColleague;
			}
			if (promptBatch !== null && promptBatch !== undefined) {
				updateData.ai_prompt_batch = promptBatch;
			}
			if (promptBelated !== null && promptBelated !== undefined) {
				updateData.ai_prompt_belated = promptBelated;
			}

			// Only update specific values if they are provided
			const specificValuesBirthdayDe = formData.get('specificValuesBirthdayDe') as string;
			const specificValuesBirthdayEn = formData.get('specificValuesBirthdayEn') as string;
			const specificValuesAnniversaryDe = formData.get('specificValuesAnniversaryDe') as string;
			const specificValuesAnniversaryEn = formData.get('specificValuesAnniversaryEn') as string;
			const specificValuesCustomDe = formData.get('specificValuesCustomDe') as string;
			const specificValuesCustomEn = formData.get('specificValuesCustomEn') as string;

			if (specificValuesBirthdayDe !== null && specificValuesBirthdayDe !== undefined) {
				updateData.specific_values_birthday_de = specificValuesBirthdayDe;
			}
			if (specificValuesBirthdayEn !== null && specificValuesBirthdayEn !== undefined) {
				updateData.specific_values_birthday_en = specificValuesBirthdayEn;
			}
			if (specificValuesAnniversaryDe !== null && specificValuesAnniversaryDe !== undefined) {
				updateData.specific_values_anniversary_de = specificValuesAnniversaryDe;
			}
			if (specificValuesAnniversaryEn !== null && specificValuesAnniversaryEn !== undefined) {
				updateData.specific_values_anniversary_en = specificValuesAnniversaryEn;
			}
			if (specificValuesCustomDe !== null && specificValuesCustomDe !== undefined) {
				updateData.specific_values_custom_de = specificValuesCustomDe;
			}
			if (specificValuesCustomEn !== null && specificValuesCustomEn !== undefined) {
				updateData.specific_values_custom_en = specificValuesCustomEn;
			}

			// Update AI settings with only the provided fields
			const { error } = await locals.supabase
				.from('user_settings')
				.update(updateData)
				.eq('user_id', user.id);

			if (error) {
				console.error('Error updating AI settings:', error);
				return fail(500, { message: 'Fehler beim Aktualisieren der AI-Einstellungen' });
			}

			return {
				success: true,
				message: 'AI-Einstellungen und spezifische Werte erfolgreich aktualisiert'
			};
		} catch (error) {
			console.error('Unexpected error updating AI settings:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	},

	updateSpecificValues: async ({ request, locals }) => {
		const {
			data: { user },
			error: userError
		} = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;

		// Only administrators can change specific values
		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung für spezifische Werte-Einstellungen' });
		}

		const formData = await request.formData();

		try {
			// First ensure user has settings record
			const { data: existingSettings } = await locals.supabase
				.from('user_settings')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (!existingSettings) {
				// Create default settings first
				await locals.supabase.from('user_settings').insert({
					user_id: user.id,
					...defaultSettings
				});
			}

			// Get form values and validate
			const specificValuesBirthdayDe = (formData.get('specificValuesBirthdayDe') as string) || '';
			const specificValuesBirthdayEn = (formData.get('specificValuesBirthdayEn') as string) || '';
			const specificValuesAnniversaryDe =
				(formData.get('specificValuesAnniversaryDe') as string) || '';
			const specificValuesAnniversaryEn =
				(formData.get('specificValuesAnniversaryEn') as string) || '';
			const specificValuesCustomDe = (formData.get('specificValuesCustomDe') as string) || '';
			const specificValuesCustomEn = (formData.get('specificValuesCustomEn') as string) || '';

			// Validate that values are comma-separated numbers
			const validateValues = (values: string, fieldName: string) => {
				if (!values.trim()) return true; // Empty is OK
				const parts = values.split(',').map((v) => v.trim());
				for (const part of parts) {
					if (part && isNaN(parseInt(part))) {
						return `${fieldName} enthält ungültige Zahlen. Bitte verwenden Sie nur durch Kommas getrennte Zahlen.`;
					}
				}
				return true;
			};

			// Validate all fields
			const validations = [
				validateValues(specificValuesBirthdayDe, 'Geburtstag (Deutsch)'),
				validateValues(specificValuesBirthdayEn, 'Geburtstag (English)'),
				validateValues(specificValuesAnniversaryDe, 'Jubiläum (Deutsch)'),
				validateValues(specificValuesAnniversaryEn, 'Jubiläum (English)'),
				validateValues(specificValuesCustomDe, 'Individuell (Deutsch)'),
				validateValues(specificValuesCustomEn, 'Individuell (English)')
			];

			for (const validation of validations) {
				if (validation !== true) {
					return fail(400, { message: validation });
				}
			}

			// Update specific values
			const { error } = await locals.supabase
				.from('user_settings')
				.update({
					specific_values_birthday_de: specificValuesBirthdayDe,
					specific_values_birthday_en: specificValuesBirthdayEn,
					specific_values_anniversary_de: specificValuesAnniversaryDe,
					specific_values_anniversary_en: specificValuesAnniversaryEn,
					specific_values_custom_de: specificValuesCustomDe,
					specific_values_custom_en: specificValuesCustomEn,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) {
				console.error('Error updating specific values:', error);
				return fail(500, { message: 'Fehler beim Aktualisieren der spezifischen Werte' });
			}

			return { success: true, message: 'Spezifische Werte erfolgreich aktualisiert' };
		} catch (error) {
			console.error('Unexpected error updating specific values:', error);
			return fail(500, { message: 'Ein unerwarteter Fehler ist aufgetreten' });
		}
	}
};
