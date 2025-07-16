import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Railway deployment with Node.js adapter
		adapter: adapter({
			out: 'build',
			precompress: true,
			envPrefix: 'VITE_'
		})
	}
};

export default config;
