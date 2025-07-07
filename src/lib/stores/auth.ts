import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { onAuthStateChange, getCurrentUser, getCurrentSession, getUserProfile } from '../auth';
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
		loading: true,
		error: null
	});

	let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

	const initialize = async () => {
		if (!browser) return;

		try {
			update((state) => ({ ...state, loading: true }));

			const [user, session] = await Promise.all([getCurrentUser(), getCurrentSession()]);

			if (user && session) {
				const profile = await getUserProfile(user.id);
				set({
					user,
					session,
					profile,
					loading: false,
					error: null
				});
			} else {
				set({
					user: null,
					session: null,
					profile: null,
					loading: false,
					error: null
				});
			}

			authSubscription = onAuthStateChange(async (event, session) => {
				if (event === 'SIGNED_IN' && session) {
					const profile = await getUserProfile(session.user.id);
					set({
						user: session.user,
						session,
						profile,
						loading: false,
						error: null
					});
				} else if (event === 'SIGNED_OUT') {
					set({
						user: null,
						session: null,
						profile: null,
						loading: false,
						error: null
					});
				}
			});
		} catch (error) {
			console.error('Auth initialization error:', error);
			update((state) => ({
				...state,
				loading: false,
				error: error instanceof Error ? error.message : 'Authentication error'
			}));
		}
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
