// API Keys Management Page Server
// File: src/routes/dashboard/api-keys/+page.server.ts

import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { ApiKeyService } from '$lib/server/api-key-service';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	// Get current user's profile to check permissions
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (!profile) {
		throw redirect(302, '/auth');
	}

	// Only administrators can access API key management
	if (profile.role !== 'Administrator') {
		throw redirect(302, '/dashboard');
	}

	// Load all API keys
	const apiKeys = await ApiKeyService.getApiKeys();

	return {
		profile,
		apiKeys
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get current user's profile to check permissions
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, id')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const name = formData.get('name') as string;
			const description = formData.get('description') as string;
			const rateLimitPerHour = parseInt(formData.get('rateLimitPerHour') as string) || 1000;
			const expiresAt = formData.get('expiresAt') as string;

			if (!name?.trim()) {
				return fail(400, { error: 'Name is required' });
			}

			const result = await ApiKeyService.createApiKey(
				{
					name: name.trim(),
					description: description?.trim() || undefined,
					rateLimitPerHour,
					expiresAt: expiresAt ? new Date(expiresAt) : undefined
				},
				profile.id
			);

			if ('error' in result) {
				return fail(500, { error: result.error });
			}

			return {
				success: true,
				message: 'API Key created successfully',
				apiKey: result.apiKey,
				plainKey: result.plainKey
			};
		} catch (error) {
			console.error('Error creating API key:', error);
			return fail(500, { error: 'Failed to create API key' });
		}
	},

	deactivate: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get current user's profile to check permissions
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, id')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const keyId = formData.get('keyId') as string;

			if (!keyId) {
				return fail(400, { error: 'Key ID is required' });
			}

			const success = await ApiKeyService.deactivateApiKey(keyId);

			if (!success) {
				return fail(500, { error: 'Failed to deactivate API key' });
			}

			return {
				success: true,
				message: 'API Key deactivated successfully'
			};
		} catch (error) {
			console.error('Error deactivating API key:', error);
			return fail(500, { error: 'Failed to deactivate API key' });
		}
	},

	activate: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get current user's profile to check permissions
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, id')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const keyId = formData.get('keyId') as string;

			if (!keyId) {
				return fail(400, { error: 'Key ID is required' });
			}

			const success = await ApiKeyService.activateApiKey(keyId);

			if (!success) {
				return fail(500, { error: 'Failed to activate API key' });
			}

			return {
				success: true,
				message: 'API Key activated successfully'
			};
		} catch (error) {
			console.error('Error activating API key:', error);
			return fail(500, { error: 'Failed to activate API key' });
		}
	},

	delete: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get current user's profile to check permissions
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, id')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const keyId = formData.get('keyId') as string;

			if (!keyId) {
				return fail(400, { error: 'Key ID is required' });
			}

			const success = await ApiKeyService.deleteApiKey(keyId);

			if (!success) {
				return fail(500, { error: 'Failed to delete API key' });
			}

			return {
				success: true,
				message: 'API Key deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting API key:', error);
			return fail(500, { error: 'Failed to delete API key' });
		}
	},

	update: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Get current user's profile to check permissions
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, id')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const keyId = formData.get('keyId') as string;
			const rateLimitPerHour = parseInt(formData.get('rateLimitPerHour') as string);
			const description = formData.get('description') as string;
			const expiresAt = formData.get('expiresAt') as string;

			if (!keyId) {
				return fail(400, { error: 'Key ID is required' });
			}

			if (!rateLimitPerHour || rateLimitPerHour < 1 || rateLimitPerHour > 10000) {
				return fail(400, { error: 'Rate limit must be between 1 and 10000' });
			}

			const updates = {
				rateLimitPerHour,
				description: description?.trim() || undefined,
				expiresAt: expiresAt ? new Date(expiresAt) : null
			};

			const success = await ApiKeyService.updateApiKey(keyId, updates);

			if (!success) {
				return fail(500, { error: 'Failed to update API key' });
			}

			return {
				success: true,
				message: 'API Key updated successfully'
			};
		} catch (error) {
			console.error('Error updating API key:', error);
			return fail(500, { error: 'Failed to update API key' });
		}
	}
};
