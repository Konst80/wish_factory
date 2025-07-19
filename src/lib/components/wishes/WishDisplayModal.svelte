<script lang="ts">
	import { WishType, EventType, WishStatus, Relation, AgeGroup } from '$lib/types/Wish';
	import type { Wish } from '$lib/types/Wish';

	interface Props {
		wish: Wish | null;
		isOpen: boolean;
		onClose: () => void;
		onRelease?: (wishId: string) => void;
		onEdit?: (wish: Wish) => void;
	}

	const { wish, isOpen, onClose, onRelease, onEdit }: Props = $props();

	// Status badge styles
	const statusStyles: Record<WishStatus, string> = {
		Entwurf: 'badge-warning',
		'Zur Freigabe': 'badge-info',
		Freigegeben: 'badge-success',
		Archiviert: 'badge-neutral'
	};

	// Event type icons
	const eventTypeIcons: Record<EventType, string> = {
		birthday: '🎂',
		anniversary: '💐',
		custom: '🎉'
	};

	// German translations for display
	const typeLabels = {
		[WishType.NORMAL]: 'Normal',
		[WishType.HEARTFELT]: 'Herzlich',
		[WishType.FUNNY]: 'Humorvoll'
	};

	const eventTypeLabels = {
		[EventType.BIRTHDAY]: 'Geburtstag',
		[EventType.ANNIVERSARY]: 'Jubiläum',
		[EventType.CUSTOM]: 'Individuell'
	};

	const relationLabels = {
		[Relation.FRIEND]: 'Freund/in',
		[Relation.FAMILY]: 'Familie',
		[Relation.PARTNER]: 'Partner/in',
		[Relation.COLLEAGUE]: 'Kollege/in'
	};

	const ageGroupLabels = {
		[AgeGroup.ALL]: 'Alle Altersgruppen',
		[AgeGroup.YOUNG]: 'Jung (bis 30)',
		[AgeGroup.MIDDLE]: 'Mittel (30-60)',
		[AgeGroup.SENIOR]: 'Senior (60+)'
	};

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function closeModal() {
		onClose();
	}

	// Close modal when clicking outside
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	// Close modal on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && wish}
	<div class="modal modal-open" onclick={handleBackdropClick}>
		<div class="modal-box max-w-4xl">
			<!-- Modal Header -->
			<div class="mb-6 flex items-start justify-between">
				<div class="flex items-start gap-4">
					<div
						class="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
					>
						<span class="text-2xl">{eventTypeIcons[wish.eventType]}</span>
					</div>
					<div class="min-w-0 flex-1">
						<h2 class="mb-2 text-2xl leading-tight font-bold">
							{eventTypeLabels[wish.eventType]}
						</h2>
						<div class="text-base-content/70 flex items-center gap-2 text-sm">
							<span class="bg-base-200 rounded-md px-2 py-1 font-medium"
								>{typeLabels[wish.type]}</span
							>
							<span class="bg-base-200 rounded-md px-2 py-1 font-mono tracking-wider uppercase"
								>{wish.language}</span
							>
							<div class="badge {statusStyles[wish.status]} badge-sm">
								{wish.status}
							</div>
							{#if wish.belated}
								<span class="bg-warning/20 text-warning rounded-md px-2 py-1 font-medium"
									>Nachträglich</span
								>
							{/if}
						</div>
					</div>
				</div>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={closeModal}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Target Groups -->
			<div class="mb-6">
				<h3 class="mb-4 text-lg font-semibold">Zielgruppen</h3>
				<div class="bg-base-100 border-base-300 rounded-lg border p-4 shadow-sm">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<h4 class="text-base-content/80 mb-2 flex items-center gap-2 text-sm font-semibold">
								<span class="bg-primary h-2 w-2 rounded-full"></span>
								Beziehungen
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each wish.relations as relation (relation)}
									<span class="badge badge-primary badge-sm">{relationLabels[relation]}</span>
								{/each}
							</div>
						</div>
						<div>
							<h4 class="text-base-content/80 mb-2 flex items-center gap-2 text-sm font-semibold">
								<span class="bg-secondary h-2 w-2 rounded-full"></span>
								Altersgruppen
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each wish.ageGroups as ageGroup (ageGroup)}
									<span class="badge badge-secondary badge-sm">{ageGroupLabels[ageGroup]}</span>
								{/each}
							</div>
						</div>
						{#if wish.specificValues && wish.specificValues.length > 0}
							<div class="border-base-300 border-t pt-3 md:col-span-2">
								<h4 class="text-base-content/80 mb-2 flex items-center gap-2 text-sm font-semibold">
									<span class="bg-accent h-2 w-2 rounded-full"></span>
									Spezifische Werte
								</h4>
								<div class="flex flex-wrap gap-2">
									{#each wish.specificValues as value (value)}
										<span class="badge badge-accent badge-sm">{value}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Main Text -->
			<div class="mb-6">
				<h3 class="mb-4 text-lg font-semibold">Wunschtext</h3>
				<div class="bg-base-100 border-base-300 overflow-hidden rounded-lg border shadow-sm">
					<div class="p-4">
						<p class="text-base leading-relaxed whitespace-pre-wrap">
							{wish.text}
						</p>
					</div>
					<div class="bg-base-200/50 border-base-300 border-t px-4 py-3">
						<div class="flex items-center justify-between">
							<button class="btn btn-outline btn-sm" onclick={() => copyToClipboard(wish.text)}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								Kopieren
							</button>
							<div class="text-base-content/60 flex items-center gap-4 text-sm">
								<div class="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-7 8h6m-7 4h6m-7-8h6m-7-4h6"
										/>
									</svg>
									<span>Erstellt: {formatDate(wish.createdAt)}</span>
								</div>
								<div class="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
									<span class="font-mono">ID: {wish.id.slice(0, 8)}...</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Release Action Section (prominent) -->
			{#if wish.status === 'Freigegeben' && onRelease}
				<div class="border-base-300 bg-accent/5 mb-6 rounded-lg border p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="bg-accent/15 text-accent flex h-10 w-10 items-center justify-center rounded-lg"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									/>
								</svg>
							</div>
							<div>
								<h4 class="text-base font-semibold">WishSnap Freigabe</h4>
								<p class="text-base-content/70 text-sm">
									Geben Sie diesen Wunsch für die WishSnap-Plattform frei
								</p>
							</div>
						</div>
						<button
							class="btn btn-accent"
							title="Für WishSnap freigeben"
							onclick={() => onRelease?.(wish.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
							Für WishSnap freigeben
						</button>
					</div>
				</div>
			{/if}

			<!-- Modal Actions -->
			<div class="modal-action">
				{#if onEdit}
					<button class="btn btn-primary btn-sm" onclick={() => onEdit?.(wish)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
						Bearbeiten
					</button>
				{:else}
					<a href="/dashboard/wishes/{wish.id}/edit" class="btn btn-primary btn-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
						Bearbeiten
					</a>
				{/if}
				<a href="/dashboard/wishes/{wish.id}" class="btn btn-outline btn-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14l-4 4-2-2"
						/>
					</svg>
					Vollansicht
				</a>
				<button class="btn btn-ghost" onclick={closeModal}>Schließen</button>
			</div>
		</div>
	</div>
{/if}
