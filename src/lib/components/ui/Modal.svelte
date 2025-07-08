<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		isOpen = $bindable(false),
		title,
		size = 'lg',
		closable = true,
		onClose,
		children,
		actions
	}: {
		isOpen?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closable?: boolean;
		onClose?: () => void;
		children: Snippet;
		actions?: Snippet;
	} = $props();

	const sizeClasses = {
		sm: 'w-11/12 max-w-md',
		md: 'w-11/12 max-w-lg',
		lg: 'w-11/12 max-w-2xl',
		xl: 'w-11/12 max-w-4xl',
		full: 'w-11/12 max-w-6xl'
	};

	const closeModal = () => {
		isOpen = false;
		onClose?.();
	};

	const handleBackdropClick = (e: Event) => {
		if (e.target === e.currentTarget && closable) {
			closeModal();
		}
	};
</script>

{#if isOpen}
	<div class="modal-open modal">
		<div
			class="modal-box {sizeClasses[size]} relative"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
		>
			{#if closable}
				<button
					class="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
					onclick={closeModal}
					aria-label="Schließen"
				>
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
			{/if}

			{#if title}
				<h3 id="modal-title" class="mb-4 text-lg font-bold">{title}</h3>
			{/if}

			<div class="modal-content">
				{@render children()}
			</div>

			{#if actions}
				<div class="modal-action">
					{@render actions()}
				</div>
			{/if}
		</div>

		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={handleBackdropClick}
			onkeydown={(e) => {
				if (e.key === 'Escape' && closable) closeModal();
				if (e.key === 'Enter' || e.key === ' ') handleBackdropClick(e);
			}}
		></div>
	</div>
{/if}
