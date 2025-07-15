<script lang="ts">
	interface Props {
		data: {
			settings: Record<string, unknown>;
			[key: string]: unknown;
		};
	}

	let { data }: Props = $props();
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
				d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
		Beziehungs-spezifische Prompts
	</h3>

	<!-- name of each tab group should be unique -->
	<div class="tabs tabs-lift">
		<label class="tab">
			<input type="radio" name="relation_prompts_tabs" checked />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
				/>
			</svg>
			Freunde
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptRelationFriend">
					<span class="label-text font-medium">Prompt für Freunde</span>
					<span class="label-text-alt">Freundlich, vertraut, persönliche Anrede</span>
				</label>
				<textarea
					id="promptRelationFriend"
					name="promptRelationFriend"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für Freunde..."
					value={data.settings.ai?.promptRelationFriend || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="relation_prompts_tabs" />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
				/>
			</svg>
			Familie
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptRelationFamily">
					<span class="label-text font-medium">Prompt für Familie</span>
					<span class="label-text-alt">Warm, familiär, Verbundenheit</span>
				</label>
				<textarea
					id="promptRelationFamily"
					name="promptRelationFamily"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für Familie..."
					value={data.settings.ai?.promptRelationFamily || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="relation_prompts_tabs" />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
				/>
			</svg>
			Partner
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptRelationPartner">
					<span class="label-text font-medium">Prompt für Partner</span>
					<span class="label-text-alt">Liebevoll, romantisch, intim</span>
				</label>
				<textarea
					id="promptRelationPartner"
					name="promptRelationPartner"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für Partner..."
					value={data.settings.ai?.promptRelationPartner || ''}
				></textarea>
			</div>
		</div>

		<label class="tab">
			<input type="radio" name="relation_prompts_tabs" />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="me-2 size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.25m0 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75m-6 0V9a2.25 2.25 0 0 1 2.25-2.25H15a2.25 2.25 0 0 1 2.25 2.25v5.25m-6 0h6"
				/>
			</svg>
			Kollegen
		</label>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<div class="form-control">
				<label class="label" for="promptRelationColleague">
					<span class="label-text font-medium">Prompt für Kollegen</span>
					<span class="label-text-alt">Professionell, respektvoll, höflich</span>
				</label>
				<textarea
					id="promptRelationColleague"
					name="promptRelationColleague"
					class="textarea-bordered textarea w-full"
					rows="6"
					placeholder="Prompt für Kollegen..."
					value={data.settings.ai?.promptRelationColleague || ''}
				></textarea>
			</div>
		</div>
	</div>
</div>
