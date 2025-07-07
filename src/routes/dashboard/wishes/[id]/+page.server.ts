import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Benutzer-Session prüfen
	const { session } = await locals.safeGetSession();
	if (!session?.user) {
		throw redirect(303, '/auth/login');
	}

	const wishId = params.id;

	// Wunsch aus Datenbank laden
	const { data: wish, error: wishError } = await locals.supabase
		.from('wishes')
		.select('*')
		.eq('id', wishId)
		.single();

	if (wishError || !wish) {
		console.error('Error loading wish:', wishError);
		throw error(404, 'Wunsch nicht gefunden');
	}

	// Daten in das erwartete Format umwandeln
	const wishData = {
		id: wish.id,
		type: wish.type,
		eventType: wish.event_type,
		relations: wish.relations || [],
		ageGroups: wish.age_groups || [],
		specificValues: wish.specific_values || [],
		text: wish.text,
		belated: wish.belated,
		status: wish.status,
		language: wish.language,
		createdAt: new Date(wish.created_at),
		updatedAt: new Date(wish.updated_at),
		createdBy: wish.created_by
	};

	return {
		wish: wishData,
		user: session.user
	};
};
