<script lang="ts">
	import type { PageData } from './$types';
	import SettingsTabNavigation from '$lib/components/settings/SettingsTabNavigation.svelte';
	import ProfileTab from '$lib/components/settings/ProfileTab.svelte';
	import NotificationsTab from '$lib/components/settings/NotificationsTab.svelte';
	import PreferencesTab from '$lib/components/settings/PreferencesTab.svelte';
	import AITab from '$lib/components/settings/AITab.svelte';
	import SystemTab from '$lib/components/settings/SystemTab.svelte';
	import PasswordModal from '$lib/components/settings/PasswordModal.svelte';

	let { data, form }: { data: PageData; form: import('./$types.js').ActionData } = $props();

	let activeTab = $state('profile');
	let showSuccessMessage = $state(false);
	let showErrorMessage = $state(false);
	let currentMessage = $state('');
	let showPasswordModal = $state(false);
	let isSubmitting = $state(false);

	// Show form result messages
	$effect(() => {
		if (form?.success) {
			currentMessage = form.message || 'Einstellungen erfolgreich gespeichert!';
			showSuccessMessage = true;
			showErrorMessage = false;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
		} else if (form?.message) {
			currentMessage = form.message;
			showErrorMessage = true;
			showSuccessMessage = false;
			setTimeout(() => {
				showErrorMessage = false;
			}, 5000);
		}
	});

	const tabs = [
		{
			id: 'profile',
			label: 'Profil',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		},
		{
			id: 'notifications',
			label: 'Benachrichtigungen',
			icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
		},
		{
			id: 'preferences',
			label: 'Einstellungen',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
		},
		...(data.user.role === 'Administrator'
			? [
					{
						id: 'ai',
						label: 'KI-Einstellungen',
						icon: 'M13 10V3L4 14h7v7l9-11h-7z'
					}
				]
			: []),
		{
			id: 'system',
			label: 'System',
			icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
		}
	];

	const languages = [
		{ value: 'de', label: 'Deutsch' },
		{ value: 'en', label: 'English' }
	];

	const timezones = [
		{ value: 'Europe/Berlin', label: 'Europa/Berlin (GMT+1)' },
		{ value: 'Europe/London', label: 'Europa/London (GMT+0)' },
		{ value: 'America/New_York', label: 'Amerika/New York (GMT-5)' },
		{ value: 'Asia/Tokyo', label: 'Asien/Tokio (GMT+9)' }
	];

	const themes = [
		{ value: 'light', label: 'Hell' },
		{ value: 'dark', label: 'Dunkel' },
		{ value: 'winter', label: 'Winter' },
		{ value: 'corporate', label: 'Corporate' },
		{ value: 'cyberpunk', label: 'Cyberpunk' },
		{ value: 'business', label: 'Business' },
		{ value: 'emerald', label: 'Emerald' },
		{ value: 'luxury', label: 'Luxury' },
		{ value: 'dracula', label: 'Dracula' },
		{ value: 'nord', label: 'Nord' },
		{ value: 'sunset', label: 'Sunset' },
		{ value: 'autumn', label: 'Autumn' },
		{ value: 'valentine', label: 'Valentine' },
		{ value: 'aqua', label: 'Aqua' }
	];

	function handleTabChange(tabId: string) {
		activeTab = tabId;
	}

	function handleSubmittingChange(submitting: boolean) {
		isSubmitting = submitting;
	}

	function handleMessage(message: string, isError = false) {
		currentMessage = message;
		if (isError) {
			showErrorMessage = true;
			showSuccessMessage = false;
			setTimeout(() => {
				showErrorMessage = false;
			}, 5000);
		} else {
			showSuccessMessage = true;
			showErrorMessage = false;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
		}
	}

	function handlePasswordModalOpen() {
		showPasswordModal = true;
	}

	function handlePasswordModalClose() {
		showPasswordModal = false;
	}
</script>

<svelte:head>
	<title>Einstellungen - Wish Factory</title>
</svelte:head>

<!-- Success Message -->
{#if showSuccessMessage}
	<div class="toast toast-end toast-top">
		<div class="alert alert-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{currentMessage}</span>
		</div>
	</div>
{/if}

<!-- Error Message -->
{#if showErrorMessage}
	<div class="toast toast-end toast-top">
		<div class="alert alert-error">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{currentMessage}</span>
		</div>
	</div>
{/if}

<!-- Page Header -->
<div class="mb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex-1">
			<h1 class="text-base-content mb-2 flex items-center gap-3 text-3xl font-bold">
				<div class="bg-primary/10 rounded-lg p-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
					</svg>
				</div>
				Einstellungen
			</h1>
			<p class="text-base-content/70 text-lg">
				Verwalten Sie Ihre Profil-, System- und KI-Einstellungen
			</p>
		</div>
	</div>
</div>

<!-- Settings Navigation -->
<SettingsTabNavigation {activeTab} {tabs} onTabChange={handleTabChange} />

<!-- Settings Content -->
<div class="max-w-4xl mx-auto">
		{#if activeTab === 'profile'}
			<ProfileTab
				data={data as any}
				{languages}
				{timezones}
				{isSubmitting}
				onSubmittingChange={handleSubmittingChange}
				onMessage={handleMessage}
				onPasswordModalOpen={handlePasswordModalOpen}
			/>
		{:else if activeTab === 'notifications'}
			<NotificationsTab
				data={data as any}
				{isSubmitting}
				onSubmittingChange={handleSubmittingChange}
				onMessage={handleMessage}
			/>
		{:else if activeTab === 'preferences'}
			<PreferencesTab
				data={data as any}
				{themes}
				{languages}
				{isSubmitting}
				onSubmittingChange={handleSubmittingChange}
				onMessage={handleMessage}
			/>
		{:else if activeTab === 'ai'}
			<AITab
				data={data as any}
				{isSubmitting}
				onSubmittingChange={handleSubmittingChange}
				onMessage={handleMessage}
			/>
		{:else if activeTab === 'system'}
			<SystemTab
				data={data as any}
				{isSubmitting}
				onSubmittingChange={handleSubmittingChange}
				onMessage={handleMessage}
			/>
		{/if}
</div>

<!-- Password Change Modal -->
<PasswordModal
	showModal={showPasswordModal}
	{isSubmitting}
	onClose={handlePasswordModalClose}
	onSubmittingChange={handleSubmittingChange}
	onMessage={handleMessage}
/>