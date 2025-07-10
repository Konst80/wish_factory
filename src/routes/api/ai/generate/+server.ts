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

		// Lade AI-Settings und spezifische Werte aus der Datenbank
		console.log('🔧 Lade KI-Einstellungen und spezifische Werte...');
		const { data: userSettings, error: settingsError } = await locals.supabase
			.from('user_settings')
			.select(
				'ai_prompt_system, ai_prompt_template, ai_prompt_age_young, ai_prompt_age_middle, ai_prompt_age_senior, ai_prompt_relation_friend, ai_prompt_relation_family, ai_prompt_relation_partner, ai_prompt_relation_colleague, ai_model, ai_temperature, ai_max_tokens, ai_top_p, ai_frequency_penalty, ai_presence_penalty, specific_values_birthday_de, specific_values_birthday_en, specific_values_anniversary_de, specific_values_anniversary_en, specific_values_custom_de, specific_values_custom_en'
			)
			.eq('user_id', user.id)
			.single();

		if (settingsError) {
			console.log('⚠️ Keine benutzerdefinierten KI-Einstellungen gefunden, verwende Defaults');
			console.log('⚠️ Settings Error:', settingsError);
		} else {
			console.log('✅ KI-Einstellungen geladen:', userSettings);
		}

		// Erstelle AI-Settings mit benutzerdefinierten Werten oder Fallbacks
		const aiSettings = userSettings as any
			? {
					promptSystem:
						(userSettings as any).ai_prompt_system ||
						'Du bist ein Experte für das Schreiben von Glückwünschen. Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt.',
					promptTemplate: (userSettings as any).ai_prompt_template || undefined, // null zu undefined konvertieren
					promptAgeYoung: (userSettings as any).ai_prompt_age_young || undefined,
					promptAgeMiddle: (userSettings as any).ai_prompt_age_middle || undefined,
					promptAgeSenior: (userSettings as any).ai_prompt_age_senior || undefined,
					promptRelationFriend: (userSettings as any).ai_prompt_relation_friend || undefined,
					promptRelationFamily: (userSettings as any).ai_prompt_relation_family || undefined,
					promptRelationPartner: (userSettings as any).ai_prompt_relation_partner || undefined,
					promptRelationColleague: (userSettings as any).ai_prompt_relation_colleague || undefined,
					model: (userSettings as any).ai_model || 'anthropic/claude-sonnet-4',
					temperature: (userSettings as any).ai_temperature ?? 0.8,
					maxTokens: (userSettings as any).ai_max_tokens || 2000,
					topP: (userSettings as any).ai_top_p ?? 0.9,
					frequencyPenalty: (userSettings as any).ai_frequency_penalty ?? 0.1,
					presencePenalty: (userSettings as any).ai_presence_penalty ?? 0.1
				}
			: undefined;

		// Verarbeite spezifische Werte und lade passende Beschreibung
		let mergedSpecificValues = specificValues || [];
		let specificValuesDescription = '';

		if ((userSettings as any) && specificValues && specificValues.length > 0) {
			// Bestimme das richtige Feld basierend auf eventType und language
			const eventKey = eventType.toLowerCase();
			const languageKey = language.toLowerCase();
			const settingsKey = `specific_values_${eventKey}_${languageKey}` as keyof typeof userSettings;
			const storedDescription = (userSettings as any)[settingsKey];

			if (storedDescription && typeof storedDescription === 'string' && storedDescription.trim()) {
				specificValuesDescription = storedDescription;
				console.log(
					'📝 Gespeicherte Beschreibung für spezifische Werte:',
					storedDescription.substring(0, 100) + '...'
				);
				console.log('📝 Eingegeben Wert:', specificValues[0]);
			}
		}

		console.log('📝 Finale spezifische Werte:', mergedSpecificValues);

		console.log('🤖 Finale AI Settings:', aiSettings);
		console.log(`🎯 Verwende benutzerdefiniertes Template: ${!!aiSettings?.promptTemplate}`);
		if (aiSettings?.promptTemplate) {
			console.log(
				'📝 Custom Template Vorschau:',
				aiSettings.promptTemplate.substring(0, 150) + '...'
			);
		}
		console.log('🤖 Starte KI-Generierung...');

		// KI-Generierung mit User-Tracking und Custom-Settings
		const result = await aiService.generateWishes(
			{
				type,
				eventType,
				language,
				relations,
				ageGroups,
				specificValues: mergedSpecificValues,
				style,
				count: limitedCount,
				additionalInstructions: specificValuesDescription
					? `${additionalInstructions ? additionalInstructions + '\n\n' : ''}Spezifische Werte und Bedeutungen:\n${specificValuesDescription}`
					: additionalInstructions
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
		const errorMessage =
			err instanceof Error ? err.message : 'Unbekannter Fehler bei der KI-Generierung';
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
		console.log(
			`🤖 AI-Service Health: ${healthResult.healthy ? 'gesund' : 'ungesund'} - ${healthResult.details}`
		);

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
