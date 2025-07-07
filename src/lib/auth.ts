import { supabase } from './supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';
import type { UserProfile } from './types/User';

export interface AuthResult {
	user: User | null;
	session: Session | null;
	error: AuthError | null;
}

export interface AuthState {
	user: User | null;
	session: Session | null;
	profile: UserProfile | null;
	loading: boolean;
	error: string | null;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
	if (!supabase) {
		return {
			user: null,
			session: null,
			error: new Error('Supabase client not available') as AuthError
		};
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	return {
		user: data.user,
		session: data.session,
		error
	};
}

export async function signUpWithEmail(
	email: string,
	password: string,
	fullName: string
): Promise<AuthResult> {
	if (!supabase) {
		return {
			user: null,
			session: null,
			error: new Error('Supabase client not available') as AuthError
		};
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				full_name: fullName
			}
		}
	});

	return {
		user: data.user,
		session: data.session,
		error
	};
}

export async function signOut(): Promise<{ error: AuthError | null }> {
	if (!supabase) {
		return { error: new Error('Supabase client not available') as AuthError };
	}

	const { error } = await supabase.auth.signOut();
	return { error };
}

export async function getCurrentUser(): Promise<User | null> {
	if (!supabase) {
		return null;
	}

	const { data } = await supabase.auth.getUser();
	return data.user;
}

export async function getCurrentSession(): Promise<Session | null> {
	if (!supabase) {
		return null;
	}

	// Use getUser() for secure validation, then get session
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();
	if (error || !user) {
		return null;
	}

	const { data } = await supabase.auth.getSession();
	return data.session;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
	if (!supabase) {
		return null;
	}

	const { data: profiles, error } = await supabase.from('profiles').select('*').eq('id', userId);

	if (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}

	return profiles && profiles.length > 0 ? profiles[0] : null;
}

export async function updateUserProfile(
	userId: string,
	updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: UserProfile | null; error: Error | null }> {
	if (!supabase) {
		return { data: null, error: new Error('Supabase client not available') };
	}

	const { data, error } = await supabase
		.from('profiles')
		.update(updates)
		.eq('id', userId)
		.select()
		.single();

	return { data, error };
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
	if (!supabase) {
		return { error: new Error('Supabase client not available') as AuthError };
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/reset-password`
	});

	return { error };
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
	if (!supabase) {
		return { error: new Error('Supabase client not available') as AuthError };
	}

	const { error } = await supabase.auth.updateUser({
		password: newPassword
	});

	return { error };
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
	if (!supabase) {
		return { data: { subscription: { unsubscribe: () => {} } } };
	}

	return supabase.auth.onAuthStateChange(callback);
}
