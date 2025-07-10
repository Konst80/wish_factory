import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { aiService } from '$lib/server/ai-service';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		console.log('🤖 KI-Werte-Vorschlag API aufgerufen');

		// Authentifizierung prüfen
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			console.log('❌ Benutzer nicht authentifiziert');
			throw error(401, 'Nicht authentifiziert');
		}

		// Benutzerrolle prüfen
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (!profile || profile.role !== 'Administrator') {
			console.log(`❌ Unzureichende Berechtigung: ${profile?.role}`);
			throw error(403, 'Keine Berechtigung für KI-Vorschläge');
		}

		// Request Body parsen
		const body = await request.json();
		const { eventType, language } = body;

		if (!eventType || !language) {
			throw error(400, 'EventType und Language sind erforderlich');
		}

		// Prompt für spezifische Werte generieren
		const prompt = generateSpecificValuesPrompt(eventType, language);

		// AI-Service aufrufen
		const result = await aiService.generateWishes(
			{
				types: ['normal'],
				eventTypes: [eventType],
				languages: [language],
				relations: ['friend'],
				ageGroups: ['all'],
				specificValues: [],
				count: 1,
				additionalInstructions: prompt
			},
			user.id
		);

		if (result.error) {
			console.error('❌ KI-Vorschlagsfehler:', result.error);
			throw error(500, `KI-Vorschlagsfehler: ${result.error}`);
		}

		// Extrahiere die Beschreibung aus der AI-Antwort
		const description = result.wishes[0]?.text || '';

		return json({
			success: true,
			description,
			message: `Beschreibung für ${eventType} (${language}) generiert`
		});
	} catch (err) {
		console.error('❌ API Error in /api/ai/suggest-values:', err);

		// Wenn es bereits ein SvelteKit-Error ist, weiterwerfen
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Andernfalls als interner Server-Fehler behandeln
		const errorMessage =
			err instanceof Error ? err.message : 'Unbekannter Fehler bei der Werte-Generierung';
		throw error(500, `Interner Server-Fehler: ${errorMessage}`);
	}
};

function generateSpecificValuesPrompt(eventType: string, language: string): string {
	const eventLabels = {
		birthday: language === 'de' ? 'Geburtstag' : 'Birthday',
		anniversary: language === 'de' ? 'Hochzeitstag' : 'Wedding Anniversary',
		custom: language === 'de' ? 'Individueller Anlass' : 'Custom Event'
	};

	const eventLabel = eventLabels[eventType as keyof typeof eventLabels] || eventType;

	if (language === 'de') {
		return `Erstelle eine detaillierte Beschreibung wichtiger Zahlen und ihrer Bedeutung für ${eventLabel}.

Für Geburtstage: Beschreibe wichtige Lebensjahre mit ihrer kulturellen Bedeutung, z.B.:
- 16 Jahre (Sweet Sixteen - Übergang zur Jugend)
- 18 Jahre (Volljährigkeit - rechtliche Selbstständigkeit)
- 21 Jahre (Erwachsenwerden - traditionelle Mündigkeit)
- 30 Jahre (Lebensmitte - berufliche Etablierung)
- 50 Jahre (Goldener Geburtstag - Lebenserfahrung)

Für Hochzeitstage: Beschreibe wichtige Jahrestage mit ihren traditionellen Namen, z.B.:
- 1 Jahr (Papierhochzeit - noch zerbrechlich)
- 5 Jahre (Holzhochzeit - erste Festigkeit)
- 10 Jahre (Rosenhochzeit - Liebe blüht)
- 25 Jahre (Silberhochzeit - wertvolle Verbindung)
- 50 Jahre (Goldene Hochzeit - unvergängliche Liebe)

Für individuelle Anlässe: Beschreibe allgemeine Meilensteine, z.B.:
- 5 Jahre (Lustrum - erste Bewährung)
- 10 Jahre (Dekade - Beständigkeit)
- 25 Jahre (Vierteljahrhundert - lange Treue)

Erstelle eine ähnliche Beschreibung mit 10-15 wichtigen Zahlen und ihren Bedeutungen.`;
	} else {
		return `Create a detailed description of important numbers and their meanings for ${eventLabel}.

For birthdays: Describe important life milestones with their cultural significance, e.g.:
- 16 years (Sweet Sixteen - transition to youth)
- 18 years (Coming of age - legal independence)
- 21 years (Adult milestone - traditional maturity)
- 30 years (Life milestone - professional establishment)
- 50 years (Golden birthday - life experience)

For wedding anniversaries: Describe important anniversaries with their traditional names, e.g.:
- 1 year (Paper anniversary - still fragile)
- 5 years (Wood anniversary - gaining strength)
- 10 years (Tin anniversary - flexible yet strong)
- 25 years (Silver anniversary - precious connection)
- 50 years (Golden anniversary - enduring love)

For custom events: Describe general milestones, e.g.:
- 5 years (Lustrum - first proving)
- 10 years (Decade - consistency)
- 25 years (Quarter century - long loyalty)

Create a similar description with 10-15 important numbers and their meanings.`;
	}
}

function extractValuesFromAIResponse(text: string): number[] {
	// Extrahiere Zahlen aus der AI-Antwort
	const numbers = text.match(/\d+/g);
	if (!numbers) return [];

	return numbers
		.map((n) => parseInt(n))
		.filter((n) => !isNaN(n) && n > 0 && n <= 200)
		.sort((a, b) => a - b)
		.slice(0, 20); // Max 20 Werte
}
