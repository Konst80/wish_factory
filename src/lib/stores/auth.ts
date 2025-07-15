import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/User';
import { supabase } from '../supabase';

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
		if (!browser || !supabase) return;

		try {
			update((state) => ({ ...state, loading: true }));

			// Get initial user (secure method)
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (error) {
				console.error('Error getting user:', error);
				update((state) => ({ ...state, error: error.message, loading: false }));
				return;
			}

			// Set up auth state listener
			const {
				data: { subscription }
			} = supabase.auth.onAuthStateChange(async (event, session) => {
				if (session?.user) {
					// Validate user with getUser() for security
					const {
						data: { user: validatedUser },
						error: userError
					} = await supabase!.auth.getUser();
					if (userError || !validatedUser) {
						console.error('User validation failed:', userError);
						set({
							user: null,
							session: null,
							profile: null,
							loading: false,
							error: null
						});
						return;
					}
					await loadUserProfile(validatedUser);
				} else {
					set({
						user: null,
						session: null,
						profile: null,
						loading: false,
						error: null
					});
				}
			});

			authSubscription = { data: { subscription } };

			// Load initial profile if user exists
			if (user) {
				await loadUserProfile(user);
			} else {
				update((state) => ({ ...state, loading: false }));
			}
		} catch (err) {
			console.error('Error initializing auth:', err);
			update((state) => ({
				...state,
				error: err instanceof Error ? err.message : 'Unknown error',
				loading: false
			}));
		}
	};

	const loadUserProfile = async (user: User) => {
		try {
			const { data: profiles, error } = await supabase!
				.from('profiles')
				.select('*')
				.eq('id', user.id);

			if (error) {
				console.error('Error loading profile:', error);
				update((state) => ({ ...state, error: error.message }));
				return;
			}

			const profile = profiles && profiles.length > 0 ? profiles[0] : null;

			if (!profile) {
				console.error('No profile found for user:', user.id);
				update((state) => ({ ...state, error: 'Profile not found' }));
				return;
			}

			update((state) => ({
				...state,
				user,
				session: { user } as Session,
				profile,
				loading: false,
				error: null
			}));
		} catch (err) {
			console.error('Error loading profile:', err);
			update((state) => ({
				...state,
				error: err instanceof Error ? err.message : 'Unknown error',
				loading: false
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

	const signIn = async (email: string, password: string) => {
		if (!supabase) return { error: 'Supabase not initialized' };

		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				setError(error.message);
				setLoading(false);
				return { error: error.message };
			}

			// Profile will be loaded automatically by the auth state listener
			return { data };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			setError(errorMessage);
			setLoading(false);
			return { error: errorMessage };
		}
	};

	const signOut = async () => {
		if (!supabase) return;

		try {
			setLoading(true);
			await supabase.auth.signOut();

			// Manually clear state to ensure immediate logout
			set({
				user: null,
				session: null,
				profile: null,
				loading: false,
				error: null
			});
		} catch (err) {
			console.error('Error signing out:', err);
			// Even if signOut fails, clear the local state
			set({
				user: null,
				session: null,
				profile: null,
				loading: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			});
		}
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
		signIn,
		signOut,
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
