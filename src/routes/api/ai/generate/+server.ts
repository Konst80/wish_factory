import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { aiService } from '$lib/server/ai-service';
import { WishType, EventType, Language, Relation, AgeGroup, WishLength } from '$lib/types/Wish';
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
			types,
			eventType,
			eventTypes,
			language,
			languages,
			relations,
			ageGroups,
			specificValues,
			count = 1,
			additionalInstructions,
			isBatch = false,
			belated = false,
			length = WishLength.MEDIUM
		} = body;

		console.log('🔍 API Debug - Received belated:', belated, typeof belated);

		// Handle backward compatibility and new array format
		const finalTypes = types || (type ? [type] : []);
		const finalEventTypes = eventTypes || (eventType ? [eventType] : []);
		const finalLanguages = languages || (language ? [language] : []);

		// Validierung der Eingaben - Arrays müssen mindestens einen Wert haben
		if (!finalTypes || finalTypes.length === 0) {
			console.log(`❌ Keine Wunsch-Typen angegeben: ${finalTypes}`);
			throw error(400, 'Mindestens ein Wunsch-Typ muss ausgewählt sein');
		}

		if (!finalEventTypes || finalEventTypes.length === 0) {
			console.log(`❌ Keine Event-Typen angegeben: ${finalEventTypes}`);
			throw error(400, 'Mindestens ein Event-Typ muss ausgewählt sein');
		}

		if (!finalLanguages || finalLanguages.length === 0) {
			console.log(`❌ Keine Sprachen angegeben: ${finalLanguages}`);
			throw error(400, 'Mindestens eine Sprache muss ausgewählt sein');
		}

		// Validiere einzelne Werte in den Arrays
		for (const t of finalTypes) {
			if (!Object.values(WishType).includes(t)) {
				console.log(`❌ Ungültiger Wunsch-Typ: ${t}`);
				throw error(400, `Ungültiger Wunsch-Typ: ${t}`);
			}
		}

		for (const et of finalEventTypes) {
			if (!Object.values(EventType).includes(et)) {
				console.log(`❌ Ungültiger Event-Typ: ${et}`);
				throw error(400, `Ungültiger Event-Typ: ${et}`);
			}
		}

		for (const l of finalLanguages) {
			if (!Object.values(Language).includes(l)) {
				console.log(`❌ Ungültige Sprache: ${l}`);
				throw error(400, `Ungültige Sprache: ${l}`);
			}
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
		console.log(`📦 Batch-Modus: ${isBatch ? 'JA' : 'NEIN'}`);

		// Lade AI-Settings und spezifische Werte aus der Datenbank
		console.log('🔧 Lade KI-Einstellungen und spezifische Werte...');
		const { data: userSettings, error: settingsError } = await locals.supabase
			.from('user_settings')
			.select(
				'ai_prompt_system, ai_prompt_template, ai_prompt_age_young, ai_prompt_age_middle, ai_prompt_age_senior, ai_prompt_relation_friend, ai_prompt_relation_family, ai_prompt_relation_partner, ai_prompt_relation_colleague, ai_prompt_batch, ai_prompt_belated, ai_model, ai_temperature, ai_max_tokens, ai_top_p, ai_frequency_penalty, ai_presence_penalty, specific_values_birthday_de, specific_values_birthday_en, specific_values_anniversary_de, specific_values_anniversary_en, specific_values_custom_de, specific_values_custom_en'
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
		type UserSettingsRecord = Record<string, unknown>;
		const settings =
			userSettings && typeof userSettings === 'object'
				? (userSettings as UserSettingsRecord)
				: null;
		const aiSettings = settings
			? {
					promptSystem:
						(settings.ai_prompt_system as string) ||
						'Du bist ein Experte für das Schreiben von Glückwünschen. Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt.',
					promptTemplate: (settings.ai_prompt_template as string) || undefined, // null zu undefined konvertieren
					promptAgeYoung: (settings.ai_prompt_age_young as string) || undefined,
					promptAgeMiddle: (settings.ai_prompt_age_middle as string) || undefined,
					promptAgeSenior: (settings.ai_prompt_age_senior as string) || undefined,
					promptRelationFriend: (settings.ai_prompt_relation_friend as string) || undefined,
					promptRelationFamily: (settings.ai_prompt_relation_family as string) || undefined,
					promptRelationPartner: (settings.ai_prompt_relation_partner as string) || undefined,
					promptRelationColleague: (settings.ai_prompt_relation_colleague as string) || undefined,
					promptBatch: (settings.ai_prompt_batch as string) || undefined,
					promptBelated: (settings.ai_prompt_belated as string) || undefined,
					model: (settings.ai_model as string) || 'anthropic/claude-sonnet-4',
					temperature: (settings.ai_temperature as number) ?? 0.8,
					maxTokens: (settings.ai_max_tokens as number) || 2000,
					topP: (settings.ai_top_p as number) ?? 0.9,
					frequencyPenalty: (settings.ai_frequency_penalty as number) ?? 0.1,
					presencePenalty: (settings.ai_presence_penalty as number) ?? 0.1
				}
			: undefined;

		// Verarbeite spezifische Werte und lade passende Beschreibung
		const mergedSpecificValues = specificValues || [];
		let specificValuesDescription = '';

		if (settings && specificValues && specificValues.length > 0) {
			// Verwende den ersten Event-Typ und die erste Sprache für spezifische Werte
			const eventKey = finalEventTypes[0].toLowerCase();
			const languageKey = finalLanguages[0].toLowerCase();
			const settingsKey = `specific_values_${eventKey}_${languageKey}`;
			const storedDescription = settings[settingsKey] as string;

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
		console.log(`📦 Verwende Batch-Prompt: ${!!aiSettings?.promptBatch && isBatch}`);
		if (aiSettings?.promptTemplate) {
			console.log(
				'📝 Custom Template Vorschau:',
				aiSettings.promptTemplate.substring(0, 150) + '...'
			);
		}
		if (aiSettings?.promptBatch && isBatch) {
			console.log('📦 Batch-Prompt Vorschau:', aiSettings.promptBatch.substring(0, 150) + '...');
		}
		console.log('🤖 Starte KI-Generierung...');

		// KI-Generierung mit User-Tracking und Custom-Settings
		const result = await aiService.generateWishes(
			{
				types: finalTypes,
				eventTypes: finalEventTypes,
				languages: finalLanguages,
				relations,
				ageGroups,
				specificValues: mergedSpecificValues,
				count: limitedCount,
				additionalInstructions: specificValuesDescription
					? `${additionalInstructions ? additionalInstructions + '\n\n' : ''}Spezifische Werte und Bedeutungen:\n${specificValuesDescription}`
					: additionalInstructions,
				belated,
				length
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
