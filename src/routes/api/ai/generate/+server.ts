import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { aiService } from '$lib/server/ai-service';
import { WishType, EventType, Language, Relation, AgeGroup } from '$lib/types/Wish';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Authentifizierung prüfen
		const { data: { user } } = await locals.supabase.auth.getUser();
		if (!user) {
			throw error(401, 'Nicht authentifiziert');
		}

		// Benutzerrolle prüfen
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || !['Redakteur', 'Administrator'].includes(profile.role)) {
			throw error(403, 'Keine Berechtigung für KI-Generierung');
		}

		// Request Body parsen und validieren
		const body = await request.json();
		const {
			type,
			eventType,
			language,
			relations,
			ageGroups,
			specificValues,
			style = 'normal',
			count = 1,
			additionalInstructions
		} = body;

		// Validierung der Eingaben
		if (!type || !Object.values(WishType).includes(type)) {
			throw error(400, 'Ungültiger Wunsch-Typ');
		}

		if (!eventType || !Object.values(EventType).includes(eventType)) {
			throw error(400, 'Ungültiger Event-Typ');
		}

		if (!language || !Object.values(Language).includes(language)) {
			throw error(400, 'Ungültige Sprache');
		}

		if (!relations || !Array.isArray(relations) || relations.length === 0) {
			throw error(400, 'Mindestens eine Beziehung muss ausgewählt sein');
		}

		if (!ageGroups || !Array.isArray(ageGroups) || ageGroups.length === 0) {
			throw error(400, 'Mindestens eine Altersgruppe muss ausgewählt sein');
		}

		// Validiere relations und ageGroups
		for (const relation of relations) {
			if (!Object.values(Relation).includes(relation)) {
				throw error(400, `Ungültige Beziehung: ${relation}`);
			}
		}

		for (const ageGroup of ageGroups) {
			if (!Object.values(AgeGroup).includes(ageGroup)) {
				throw error(400, `Ungültige Altersgruppe: ${ageGroup}`);
			}
		}

		// Count limitieren
		const limitedCount = Math.min(Math.max(1, count), 10); // Zwischen 1 und 10

		// Lade AI-Settings aus der Datenbank
		const { data: userSettings } = await locals.supabase
			.from('user_settings')
			.select('ai_prompt_system, ai_prompt_template, ai_model, ai_temperature, ai_max_tokens, ai_top_p, ai_frequency_penalty, ai_presence_penalty')
			.eq('user_id', user.id)
			.single();

		const aiSettings = userSettings ? {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			promptSystem: (userSettings as any).ai_prompt_system,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			promptTemplate: (userSettings as any).ai_prompt_template,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			model: (userSettings as any).ai_model,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			temperature: (userSettings as any).ai_temperature,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			maxTokens: (userSettings as any).ai_max_tokens,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			topP: (userSettings as any).ai_top_p,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			frequencyPenalty: (userSettings as any).ai_frequency_penalty,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			presencePenalty: (userSettings as any).ai_presence_penalty
		} : undefined;

		// KI-Generierung mit User-Tracking und Custom-Settings
		const result = await aiService.generateWishes({
			type,
			eventType,
			language,
			relations,
			ageGroups,
			specificValues: specificValues || [],
			style,
			count: limitedCount,
			additionalInstructions
		}, user.id, aiSettings);

		if (result.error) {
			throw error(500, `KI-Generierungsfehler: ${result.error}`);
		}

		return json({
			success: true,
			wishes: result.wishes,
			totalGenerated: result.totalGenerated,
			message: `${result.totalGenerated} Wünsche erfolgreich generiert`
		});

	} catch (err) {
		console.error('API Error in /api/ai/generate:', err);
		
		// Wenn es bereits ein SvelteKit-Error ist, weiterwerfen
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Andernfalls als interner Server-Fehler behandeln
		throw error(500, 'Interner Server-Fehler bei der KI-Generierung');
	}
};

// Health-Check-Endpunkt
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Authentifizierung prüfen
		const { data: { user } } = await locals.supabase.auth.getUser();
		if (!user) {
			throw error(401, 'Nicht authentifiziert');
		}

		// Health-Check der AI-API
		const isHealthy = await aiService.checkHealth();

		return json({
			status: isHealthy ? 'healthy' : 'unhealthy',
			service: 'OpenRouter AI',
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		console.error('Health check error:', err);
		throw error(500, 'Health check fehlgeschlagen');
	}
}; 