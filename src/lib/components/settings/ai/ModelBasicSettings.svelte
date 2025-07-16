<script lang="ts">
	import type { SettingsData } from '$lib/types/Settings.js';

	interface Props {
		data: SettingsData;
	}

	const { data }: Props = $props();
</script>

<div class="bg-base-50 rounded-lg p-4">
	<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="text-primary h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
			/>
		</svg>
		Modell & Grundeinstellungen
	</h3>

	<div class="space-y-6">
		<!-- Model Selection -->
		<div class="form-control max-w-md">
			<label class="label" for="model">
				<span class="label-text flex items-center gap-2 font-medium"> 🤖 KI-Modell </span>
			</label>
			<select
				id="model"
				name="model"
				class="select-bordered select select-lg w-full"
				value={data.settings.ai?.model || 'anthropic/claude-3.5-sonnet'}
			>
				<option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
				<option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
				<option value="openai/gpt-4o">GPT-4o</option>
				<option value="openai/gpt-4o-mini">GPT-4o Mini</option>
				<option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
				<option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B</option>
				<option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
				<option value="google/gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview</option>
				<option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat V3 (Free)</option>
				<option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 (Free)</option>
			</select>
			<div class="label">
				<span class="label-text-alt text-info"> 💡 Über OpenRouter - API-Key aus .env Datei </span>
			</div>
		</div>

		<!-- System Prompt -->
		<div class="form-control">
			<label class="label" for="promptSystem">
				<span class="label-text flex items-center gap-2 font-medium"> 📝 System-Prompt </span>
				<span class="label-text-alt badge badge-outline"> Grundverhalten der KI </span>
			</label>
			<textarea
				id="promptSystem"
				name="promptSystem"
				class="textarea-bordered textarea textarea-lg min-h-[120px] w-full leading-relaxed"
				rows="5"
				placeholder="System-Anweisungen für die KI... 

Beispiel: Du bist ein hilfreicher Assistent für das Erstellen von personalisierten Wünschen und Grüßen. Erstelle warme, authentische und kulturell angemessene Texte."
				value={data.settings.ai?.promptSystem || ''}
			></textarea>
			<div class="label">
				<span class="label-text-alt text-base-content/60">
					💡 Diese Anweisung wird bei jeder KI-Anfrage mitgesendet
				</span>
			</div>
		</div>
	</div>
</div>
