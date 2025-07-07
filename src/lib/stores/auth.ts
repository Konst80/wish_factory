import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/User';

export interface AuthStore {
	user: User | null;
	session: Session | null;
	profile: UserProfile | null;
	loading: boolean;
	error: string | null;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthStore>({
		user: null,
		session: null,
		profile: null,
		loading: false, // Start with false for testing
		error: null
	});

	let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

	const initialize = async () => {
		if (!browser) return;

		// Temporarily use mock data for UI testing
		set({
			user: { id: 'mock-user-id', email: 'test@example.com' } as User,
			session: { user: { id: 'mock-user-id' } } as Session,
			profile: {
				id: 'mock-user-id',
				email: 'test@example.com',
				full_name: 'Test User',
				role: 'Administrator',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			loading: false,
			error: null
		});
	};

	const setLoading = (loading: boolean) => {
		update((state) => ({ ...state, loading }));
	};

	const setError = (error: string | null) => {
		update((state) => ({ ...state, error }));
	};

	const updateProfile = (profile: UserProfile) => {
		update((state) => ({ ...state, profile }));
	};

	const destroy = () => {
		if (authSubscription) {
			authSubscription.data.subscription.unsubscribe();
			authSubscription = null;
		}
	};

	return {
		subscribe,
		initialize,
		setLoading,
		setError,
		updateProfile,
		destroy
	};
}

export const auth = createAuthStore();

export const isAuthenticated = derived(auth, ($auth) => !!$auth.user);

export const isAdmin = derived(auth, ($auth) => $auth.profile?.role === 'Administrator');

export const isRedakteur = derived(auth, ($auth) => $auth.profile?.role === 'Redakteur');

export const userRole = derived(auth, ($auth) => $auth.profile?.role || null);

export const canCreateWishes = derived(auth, ($auth) => !!$auth.user && !!$auth.profile);

export const canApproveWishes = derived(auth, ($auth) => $auth.profile?.role === 'Administrator');

export const canManageUsers = derived(auth, ($auth) => $auth.profile?.role === 'Administrator');

export const currentUserId = derived(auth, ($auth) => $auth.user?.id || null);

export const currentUserProfile = derived(auth, ($auth) => $auth.profile);

export const authError = derived(auth, ($auth) => $auth.error);

export const isAuthLoading = derived(auth, ($auth) => $auth.loading);

if (browser) {
	auth.initialize();
}
