import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/auth/login');
	}

	// Get parent layout data (includes profile)
	const { profile } = await parent();

	try {
		// Get user's current settings from the database
		const { data: userSettings } = await locals.supabase
			.from('user_settings')
			.select('*')
			.eq('user_id', session.user.id)
			.single();

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

		// Merge with existing settings or use defaults
		const settings = userSettings || defaultSettings;

		return {
			user: {
				id: session.user.id,
				email: session.user.email,
				fullName: profile?.full_name || '',
				role: profile?.role || 'Redakteur',
				avatarUrl: profile?.avatar_url || '',
				createdAt: profile?.created_at
			},
			settings: {
				profile: {
					fullName: profile?.full_name || '',
					email: session.user.email || '',
					language: settings.language || 'de',
					timezone: settings.timezone || 'Europe/Berlin',
					avatarUrl: profile?.avatar_url || ''
				},
				notifications: {
					emailNotifications: settings.email_notifications ?? true,
					pushNotifications: settings.push_notifications ?? false,
					newWishAlerts: settings.new_wish_alerts ?? true,
					approvalRequests: settings.approval_requests ?? true,
					systemUpdates: settings.system_updates ?? false,
					weeklyReport: settings.weekly_report ?? true
				},
				preferences: {
					theme: settings.theme || 'light',
					dashboardLayout: settings.dashboard_layout || 'grid',
					defaultLanguage: settings.language || 'de',
					wishesPerPage: settings.wishes_per_page || 25,
					autoSave: settings.auto_save ?? true,
					confirmBeforeDelete: settings.confirm_before_delete ?? true
				},
				system: {
					apiAccess: settings.api_access ?? false,
					exportFormat: settings.export_format || 'json',
					backupFrequency: settings.backup_frequency || 'daily',
					dataRetention: settings.data_retention || 365
				}
			}
		};

	} catch (error) {
		console.error('Error loading user settings:', error);
		
		// Return basic user data with default settings
		return {
			user: {
				id: session.user.id,
				email: session.user.email,
				fullName: profile?.full_name || '',
				role: profile?.role || 'Redakteur',
				avatarUrl: profile?.avatar_url || '',
				createdAt: profile?.created_at
			},
			settings: {
				profile: {
					fullName: profile?.full_name || '',
					email: session.user.email || '',
					language: 'de',
					timezone: 'Europe/Berlin',
					avatarUrl: profile?.avatar_url || ''
				},
				notifications: {
					emailNotifications: true,
					pushNotifications: false,
					newWishAlerts: true,
					approvalRequests: true,
					systemUpdates: false,
					weeklyReport: true
				},
				preferences: {
					theme: 'light',
					dashboardLayout: 'grid',
					defaultLanguage: 'de',
					wishesPerPage: 25,
					autoSave: true,
					confirmBeforeDelete: true
				},
				system: {
					apiAccess: false,
					exportFormat: 'json',
					backupFrequency: 'daily',
					dataRetention: 365
				}
			}
		};
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
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
				.eq('id', session.user.id);

			if (profileError) {
				console.error('Error updating profile:', profileError);
				return fail(500, { message: 'Fehler beim Aktualisieren des Profils' });
			}

			// Update or insert user settings
			const { error: settingsError } = await locals.supabase
				.from('user_settings')
				.upsert({
					user_id: session.user.id,
					language,
					timezone,
					updated_at: new Date().toISOString()
				});

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
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();
		
		try {
			const { error } = await locals.supabase
				.from('user_settings')
				.upsert({
					user_id: session.user.id,
					email_notifications: formData.get('emailNotifications') === 'on',
					push_notifications: formData.get('pushNotifications') === 'on',
					new_wish_alerts: formData.get('newWishAlerts') === 'on',
					approval_requests: formData.get('approvalRequests') === 'on',
					system_updates: formData.get('systemUpdates') === 'on',
					weekly_report: formData.get('weeklyReport') === 'on',
					updated_at: new Date().toISOString()
				});

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
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		const formData = await request.formData();
		
		try {
			const { error } = await locals.supabase
				.from('user_settings')
				.upsert({
					user_id: session.user.id,
					theme: formData.get('theme') as string,
					dashboard_layout: formData.get('dashboardLayout') as string,
					language: formData.get('defaultLanguage') as string,
					wishes_per_page: parseInt(formData.get('wishesPerPage') as string) || 25,
					auto_save: formData.get('autoSave') === 'on',
					confirm_before_delete: formData.get('confirmBeforeDelete') === 'on',
					updated_at: new Date().toISOString()
				});

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
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(401, { message: 'Nicht authentifiziert' });
		}

		// Get user profile for permission checking
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id);

		const profile = profiles && profiles.length > 0 ? profiles[0] : null;
		
		// Only administrators can change system settings
		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { message: 'Keine Berechtigung für System-Einstellungen' });
		}

		const formData = await request.formData();
		
		try {
			const { error } = await locals.supabase
				.from('user_settings')
				.upsert({
					user_id: session.user.id,
					api_access: formData.get('apiAccess') === 'on',
					export_format: formData.get('exportFormat') as string,
					backup_frequency: formData.get('backupFrequency') as string,
					data_retention: parseInt(formData.get('dataRetention') as string) || 365,
					updated_at: new Date().toISOString()
				});

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