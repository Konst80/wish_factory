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

interface AISettings {
	promptSystem: string;
	promptTemplate: string;
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
			const model = aiSettings?.model || 'anthropic/claude-3.5-sonnet';

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
					// Fallback-Modelle für bessere Verfügbarkeit
					models: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-haiku', 'openai/gpt-4o-mini'],
					route: 'fallback',
					// Strukturierte JSON-Ausgabe erzwingen
					response_format: { type: 'json_object' },
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
				const errorData = await response.text();
				throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
			}

			const data = await response.json();
			const content = data.choices?.[0]?.message?.content;

			if (!content) {
				throw new Error('No content received from AI');
			}

			// Parse JSON response
			let parsedResponse;
			try {
				parsedResponse = JSON.parse(content);
			} catch {
				// Fallback: Versuche JSON aus dem Text zu extrahieren
				const jsonMatch = content.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					parsedResponse = JSON.parse(jsonMatch[0]);
				} else {
					throw new Error('Could not parse JSON from AI response');
				}
			}

			// Validiere Response-Format
			if (!parsedResponse.wishes || !Array.isArray(parsedResponse.wishes)) {
				throw new Error('Invalid AI response format: missing wishes array');
			}

			return {
				wishes: parsedResponse.wishes,
				totalGenerated: parsedResponse.totalGenerated || parsedResponse.wishes.length,
				error: undefined
			};
		} catch (error) {
			console.error('AI Service Error:', error);
			return {
				wishes: [],
				totalGenerated: 0,
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			};
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

		// Verwende konfigurierbare Templates oder Fallback
		let template = aiSettings?.promptTemplate;

		if (!template) {
			// Fallback auf Default-Template (unterstützt alle Sprachen mit {language} Variable)
			template = this.getDefaultTemplate();
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

		// Template-Variablen ersetzen
		return template
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
		const model = aiSettings?.model || 'anthropic/claude-3.5-sonnet';

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
				models: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-haiku', 'openai/gpt-4o-mini'],
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
				return ['anthropic/claude-3.5-sonnet'];
			}

			const data = await response.json();
			return data.data?.map((model: { id: string }) => model.id) || ['anthropic/claude-3.5-sonnet'];
		} catch {
			return ['anthropic/claude-3.5-sonnet'];
		}
	}
}

// Singleton instance
export const aiService = new OpenRouterAIService();
