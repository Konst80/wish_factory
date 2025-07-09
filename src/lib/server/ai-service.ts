import { env } from '$env/dynamic/private';
import type { WishType, EventType, Language, Relation, AgeGroup } from '../types/Wish';

interface WishGenerationParams {
	type: WishType;
	eventType: EventType;
	language: Language;
	relations: Relation[];
	ageGroups: AgeGroup[];
	specificValues?: number[];
	style?: 'normal' | 'herzlich' | 'humorvoll' | 'formell';
	count?: number;
	additionalInstructions?: string;
}

interface GeneratedWish {
	text: string;
	belated: string;
	metadata: {
		style: string;
		confidence: number;
	};
}

interface AIResponse {
	wishes: GeneratedWish[];
	totalGenerated: number;
	error?: string;
}

interface TemplateValidationResult {
	valid: boolean;
	missingVariables: string[];
	unknownVariables: string[];
	warnings: string[];
}

interface ResponseValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

interface AISettings {
	promptSystem: string;
	promptTemplate?: string; // Optional - falls nicht gesetzt wird Default verwendet
	model: string;
	temperature: number;
	maxTokens: number;
	topP: number;
	frequencyPenalty: number;
	presencePenalty: number;
}

class OpenRouterAIService {
	private readonly apiKey: string;
	private readonly baseUrl = 'https://openrouter.ai/api/v1';

	constructor() {
		if (!env.OPENROUTER_API_KEY) {
			throw new Error('OPENROUTER_API_KEY environment variable is required');
		}
		this.apiKey = env.OPENROUTER_API_KEY;
	}

	async generateWishes(
		params: WishGenerationParams,
		userId?: string,
		aiSettings?: AISettings
	): Promise<AIResponse> {
		try {
			const prompt = this.generatePrompt(params, aiSettings);
			const model = aiSettings?.model || 'anthropic/claude-sonnet-4';

			console.log('🔧 AI Service Parameters:', {
				model,
				temperature: aiSettings?.temperature ?? 0.8,
				maxTokens: aiSettings?.maxTokens || 2000,
				promptLength: prompt.length
			});
			console.log('📝 Generated Prompt:', prompt);

			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': 'https://wish-factory.local', // Für OpenRouter Tracking
					'X-Title': 'Wish Factory CMS'
				},
				body: JSON.stringify({
					model,
					// Fallback-Modelle für bessere Verfügbarkeit (max 3 erlaubt)
					models: ['anthropic/claude-sonnet-4', 'openai/gpt-4.1', 'anthropic/claude-3.5-sonnet'],
					route: 'fallback',
					// Strukturierte JSON-Ausgabe erzwingen - aber nicht bei allen Modellen unterstützt
					...(model.includes('anthropic') || model.includes('openai')
						? { response_format: { type: 'json_object' } }
						: {}),
					// AI-Parameter aus Settings oder Defaults
					temperature: aiSettings?.temperature ?? 0.8,
					max_tokens: aiSettings?.maxTokens || 2000,
					top_p: aiSettings?.topP ?? 0.9,
					frequency_penalty: aiSettings?.frequencyPenalty ?? 0.1,
					presence_penalty: aiSettings?.presencePenalty ?? 0.1,
					// User-Tracking für OpenRouter
					...(userId && {
						transforms: ['middle-out'],
						user: userId
					}),
					messages: [
						{
							role: 'system',
							content:
								(aiSettings?.promptSystem ||
									'Du bist ein Experte für das Schreiben von Glückwünschen.') +
								' KRITISCH WICHTIG: Du MUSST immer im exakten JSON-Format antworten, niemals als Text oder Markdown. Antworte NUR mit einem gültigen JSON-Objekt mit dem "wishes" Array. Keine Erklärungen, kein zusätzlicher Text!'
						},
						{
							role: 'user',
							content:
								prompt +
								'\n\nWICHTIG: Antworte ausschließlich im JSON-Format wie oben beschrieben. Kein Text außerhalb des JSON!'
						}
					]
				})
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('❌ OpenRouter API Error:', response.status, errorData);
				throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
			}

			const data = await response.json();
			console.log('📥 OpenRouter Response:', JSON.stringify(data, null, 2));
			const content = data.choices?.[0]?.message?.content;

