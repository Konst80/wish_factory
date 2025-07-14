export function resetSettings(): void {
	if (confirm('Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?')) {
		location.reload();
	}
}

export function exportSettings(settings: any): void {
	const dataStr = JSON.stringify(settings, null, 2);
	const dataBlob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'wish_factory_settings.json';
	link.click();
	URL.revokeObjectURL(url);
}

export function saveSettings(): void {
	// This function handles the general save action
	// Individual form submissions handle their own saving
	alert('Bitte verwenden Sie die Speichern-Buttons in den jeweiligen Abschnitten.');
}

export function setPreset(preset: string): void {
	const temperatureSlider = document.getElementById('temperature') as HTMLInputElement;
	const topPSlider = document.getElementById('topP') as HTMLInputElement;
	const maxTokensSlider = document.getElementById('maxTokens') as HTMLInputElement;
	const frequencyPenaltySlider = document.getElementById('frequencyPenalty') as HTMLInputElement;

	if (!temperatureSlider || !topPSlider || !maxTokensSlider || !frequencyPenaltySlider) return;

	switch (preset) {
		case 'precise':
			temperatureSlider.value = '0.3';
			topPSlider.value = '0.7';
			maxTokensSlider.value = '1500';
			frequencyPenaltySlider.value = '0.2';
			break;
		case 'balanced':
			temperatureSlider.value = '0.8';
			topPSlider.value = '0.9';
			maxTokensSlider.value = '2000';
			frequencyPenaltySlider.value = '0.1';
			break;
		case 'creative':
			temperatureSlider.value = '1.2';
			topPSlider.value = '0.95';
			maxTokensSlider.value = '2500';
			frequencyPenaltySlider.value = '0.0';
			break;
		case 'default':
			temperatureSlider.value = '0.8';
			topPSlider.value = '0.9';
			maxTokensSlider.value = '2000';
			frequencyPenaltySlider.value = '0.1';
			break;
	}

	// Update the displayed values (badges)
	temperatureSlider.dispatchEvent(new Event('input'));
	topPSlider.dispatchEvent(new Event('input'));
	maxTokensSlider.dispatchEvent(new Event('input'));
	frequencyPenaltySlider.dispatchEvent(new Event('input'));
}

export function insertPlaceholder(textareaId: string, placeholder: string): void {
	const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
	if (!textarea) return;

	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const value = textarea.value;

	// Insert the placeholder at cursor position
	const newValue = value.substring(0, start) + placeholder + value.substring(end);
	textarea.value = newValue;

	// Move cursor to end of inserted text
	const newCursorPos = start + placeholder.length;
	textarea.setSelectionRange(newCursorPos, newCursorPos);

	// Focus the textarea
	textarea.focus();
}

// Generate specific values using AI
export async function generateSpecificValues(
	eventType: string,
	language: string,
	onSuccess: (message: string) => void,
	onError: (message: string) => void
): Promise<void> {
	try {
		console.log(`🤖 Generating specific values for ${eventType} (${language})`);

		const response = await fetch('/api/ai/suggest-values', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				eventType,
				language
			})
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const result = await response.json();

		if (result.success && result.description) {
			// Get the appropriate form field
			const fieldName = `specificValues${eventType.charAt(0).toUpperCase() + eventType.slice(1)}${language.charAt(0).toUpperCase() + language.slice(1)}`;
			const field = document.querySelector(
				`textarea[name="${fieldName}"]`
			) as HTMLTextAreaElement;

			if (field) {
				field.value = result.description;
				console.log(`✅ Generated description for ${eventType} (${language})`);
				onSuccess(`KI-Vorschläge für ${eventType} (${language}) generiert`);
			} else {
				console.error('❌ Could not find form field:', fieldName);
				onError('Fehler beim Anwenden der KI-Vorschläge');
			}
		} else {
			console.error('❌ No description in response:', result);
			onError('Keine KI-Vorschläge erhalten');
		}
	} catch (error) {
		console.error('❌ Error generating specific values:', error);
		onError('Fehler beim Generieren der KI-Vorschläge. Versuchen Sie es später erneut.');
	}
}