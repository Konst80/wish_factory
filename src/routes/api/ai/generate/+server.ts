import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { aiService } from '$lib/server/ai-service';
import { WishType, EventType, Language, Relation, AgeGroup } from '$lib/types/Wish';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		console.log('🤖 KI-Generierung API aufgerufen');

		// Prüfe ob OpenRouter API Key konfiguriert ist
		if (!env.OPENROUTER_API_KEY) {
			console.error('❌ OPENROUTER_API_KEY nicht konfiguriert');
			throw error(500, 'KI-Service nicht konfiguriert: API-Schlüssel fehlt');
		}

		// Authentifizierung prüfen
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			console.log('❌ Benutzer nicht authentifiziert');
			throw error(401, 'Nicht authentifiziert');
		}

		console.log(`✅ Benutzer authentifiziert: ${user.id}`);

		// Benutzerrolle prüfen
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile) {
			console.log('❌ Benutzerprofil nicht gefunden');
			throw error(403, 'Benutzerprofil nicht gefunden');
		}

		if (!['Redakteur', 'Administrator'].includes(profile.role)) {
			console.log(`❌ Unzureichende Berechtigung: ${profile.role}`);
			throw error(403, 'Keine Berechtigung für KI-Generierung');
		}

		console.log(`✅ Berechtigung bestätigt: ${profile.role}`);

		// Request Body parsen und validieren
		const body = await request.json();
		console.log('📝 Request Body:', JSON.stringify(body, null, 2));

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
			console.log(`❌ Ungültiger Wunsch-Typ: ${type}`);
			throw error(400, 'Ungültiger Wunsch-Typ');
		}

		if (!eventType || !Object.values(EventType).includes(eventType)) {
			console.log(`❌ Ungültiger Event-Typ: ${eventType}`);
			throw error(400, 'Ungültiger Event-Typ');
		}

		if (!language || !Object.values(Language).includes(language)) {
			console.log(`❌ Ungültige Sprache: ${language}`);
			throw error(400, 'Ungültige Sprache');
		}

		if (!relations || !Array.isArray(relations) || relations.length === 0) {
			console.log(`❌ Ungültige Beziehungen: ${relations}`);
			throw error(400, 'Mindestens eine Beziehung muss ausgewählt sein');
		}

		if (!ageGroups || !Array.isArray(ageGroups) || ageGroups.length === 0) {
			console.log(`❌ Ungültige Altersgruppen: ${ageGroups}`);
			throw error(400, 'Mindestens eine Altersgruppe muss ausgewählt sein');
		}

		// Validiere relations und ageGroups
		for (const relation of relations) {
			if (!Object.values(Relation).includes(relation)) {
				console.log(`❌ Ungültige Beziehung: ${relation}`);
				throw error(400, `Ungültige Beziehung: ${relation}`);
			}
		}

		for (const ageGroup of ageGroups) {
			if (!Object.values(AgeGroup).includes(ageGroup)) {
				console.log(`❌ Ungültige Altersgruppe: ${ageGroup}`);
				throw error(400, `Ungültige Altersgruppe: ${ageGroup}`);
			}
		}

		console.log('✅ Eingaben validiert');

		// Count limitieren
		const limitedCount = Math.min(Math.max(1, count), 10); // Zwischen 1 und 10
		console.log(`📊 Anzahl Wünsche: ${limitedCount}`);

		// Lade AI-Settings aus der Datenbank
		console.log('🔧 Lade KI-Einstellungen...');
		const { data: userSettings, error: settingsError } = await locals.supabase
			.from('user_settings')
			.select(
				'ai_prompt_system, ai_prompt_template, ai_model, ai_temperature, ai_max_tokens, ai_top_p, ai_frequency_penalty, ai_presence_penalty'
			)
			.eq('user_id', user.id)
			.single();

		if (settingsError) {
			console.log('⚠️ Keine benutzerdefinierten KI-Einstellungen gefunden, verwende Defaults');
		} else {
			console.log('✅ KI-Einstellungen geladen');
		}

		const aiSettings = userSettings
			? {
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
				}
			: undefined;

		console.log('🤖 Starte KI-Generierung...');

		// KI-Generierung mit User-Tracking und Custom-Settings
		const result = await aiService.generateWishes(
			{
				type,
				eventType,
				language,
				relations,
				ageGroups,
				specificValues: specificValues || [],
				style,
				count: limitedCount,
				additionalInstructions
			},
			user.id,
			aiSettings
		);

		if (result.error) {
			console.error('❌ KI-Generierungsfehler:', result.error);
			throw error(500, `KI-Generierungsfehler: ${result.error}`);
		}

		console.log(`✅ KI-Generierung erfolgreich: ${result.totalGenerated} Wünsche generiert`);

		return json({
			success: true,
			wishes: result.wishes,
			totalGenerated: result.totalGenerated,
			message: `${result.totalGenerated} Wünsche erfolgreich generiert`
		});
	} catch (err) {
		console.error('❌ API Error in /api/ai/generate:', err);

		// Wenn es bereits ein SvelteKit-Error ist, weiterwerfen
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Andernfalls als interner Server-Fehler behandeln
		const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler bei der KI-Generierung';
		console.error('❌ Interner Server-Fehler:', errorMessage);
		throw error(500, `Interner Server-Fehler: ${errorMessage}`);
	}
};

// Health-Check-Endpunkt
export const GET: RequestHandler = async ({ locals }) => {
	try {
		console.log('🔍 Health-Check für KI-Service');

		// Prüfe Environment-Variablen
		const hasApiKey = !!env.OPENROUTER_API_KEY;
		console.log(`🔑 OpenRouter API Key: ${hasApiKey ? 'vorhanden' : 'fehlt'}`);

		if (!hasApiKey) {
			return json({
				status: 'unhealthy',
				service: 'OpenRouter AI',
				error: 'API-Schlüssel nicht konfiguriert',
				timestamp: new Date().toISOString()
			});
		}

		// Authentifizierung prüfen
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			throw error(401, 'Nicht authentifiziert');
		}

		// Health-Check der AI-API
		const healthResult = await aiService.checkHealth();
		console.log(`🤖 AI-Service Health: ${healthResult.healthy ? 'gesund' : 'ungesund'} - ${healthResult.details}`);

		return json({
			status: healthResult.healthy ? 'healthy' : 'unhealthy',
			service: 'OpenRouter AI',
			details: healthResult.details,
			models: healthResult.models,
			hasApiKey,
			timestamp: new Date().toISOString()
		});
	} catch (err) {
		console.error('❌ Health check error:', err);
		throw error(500, 'Health check fehlgeschlagen');
	}
};
