<script lang="ts">
	import { onMount } from 'svelte';
	import {
		activeWishLanguages,
		wishLanguagesLoading,
		wishLanguagesError,
		loadActiveWishLanguages,
		formatLanguageDisplay
	} from '$lib/stores/wishLanguages';

	interface Props {
		selectedLanguage: string;
		onLanguageChange: (language: string) => void;
		label?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
	}

	const {
		selectedLanguage,
		onLanguageChange,
		label = 'Sprache',
		name = 'language',
		required = true,
		disabled = false,
		error = ''
	}: Props = $props();

	onMount(() => {
		loadActiveWishLanguages();
	});

	// Automatisch die erste verfügbare Sprache setzen, wenn keine ausgewählt ist
	$effect(() => {
		if ($activeWishLanguages.length > 0 && !selectedLanguage) {
			onLanguageChange($activeWishLanguages[0].code);
		}
	});

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onLanguageChange(target.value);
	}
</script>

<div class="form-control">
	<label class="label" for={name}>
		<span class="label-text font-medium">
			{label}
			{#if required}<span class="text-error">*</span>{/if}
		</span>
	</label>

	{#if $wishLanguagesLoading}
		<select id={name} {name} class="select select-bordered select-lg w-full" {disabled} {required}>
			<option value="">Sprachen werden geladen...</option>
		</select>
	{:else if $wishLanguagesError}
		<div class="alert alert-error">
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			Fehler beim Laden der Sprachen: {$wishLanguagesError}
		</div>
	{:else if $activeWishLanguages.length === 0}
		<select id={name} {name} class="select select-bordered select-lg w-full" {disabled} {required}>
			<option value="">Keine aktiven Sprachen verfügbar</option>
		</select>
		<div class="label">
			<span class="label-text-alt text-warning">
				Bitte wenden Sie sich an einen Administrator, um Sprachen zu konfigurieren.
			</span>
		</div>
	{:else}
		<select
			id={name}
			{name}
			class="select select-bordered select-lg w-full"
			class:select-error={error}
			value={selectedLanguage}
			onchange={handleChange}
			{disabled}
			{required}
		>
			{#if !required}
				<option value="">-- Bitte wählen --</option>
			{/if}
			{#each $activeWishLanguages as language (language.code)}
				<option value={language.code}>
					{formatLanguageDisplay(language)}
				</option>
			{/each}
		</select>
	{/if}

	{#if error}
		<div class="label">
			<span class="label-text-alt text-error">{error}</span>
		</div>
	{/if}
</div>
