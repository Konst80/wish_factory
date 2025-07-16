<script lang="ts">
	import type { WishFormState } from '$lib/types/Wish';

	type Props = {
		formData: WishFormState;
		showPreview: boolean;
	};

	const { formData, showPreview }: Props = $props();
</script>

<!-- Preview Card -->
{#if showPreview && formData.text}
	<div class="card bg-base-100 border-base-200 mb-6 border shadow-xl">
		<div class="card-body">
			<h3 class="card-title text-lg">
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
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				Vorschau
			</h3>
			<div class="divider my-2"></div>
			<div class="mockup-window border-base-300 bg-base-200 border">
				<div class="bg-base-200 px-4 py-6">
					<div class="space-y-4">
						<div>
							<div class="mb-2 flex items-center gap-2">
								<div class="badge badge-primary badge-sm">Haupttext</div>
								<div class="badge badge-outline badge-sm">{formData.text.length} Zeichen</div>
							</div>
							<p class="text-sm leading-relaxed">{formData.text}</p>
						</div>
						{#if formData.belated}
							<div class="divider my-2"></div>
							<div>
								<div class="mb-2 flex items-center gap-2">
									<div class="badge badge-warning badge-sm">Nachträglicher Wunsch</div>
								</div>
								<p class="text-sm leading-relaxed opacity-80">
									Dieser Wunsch ist als nachträglich markiert
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