			if (!content) {
				console.error('❌ No content in AI response');
				throw new Error('No content received from AI');
			}

			console.log('📝 AI Response Content:', content);

			// Parse JSON response mit verbessertem Fallback
			let parsedResponse;
			try {
				parsedResponse = JSON.parse(content);
				console.log('✅ Parsed JSON Response:', parsedResponse);
			} catch (parseError) {
				console.error('❌ JSON Parse Error:', parseError);
				console.log('🔍 Attempting to extract and convert from text format...');

				// Fallback 1: Versuche JSON aus dem Text zu extrahieren
				const jsonMatch = content.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					try {
						parsedResponse = JSON.parse(jsonMatch[0]);
						console.log('✅ Extracted JSON:', parsedResponse);
					} catch {
						console.log('❌ JSON Extract failed, trying text conversion...');
						// Fallback 2: Konvertiere Text zu JSON-Format
						parsedResponse = this.convertTextToJSON(content, params);
					}
				} else {
					console.log('❌ No JSON found, converting text format...');
					// Fallback 3: Konvertiere Text zu JSON-Format
					parsedResponse = this.convertTextToJSON(content, params);
				}
			}

			// Validiere Response-Format und konvertiere falls nötig
			if (!parsedResponse.wishes || !Array.isArray(parsedResponse.wishes)) {
				console.log('⚠️ Response nicht im erwarteten Format, versuche Konvertierung...');

				// Fallback: Wenn die AI ein einzelnes Objekt mit text/belated zurückgibt
				if (parsedResponse.text && parsedResponse.belated) {
					console.log('✅ Konvertiere einzelnes Objekt zu wishes Array');
					parsedResponse = {
						wishes: [
							{
								text: parsedResponse.text,
								belated: parsedResponse.belated,
								metadata: {
									style: params.style || 'normal',
									confidence: 0.95
								}
							}
						],
						totalGenerated: 1
					};
				} else {
					console.error('❌ Invalid response format:', parsedResponse);
					throw new Error('Invalid AI response format: missing wishes array');
				}
			}

			console.log('✅ Valid wishes array found:', parsedResponse.wishes.length, 'wishes');

			// Response-Schema-Validierung durchführen
			const responseValidation = this.validateResponse(parsedResponse);
			if (!responseValidation.valid) {
				console.error('❌ Response-Schema-Validierung fehlgeschlagen:', responseValidation.errors);
				throw new Error(`Invalid AI response schema: ${responseValidation.errors.join(', ')}`);
			}

			if (responseValidation.warnings.length > 0) {
				console.warn('⚠️ Response-Validierungs-Warnungen:', responseValidation.warnings);
			}

			console.log('✅ Response-Schema-Validierung erfolgreich');

			const result = {
				wishes: parsedResponse.wishes,
				totalGenerated: parsedResponse.totalGenerated || parsedResponse.wishes.length,
				error: undefined
			};

			console.log('🎉 Final AI Service Result:', result);
			return result;
		} catch (error) {
			console.error('AI Service Error:', error);
			return {
				wishes: [],
				totalGenerated: 0,
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			};
		}
	}

	// Neue Hilfsfunktion zum Konvertieren von Text zu JSON
	private convertTextToJSON(content: string, params: WishGenerationParams): AIResponse {
		console.log('🔄 Converting text content to JSON format...');

		try {
			// Suche nach Text- und Belated-Abschnitten
			const textMatch = content.match(/\*\*text:\*\*\s*([\s\S]*?)(?=\*\*belated:\*\*|$)/i);
			const belatedMatch = content.match(/\*\*belated:\*\*\s*([\s\S]*?)$/i);

			if (textMatch && belatedMatch) {
				const text = textMatch[1]
					.trim()
					.replace(/^\s*\n/, '')
					.replace(/\n\s*$/, '');
				const belated = belatedMatch[1]
					.trim()
					.replace(/^\s*\n/, '')
					.replace(/\n\s*$/, '');

				console.log('✅ Extracted text and belated sections');

				return {
					wishes: [
						{
							text: text,
							belated: belated,
							metadata: {
								style: params.style || 'normal',
								confidence: 0.9
							}
						}
					],
					totalGenerated: 1
				};
			}

			// Fallback: Verwende den gesamten Inhalt als Text
			console.log('⚠️ Using entire content as main text');
			return {
				wishes: [
					{
						text: content.trim(),
						belated: `Nachträglich ${content.trim()}`,
						metadata: {
							style: params.style || 'normal',
							confidence: 0.8
						}
					}
				],
				totalGenerated: 1
			};
		} catch (error) {
			console.error('❌ Text conversion failed:', error);
			throw new Error('Could not convert text response to JSON format');
		}
	}

	private generatePrompt(params: WishGenerationParams, aiSettings?: AISettings): string {
		const {
			eventType,
			language,
			relations,
			ageGroups,
			specificValues,
			style = 'normal',
			count = 1,
			additionalInstructions
		} = params;

		// Priorisiere benutzerdefiniertes Template
		let template = aiSettings?.promptTemplate;

		console.log('🧩 Prompt Template Debug:', {
			hasCustomTemplate: !!template,
			templateSource: template ? 'user_settings' : 'default_fallback',
			templatePreview: template ? template.substring(0, 100) + '...' : 'Using default template'
		});

		if (!template) {
			// Fallback auf Default-Template (unterstützt alle Sprachen mit {language} Variable)
			template = this.getDefaultTemplate();
			console.log('📝 Fallback to default template used');
		} else {
			console.log('✅ Using custom user template from settings');

			// Template-Validierung durchführen
			const templateValidation = this.validateTemplate(template);
			if (!templateValidation.valid) {
				console.warn('⚠️ Template-Validierung fehlgeschlagen:', templateValidation);
				if (templateValidation.missingVariables.length > 0) {
					console.warn('⚠️ Fehlende Variablen im Template:', templateValidation.missingVariables);
				}
				if (templateValidation.unknownVariables.length > 0) {
					console.warn('⚠️ Unbekannte Variablen im Template:', templateValidation.unknownVariables);
				}
			} else {
				console.log('✅ Template-Validierung erfolgreich');
			}

			if (templateValidation.warnings.length > 0) {
				console.warn('⚠️ Template-Warnungen:', templateValidation.warnings);
			}
		}

		// Übersetze Enums für bessere Prompts
		const eventMap = { birthday: 'Geburtstag', anniversary: 'Jubiläum', custom: 'individuell' };
		const relationMap = {
			friend: 'Freund/in',
			family: 'Familie',
			partner: 'Partner/in',
			colleague: 'Kollege/in'
		};
		const ageGroupMap = {
			all: 'alle Altersgruppen',
			young: 'junge Menschen',
			middle: 'mittleres Alter',
			senior: 'Senioren'
		};

		const eventText = eventMap[eventType] || eventType;
		const relationTexts = relations.map((r) => relationMap[r] || r).join(', ');
		const ageGroupTexts = ageGroups.map((a) => ageGroupMap[a] || a).join(', ');

		const countText = count === 1 ? 'Glückwunsch' : 'Glückwünsche';
		const specificValuesText =
			specificValues && specificValues.length > 0
				? `\n- Spezielle Werte: ${specificValues.join(', ')}`
				: '';

		const additionalInstructionsText = additionalInstructions
			? `\n- Zusätzliche Anweisungen: ${additionalInstructions}`
			: '';

		console.log('🔧 Prompt Variables:', {
			eventType,
			eventText,
			language,
			relations,
			relationTexts,
			ageGroups,
			ageGroupTexts,
			style,
			count,
			countText,
			specificValuesText,
			additionalInstructionsText
		});

		// Template-Variablen ersetzen
		let finalPrompt = template
			.replace(/\{count\}/g, count.toString())
			.replace(/\{countText\}/g, countText)
			.replace(/\{countPlural\}/g, count === 1 ? '' : 's')
			.replace(/\{style\}/g, style)
			.replace(/\{language\}/g, language)
			.replace(/\{eventText\}/g, eventText)
			.replace(/\{eventType\}/g, eventType)
			.replace(/\{relationTexts\}/g, relationTexts)
			.replace(/\{relations\}/g, relations.join(', '))
			.replace(/\{ageGroupTexts\}/g, ageGroupTexts)
			.replace(/\{ageGroups\}/g, ageGroups.join(', '))
			.replace(/\{specificValues\}/g, specificValuesText)
			.replace(/\{additionalInstructions\}/g, additionalInstructionsText);

		// HARDCODIERTE JSON-FORMAT-ANWEISUNG - IMMER ANHÄNGEN
		const mandatoryJsonInstructions =
			'\n\n' +
			'===============================================================================\n' +
			'KRITISCH WICHTIG - JSON-AUSGABE-FORMAT (NICHT VERHANDELBAR)\n' +
			'===============================================================================\n\n' +
			'Du MUSST exakt in diesem JSON-Format antworten - KEIN anderes Format ist erlaubt:\n\n' +
			'{\n' +
			'  "wishes": [\n' +
			'    {\n' +
			'      "text": "Haupttext des Glückwunsches hier",\n' +
			'      "belated": "Nachträglicher Text hier",\n' +
			'      "metadata": {\n' +
			'        "style": "' +
			style +
			'",\n' +
			'        "confidence": 0.95\n' +
			'      }\n' +
			'    }\n' +
			'  ],\n' +
			'  "totalGenerated": ' +
			count +
			'\n' +
			'}\n\n' +
			'WICHTIGE REGELN:\n' +
			'- Antworte AUSSCHLIESSLICH mit diesem JSON-Objekt\n' +
			'- KEIN zusätzlicher Text vor oder nach dem JSON\n' +
			'- KEINE Markdown-Formatierung (```json)\n' +
			'- KEINE Erklärungen oder Kommentare\n' +
			'- Das JSON muss vollständig valid sein\n' +
			'- Verwende exakt die Feldnamen: "wishes", "text", "belated", "metadata", "style", "confidence", "totalGenerated"\n\n' +
			'BEISPIEL KORREKTE ANTWORT:\n' +
			'{"wishes":[{"text":"Beispieltext","belated":"Beispiel nachträglich","metadata":{"style":"' +
			style +
			'","confidence":0.95}}],"totalGenerated":' +
			count +
			'}\n\n' +
			'===============================================================================';

		// Füge die hardcodierte JSON-Anweisung IMMER hinzu
		finalPrompt += mandatoryJsonInstructions;

		console.log(
			'📝 Final Prompt after variable replacement (first 500 chars):',
			finalPrompt.substring(0, 500) + '...'
		);
		console.log('🔒 Hardcodierte JSON-Anweisung wurde hinzugefügt');

		return finalPrompt;
	}

	private getDefaultTemplate(): string {
		return `Du bist ein Experte für das Schreiben von Glückwünschen. Generiere {count} {countText} in der Sprache "{language}" basierend auf folgenden Kriterien:

**Wichtige Regeln:**
- Verwende IMMER geschlechtsneutrale Sprache (keine "er/sie" Annahmen)
- Nutze die Platzhalter [Name], [Alter], [Anlass] wo sinnvoll
- Der Stil soll "{style}" sein
- Anlass: {eventText}
- Beziehung: {relationTexts}
- Zielgruppe: {ageGroupTexts}
{specificValues}
{additionalInstructions}

**Stil-Definitionen:**
- normal: Freundlich und herzlich, aber nicht übertrieben
- herzlich: Emotional und warmherzig, persönlich
- humorvoll: Lustig und spielerisch, aber respektvoll
- formell: Höflich und professionell, respektvoll

Generiere für jeden Wunsch sowohl einen normalen Text als auch einen nachträglichen (belated) Text.

**KRITISCH WICHTIG: Du MUSST exakt in diesem JSON-Format antworten - KEIN anderes Format ist erlaubt:**

{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches hier",
      "belated": "Nachträglicher Text hier", 
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}

**ANTWORTE NUR MIT DIESEM JSON - KEIN zusätzlicher Text, keine Markdown-Formatierung, keine Erklärungen!**`;
	}

	private getDefaultGermanTemplate(): string {
		return `Du bist ein Experte für das Schreiben von Glückwünschen auf Deutsch. Generiere {count} {countText} basierend auf folgenden Kriterien:

**Wichtige Regeln:**
- Verwende IMMER geschlechtsneutrale Sprache (keine "er/sie" Annahmen)
- Nutze die Platzhalter [Name], [Alter], [Anlass] wo sinnvoll
- Der Stil soll "{style}" sein
- Anlass: {eventText}
- Beziehung: {relationTexts}
- Zielgruppe: {ageGroupTexts}
{specificValues}
{additionalInstructions}

**Stil-Definitionen:**
- normal: Freundlich und herzlich, aber nicht übertrieben
- herzlich: Emotional und warmherzig, persönlich
- humorvoll: Lustig und spielerisch, aber respektvoll
- formell: Höflich und professionell, respektvoll

Generiere für jeden Wunsch sowohl einen normalen Text als auch einen nachträglichen (belated) Text.

**Antwortformat (JSON):**
{
  "wishes": [
    {
      "text": "Haupttext des Glückwunsches",
      "belated": "Nachträglicher Text",
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}`;
	}

	private getDefaultEnglishTemplate(): string {
		return `You are an expert at writing greetings in English. Generate {count} greeting{countPlural} based on these criteria:

**Important Rules:**
- ALWAYS use gender-neutral language (no "he/she" assumptions)
- Use placeholders [Name], [Age], [Occasion] where appropriate
- Style should be "{style}"
- Occasion: {eventType}
- Relationship: {relations}
- Target audience: {ageGroups}
{specificValues}
{additionalInstructions}

**Style Definitions:**
- normal: Friendly and warm, but not excessive
- herzlich: Emotional and heartfelt, personal
- humorvoll: Funny and playful, but respectful
- formell: Polite and professional, respectful

Generate both a regular text and a belated text for each wish.

**Response Format (JSON):**
{
  "wishes": [
    {
      "text": "Main greeting text",
      "belated": "Belated greeting text",
      "metadata": {
        "style": "{style}",
        "confidence": 0.95
      }
    }
  ],
  "totalGenerated": {count}
}`;
	}

	// Einfache Funktion für einzelne Wunschgenerierung
	async generateSingleWish(
		params: Omit<WishGenerationParams, 'count'>,
		userId?: string,
		aiSettings?: AISettings
	): Promise<GeneratedWish | null> {
		const result = await this.generateWishes({ ...params, count: 1 }, userId, aiSettings);

		if (result.error || result.wishes.length === 0) {
			return null;
		}

		return result.wishes[0];
	}

	// Streaming-Version für bessere UX
	async generateWishesStream(
		params: WishGenerationParams,
		userId?: string,
		aiSettings?: AISettings
	): Promise<ReadableStream<Uint8Array>> {
		const prompt = this.generatePrompt(params, aiSettings);
		const model = aiSettings?.model || 'anthropic/claude-sonnet-4';

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://wish-factory.local',
				'X-Title': 'Wish Factory CMS'
			},
			body: JSON.stringify({
				model,
				models: ['anthropic/claude-sonnet-4', 'openai/gpt-4.1', 'anthropic/claude-3.5-sonnet'],
				route: 'fallback',
				response_format: { type: 'json_object' },
				stream: true, // Aktiviere Streaming
				temperature: aiSettings?.temperature ?? 0.8,
				max_tokens: aiSettings?.maxTokens || 2000,
				top_p: aiSettings?.topP ?? 0.9,
				frequency_penalty: aiSettings?.frequencyPenalty ?? 0.1,
				presence_penalty: aiSettings?.presencePenalty ?? 0.1,
				...(userId && {
					transforms: ['middle-out'],
					user: userId
				}),
				messages: [
					{
						role: 'system',
						content:
							aiSettings?.promptSystem ||
							'Du bist ein Experte für das Schreiben von Glückwünschen. Antworte immer im exakten JSON-Format ohne zusätzlichen Text.'
					},
					{
						role: 'user',
						content: prompt
					}
				]
			})
		});

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.status}`);
		}

		return response.body!;
	}

	// Health-Check
	async checkHealth(): Promise<{ healthy: boolean; details: string; models?: string[] }> {
		try {
			if (!this.apiKey) {
				return {
					healthy: false,
					details: 'API-Schlüssel nicht konfiguriert'
				};
			}

			console.log('🔍 Prüfe OpenRouter API Verfügbarkeit...');
			const response = await fetch(`${this.baseUrl}/models`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ OpenRouter API Fehler:', response.status, errorText);

				if (response.status === 401) {
					return {
						healthy: false,
						details: 'API-Schlüssel ungültig oder abgelaufen'
					};
				} else if (response.status === 403) {
					return {
						healthy: false,
						details: 'API-Zugriff verweigert - möglicherweise Rate-Limit erreicht'
					};
				} else {
					return {
						healthy: false,
						details: `API-Fehler: ${response.status} - ${errorText}`
					};
				}
			}

			const data = await response.json();
			const availableModels = data.data?.map((model: { id: string }) => model.id) || [];
			console.log('✅ OpenRouter API verfügbar, Modelle:', availableModels.slice(0, 3), '...');

			return {
				healthy: true,
				details: `API verfügbar mit ${availableModels.length} Modellen`,
				models: availableModels.slice(0, 10) // Nur die ersten 10 für die Anzeige
			};
		} catch (error) {
			console.error('❌ Health-Check fehlgeschlagen:', error);

			if (error instanceof Error) {
				if (error.message.includes('timeout')) {
					return {
						healthy: false,
						details: 'Timeout beim Erreichen der API - Netzwerkprobleme'
					};
				} else if (error.message.includes('fetch')) {
					return {
						healthy: false,
						details: 'Netzwerkfehler beim Erreichen der API'
					};
				} else {
					return {
						healthy: false,
						details: `Unbekannter Fehler: ${error.message}`
					};
				}
			}

			return {
				healthy: false,
				details: 'Unbekannter Fehler beim Health-Check'
			};
		}
	}

	// Kosten- und Usage-Tracking
	async getCostEstimate(
		params: WishGenerationParams,
		aiSettings?: AISettings
	): Promise<{ estimatedCost: number; tokens: number }> {
		const prompt = this.generatePrompt(params, aiSettings);
		// Grobe Schätzung: ~4 Zeichen = 1 Token, Claude 3.5 Sonnet: $3/1M input + $15/1M output
		const inputTokens = Math.ceil(prompt.length / 4);
		const outputTokens = Math.ceil(params.count! * 200); // ~200 Tokens pro Wunsch

		const inputCost = (inputTokens / 1000000) * 3; // $3 per 1M tokens
		const outputCost = (outputTokens / 1000000) * 15; // $15 per 1M tokens

		return {
			estimatedCost: inputCost + outputCost,
			tokens: inputTokens + outputTokens
		};
	}

	// Erweiterte Modell-Verfügbarkeit prüfen
	async getAvailableModels(): Promise<string[]> {
		try {
			const response = await fetch(`${this.baseUrl}/models`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`
				}
			});

			if (!response.ok) {
				return ['anthropic/claude-sonnet-4', 'openai/gpt-4.1', 'anthropic/claude-3.5-sonnet'];
			}

			const data = await response.json();
			return (
				data.data?.map((model: { id: string }) => model.id) || [
					'anthropic/claude-sonnet-4',
					'openai/gpt-4.1',
					'anthropic/claude-3.5-sonnet'
				]
			);
		} catch {
			return ['anthropic/claude-sonnet-4', 'openai/gpt-4.1', 'anthropic/claude-3.5-sonnet'];
		}
	}

	// Template-Validierung
	private validateTemplate(template: string): TemplateValidationResult {
		const result: TemplateValidationResult = {
			valid: true,
			missingVariables: [],
			unknownVariables: [],
			warnings: []
		};

		// Definiere alle verfügbaren Template-Variablen
		const validVariables = [
			'count',
			'countText',
			'countPlural',
			'style',
			'language',
			'eventText',
			'eventType',
			'relationTexts',
			'relations',
			'ageGroupTexts',
			'ageGroups',
			'specificValues',
			'additionalInstructions'
		];

		// Empfohlene Variablen für einen vollständigen Prompt
		const recommendedVariables = [
			'language',
			'eventText',
			'style',
			'relationTexts',
			'ageGroupTexts'
		];

		// Extrahiere alle Variablen aus dem Template
		const variableMatches = template.match(/\{([^}]+)\}/g) || [];
		const usedVariables = variableMatches.map((match) => match.slice(1, -1));

		// Prüfe auf unbekannte Variablen
		for (const variable of usedVariables) {
			if (!validVariables.includes(variable)) {
				result.unknownVariables.push(variable);
				result.valid = false;
			}
		}

		// Prüfe auf fehlende empfohlene Variablen
		for (const variable of recommendedVariables) {
			if (!usedVariables.includes(variable)) {
				result.missingVariables.push(variable);
				result.warnings.push(`Empfohlene Variable {${variable}} nicht im Template gefunden`);
			}
		}

		// Zusätzliche Prüfungen
		if (!template.toLowerCase().includes('json')) {
			result.warnings.push(
				'Template enthält keine JSON-Format-Anweisungen - dies könnte zu Parsing-Problemen führen'
			);
		}

		if (template.length < 100) {
			result.warnings.push('Template ist sehr kurz - möglicherweise fehlen wichtige Anweisungen');
		}

		if (template.length > 5000) {
			result.warnings.push('Template ist sehr lang - dies könnte zu erhöhten API-Kosten führen');
		}

		// Prüfe auf kritische Variablen
		if (!usedVariables.includes('language')) {
			result.valid = false;
			result.missingVariables.push('language');
		}

		return result;
	}

	// Response-Schema-Validierung
	private validateResponse(response: unknown): ResponseValidationResult {
		const result: ResponseValidationResult = {
			valid: true,
			errors: [],
			warnings: []
		};

		// Prüfe Top-Level-Struktur
		if (!response || typeof response !== 'object') {
			result.valid = false;
			result.errors.push('Response ist kein gültiges Objekt');
			return result;
		}

		// Type guard für bessere TypeScript-Unterstützung
		const responseObj = response as Record<string, any>;

		// Prüfe wishes Array
		if (!responseObj.wishes) {
			result.valid = false;
			result.errors.push('Fehlendes "wishes" Feld in der Response');
		} else if (!Array.isArray(responseObj.wishes)) {
			result.valid = false;
			result.errors.push('"wishes" muss ein Array sein');
		} else if (responseObj.wishes.length === 0) {
			result.valid = false;
			result.errors.push('"wishes" Array ist leer');
		} else {
			// Prüfe jeden Wunsch im Array
			for (let i = 0; i < responseObj.wishes.length; i++) {
				const wish = responseObj.wishes[i];
				const wishPath = `wishes[${i}]`;

				if (!wish || typeof wish !== 'object') {
					result.valid = false;
					result.errors.push(`${wishPath} ist kein gültiges Objekt`);
					continue;
				}

				// Prüfe required Felder
				if (!wish.text || typeof wish.text !== 'string') {
					result.valid = false;
					result.errors.push(`${wishPath}.text fehlt oder ist kein String`);
				} else if (wish.text.trim().length === 0) {
					result.valid = false;
					result.errors.push(`${wishPath}.text ist leer`);
				} else if (wish.text.length > 2000) {
					result.warnings.push(`${wishPath}.text ist sehr lang (${wish.text.length} Zeichen)`);
				}

				if (!wish.belated || typeof wish.belated !== 'string') {
					result.valid = false;
					result.errors.push(`${wishPath}.belated fehlt oder ist kein String`);
				} else if (wish.belated.trim().length === 0) {
					result.warnings.push(`${wishPath}.belated ist leer`);
				}

				// Prüfe metadata
				if (!wish.metadata || typeof wish.metadata !== 'object') {
					result.valid = false;
					result.errors.push(`${wishPath}.metadata fehlt oder ist kein Objekt`);
				} else {
					if (!wish.metadata.style || typeof wish.metadata.style !== 'string') {
						result.valid = false;
						result.errors.push(`${wishPath}.metadata.style fehlt oder ist kein String`);
					}

					if (typeof wish.metadata.confidence !== 'number') {
						result.warnings.push(`${wishPath}.metadata.confidence fehlt oder ist keine Zahl`);
					} else if (wish.metadata.confidence < 0 || wish.metadata.confidence > 1) {
						result.warnings.push(`${wishPath}.metadata.confidence sollte zwischen 0 und 1 liegen`);
					}
				}
			}
		}

		// Prüfe totalGenerated
		if (typeof responseObj.totalGenerated !== 'number') {
			result.warnings.push('totalGenerated fehlt oder ist keine Zahl');
		} else if (responseObj.wishes && responseObj.totalGenerated !== responseObj.wishes.length) {
			result.warnings.push(
				`totalGenerated (${responseObj.totalGenerated}) stimmt nicht mit wishes.length (${responseObj.wishes.length}) überein`
			);
		}

		return result;
	}
}

// Singleton instance
export const aiService = new OpenRouterAIService();
