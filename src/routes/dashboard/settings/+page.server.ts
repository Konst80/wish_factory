import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Default settings if none exist
const defaultSettings = {
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
	data_retention: 365
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

		let settings;

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
				settings = defaultSettings;
			} else {
				// Use the newly created settings
				settings = newSettings;
			}
		} else if (settingsError) {
			// Other database errors
			throw settingsError;
		} else {
			// Use existing settings from database
			settings = userSettings;
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
				}
			}
		};
	} catch (error) {
		console.error('Error loading user settings:', error);

		// Try to create default settings record for user
		try {
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
				// Use default settings object
				const settings = defaultSettings;
			} else {
				// Use newly created settings
				const settings = newSettings;
			}
		} catch (insertError) {
			console.error('Failed to create default settings:', insertError);
			// Final fallback to default settings
			const settings = defaultSettings;
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
	}
};
