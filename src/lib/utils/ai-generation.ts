import { WishType, EventType, Language, Relation, AgeGroup, WishStatus } from '$lib/types/Wish';
import type { WishFormState } from '$lib/types/Wish';

export type GeneratedWish = {
	id: string;
	type: WishType;
	eventType: EventType;
	relations: Relation[];
	ageGroups: AgeGroup[];
	specificValues: number;
	text: string;
	belated: boolean;
	language: Language;
	status: WishStatus;
	length: string;
};

export type BatchSettings = {
	count: number;
	includeAlternatives: boolean;
	types: string[];
	eventTypes: string[];
	languages: string[];
	relations: string[];
	ageGroups: string[];
	specificValues: number;
	generateForAllAgeGroups: boolean;
	generateForAllRelations: boolean;
};

export async function generateSingleWish(
	formData: WishFormState
): Promise<{ success: boolean; text?: string; error?: string }> {
	try {
		// Validierung vor API-Aufruf
		if (!formData.eventType) {
			return { success: false, error: 'Bitte wählen Sie einen Anlass aus.' };
		}
		if (formData.relations.length === 0) {
			return { success: false, error: 'Bitte wählen Sie mindestens eine Beziehung aus.' };
		}
		if (formData.ageGroups.length === 0) {
			return { success: false, error: 'Bitte wählen Sie mindestens eine Altersgruppe aus.' };
		}

		const response = await fetch('/api/ai/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: formData.type,
				eventType: formData.eventType,
				relations: formData.relations,
				ageGroups: formData.ageGroups,
				specificValues: formData.specificValues || null,
				language: formData.language,
				isBelated: formData.isBelated,
				length: formData.length
			})
		});

		if (!response.ok) {
			if (response.status === 400) {
				const errorData = await response.json();
				return {
					success: false,
					error: errorData.error || 'Ungültige Parameter für die KI-Generierung.'
				};
			} else {
				const textError = await response.text();
				return {
					success: false,
					error: textError || `Server-Fehler: ${response.status} ${response.statusText}`
				};
			}
		}

		const data = await response.json();

		if (data.success && data.wishes && data.wishes.length > 0) {
			const wish = data.wishes[0];
			return { success: true, text: wish.text };
		} else {
			return { success: false, error: data.error || 'Unbekannter Fehler bei der KI-Generierung.' };
		}
	} catch (error) {
		console.error('KI-Generierung fehlgeschlagen:', error);

		// Detaillierte Fehlermeldungen basierend auf dem Error-Typ
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung.'
			};
		} else if (error instanceof SyntaxError) {
			return { success: false, error: 'Serverfehler: Ungültige Antwort erhalten.' };
		} else if (error instanceof Error) {
			if (error.message.includes('timeout')) {
				return {
					success: false,
					error: 'Zeitüberschreitung: Der Server antwortet nicht rechtzeitig.'
				};
			} else if (error.message.includes('abort')) {
				return { success: false, error: 'Anfrage abgebrochen.' };
			} else if (error.message.includes('Invalid AI response format')) {
				return { success: false, error: 'KI-Antwort hat ein ungültiges Format.' };
			} else {
				return { success: false, error: `Fehler: ${error.message}` };
			}
		} else {
			return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
		}
	}
}

export async function generateBatchWishes(
	formData: WishFormState,
	batchSettings: BatchSettings
): Promise<{ success: boolean; wishes?: GeneratedWish[]; error?: string }> {
	try {
		// Determine which values to use for generation - batch settings override main form
		const typesToGenerate = batchSettings.types.length > 0 ? batchSettings.types : [formData.type];
		const eventTypesToGenerate =
			batchSettings.eventTypes.length > 0 ? batchSettings.eventTypes : [formData.eventType];
		const languagesToGenerate =
			batchSettings.languages.length > 0 ? batchSettings.languages : [formData.language];
		const relationsToGenerate =
			batchSettings.relations.length > 0 ? batchSettings.relations : formData.relations;
		const ageGroupsToGenerate =
			batchSettings.ageGroups.length > 0 ? batchSettings.ageGroups : formData.ageGroups;
		const specificValuesToUse =
			batchSettings.specificValues > 0 ? batchSettings.specificValues : formData.specificValues;

		// Validierung
		if (eventTypesToGenerate.length === 0 || !eventTypesToGenerate[0]) {
			return { success: false, error: 'Bitte wählen Sie einen Anlass aus.' };
		}
		if (relationsToGenerate.length === 0) {
			return { success: false, error: 'Bitte wählen Sie mindestens eine Beziehung aus.' };
		}
		if (ageGroupsToGenerate.length === 0) {
			return { success: false, error: 'Bitte wählen Sie mindestens eine Altersgruppe aus.' };
		}

		// Try AI generation first
		try {
			const primaryType = typesToGenerate[0];
			const primaryEventType = eventTypesToGenerate[0];
			const primaryLanguage = languagesToGenerate[0];

			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					type: primaryType,
					eventType: primaryEventType,
					types: typesToGenerate as WishType[],
					eventTypes: eventTypesToGenerate as EventType[],
					languages: languagesToGenerate as Language[],
					relations: relationsToGenerate,
					ageGroups: ageGroupsToGenerate,
					specificValues: specificValuesToUse || null,
					language: primaryLanguage,
					count: batchSettings.count,
					isBatch: true,
					isBelated: formData.isBelated,
					length: formData.length
				})
			});

			if (!response.ok) {
				if (response.status === 400) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Ungültige Parameter für die KI-Generierung.');
				} else {
					throw new Error(`Server-Fehler: ${response.status} ${response.statusText}`);
				}
			}

			const aiResult = await response.json();

			if (aiResult.success && aiResult.wishes && aiResult.wishes.length > 0) {
				console.log(`KI hat ${aiResult.wishes.length} Wünsche generiert`);

				// Convert AI results to our format
				const generatedWishes: GeneratedWish[] = [];
				let idCounter = 1;

				for (const wish of aiResult.wishes) {
					const wishMetadata = wish.metadata || {};

					generatedWishes.push({
						id: `ai-${idCounter++}`,
						type: wishMetadata.type || primaryType,
						eventType: wishMetadata.eventType || primaryEventType,
						relations: wishMetadata.relations || relationsToGenerate,
						ageGroups: wishMetadata.ageGroups || ageGroupsToGenerate,
						specificValues: wish.specificValues || specificValuesToUse || 0,
						text: wish.text,
						belated: wish.belated,
						language: wishMetadata.language || primaryLanguage,
						status: WishStatus.ENTWURF,
						length: 'medium'
					});
				}

				console.log(
					'🔍 Frontend: generatedWishes after AI response:',
					JSON.stringify(generatedWishes, null, 2)
				);

				return { success: true, wishes: generatedWishes };
			} else {
				throw new Error(aiResult.error || 'KI-Generierung lieferte keine Ergebnisse.');
			}
		} catch (aiError) {
			console.error('KI-Generierung fehlgeschlagen:', aiError);
			return { success: false, error: `KI-Generierung fehlgeschlagen: ${aiError}` };
		}
	} catch (error) {
		console.error('Batch-Generierung fehlgeschlagen:', error);
		return { success: false, error: `Fehler bei der Batch-Generierung: ${error}` };
	}
}
